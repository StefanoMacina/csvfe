import moment from 'moment';
import { LottieComponent } from 'ngx-lottie';
import { MessageService } from 'primeng/api';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { catchError, Subscription, throwError } from 'rxjs';

import { DatePipe } from '@angular/common';
import { HttpClient, HttpClientModule, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { environment } from '../../environments/environment';
import { SseService } from '../services/sse.service';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [
    TableModule,
    HttpClientModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    CalendarModule,
    FormsModule,
    DatePipe,
    ToastModule,
    SkeletonModule,
    LottieComponent,
    DialogModule,
    ProgressBarModule,
  ],
  templateUrl: './error.component.html',
  styleUrl: './error.component.scss',
  providers: [MessageService, HttpClient, SseService],
  encapsulation: ViewEncapsulation.None,
})
export class ErrorComponent {
  // array di oggetti contenente i record
  alarmData = [];

  // oggetto subscription chiamata HTTP alle API
  httpSubscription: Subscription = Subscription.EMPTY;

  // variabili che rappresentano lo stato di caricamento della tabella
  // loadingUi ed errorUi sono soggetti all'eventuale ritardo specificato da setLoadingDelay in refreshData()
  loading: boolean = true;
  loadingUi: boolean = false;
  error: boolean = false;
  errorUi: boolean = false;

  // variabili che rappresentano lo stato di sincronizzazione dei dati
  synching: boolean = false;
  syncProgress: number = 0;

  // variabile per gestire il delay di loadingUi
  loadingDelay: any = null;

  // variabili che rappresentano lo stato focus dei campi di input global filter e selettore range
  isInputGlobalFocused: boolean = false;
  isInputDateFocused: boolean = false;

  // oggetto contenente i parametri per sorting, filtering e paging della tabella
  tableParams: {
    sortField: string;
    sortOrder: number;
    rows: number;
    page: number;
    rowsPerPageOptions: number[];
    totalRecords: number;
    dateRange: Date[] | null;
    globalSearch: string;
  } = {
      sortField: 'date',
      sortOrder: -1,
      rows: 10,
      page: 0,
      rowsPerPageOptions: [5, 10, 15, 20],
      totalRecords: 0,
      dateRange: null,
      globalSearch: '',
    };

  constructor(
    private http: HttpClient,
    private toasts: MessageService,
    private sse: SseService
  ) { }

  ngOnDestroy(): void {
    this.httpSubscription.unsubscribe();
    this.sse.close();
  }

  // metodo per aggiornare i dati
  async refreshData(
    setLoadingState: boolean = true,
    setLoadingDelay: number = 200
  ) {
    this.loading = true;
    this.error = false;
    this.loadingDelay = setTimeout(() => {
      this.errorUi = false;
      this.loadingUi = setLoadingState;
    }, setLoadingDelay);

    this.httpSubscription.unsubscribe();

    let params = new HttpParams();

    if (this.tableParams.sortField) {
      params = params.append('orderBy', this.tableParams.sortField);
      params = params.append('dir', this.tableParams.sortOrder);
    }

    if (this.tableParams.globalSearch) {
      params = params.append('globalfilter', this.tableParams.globalSearch);
    }

    params = params.append('page', this.tableParams.page);
    params = params.append('size', this.tableParams.rows);

    if (this.tableParams.dateRange) {
      if (this.tableParams.dateRange[0]) {
        params = params.append(
          'fromDate',
          moment(this.tableParams.dateRange[0]).format('YYYY-MM-DD')
        );
      }
      if (this.tableParams.dateRange[1]) {
        params = params.append(
          'toDate',
          moment(this.tableParams.dateRange[1]).format('YYYY-MM-DD')
        );
      }
    }

    this.httpSubscription = this.http
      .get(environment.API_URL + 'pagerrlogs', { params })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          let errorMessage = 'Si è verificato un problema';

          if (error.status === 0) {
            errorMessage = 'Si è verificato un problema di connessione';
          } else if (error.status === 400) {
            errorMessage = 'Richiesta non valida';
          } else if (error.status === 401 || error.status === 403) {
            errorMessage = 'Accesso non autorizzato';
          } else if (error.status === 404) {
            errorMessage = 'Risorsa non trovata';
          } else if (error.status === 500) {
            errorMessage = 'Errore interno del server';
          } else {
            errorMessage = error.message;
          }

          this.toasts.add({
            severity: 'error',
            summary:
              'Errore ' +
              (error.status == 0 || error.status === undefined || !error.status
                ? ''
                : error.status),
            detail: errorMessage,
            life: 5000,
          });

          this.loading = false;
          this.error = true;
          this.loadingUi = false;
          this.errorUi = true;
          clearTimeout(this.loadingDelay);
          return throwError(
            () => new Error('Something bad happened; please try again later.')
          );
        })
      )
      .subscribe((res: any) => {
        this.alarmData = res?.content;
        this.tableParams.totalRecords = res?.totalElements ?? 0;
        this.loading = false;
        this.error = false;
        this.loadingUi = false;
        this.errorUi = false;
        clearTimeout(this.loadingDelay);
      });
  }

  // metodo per pulire i filtri
  clear() {
    this.tableParams.globalSearch = '';
    this.tableParams.dateRange = null;
    this.refreshData();
  }

  // evento successivo alla selezione delle date
  dateRangeChanged(e: any) {
    this.tableParams.dateRange = e;
    this.refreshData();
  }

  // evento chiamato a ogni sort, filter o paging, per gestirli tramite API e non da client
  customSFP(e: TableLazyLoadEvent) {
    // aggiorna rows in tableparams se impostate, altrimenti default 10
    if (e.rows) {
      this.tableParams.rows = e.rows;
    } else {
      this.tableParams.rows = 10;
    }

    // calcola il numero della pagina corrente
    this.tableParams.page = (e.first ?? 0) / this.tableParams.rows;

    // aggiorna sortField in tableParams se impostato, altrimenti default id
    if (e.sortField && !Array.isArray(e.sortField)) {
      this.tableParams.sortField = e.sortField;
    } else {
      this.tableParams.sortField = 'id';
    }

    // aggiorna sortOrder in tableParams se impostato, altrimenti default -1 (desc)
    if (e.sortOrder) {
      this.tableParams.sortOrder = e.sortOrder;
    } else {
      this.tableParams.sortOrder = -1;
    }
    this.refreshData();
  }

  /*
    Funzione per richiedere sincronizzazione (lettura csv e import nel database)
    Tramite SSE riceve stato di avanzamento in real time e, al completamento, aggiorna i dati in tabella

        evento    |      valore      |                        descrizione
    -------------------------------------------------------------------------------------------
    progress      |      % o -1     |  int contenente % di avanzamento (0-100) o -1 per indeterminato
    complete      |     * (any)     |  quando l'operazione è completata e i dati possono essere aggiornati
    error         |      errmsg     |  stringa contenente il messaggio di errore
  */
  syncData() {
    if (!this.sse.isConnected) {
      this.syncProgress = -1;
      this.synching = true;
      this.sse
        .connect(environment.API_URL + 'sync', {}, [
          'progress',
          'complete',
          'error',
        ])
        .subscribe({
          next: async (evt: MessageEvent) => {
            switch (evt.type) {
              case '_OPEN':
                console.log("Conn. open");
                break;
              case 'progress':
                this.syncProgress = evt.data;
                break;
              case 'complete':
                this.sse.close();
                this.refreshData(true, 700);
                await new Promise((resolve) => setTimeout(resolve, 700));
                this.synching = false;
                this.syncProgress = 0;
                break;
              case 'error':
                this.synching = false;
                this.sse.close();
                this.toasts.add({
                  severity: 'error',
                  summary: 'Si è verificato un errore',
                  detail: evt.data,
                  life: 5000,
                });
                break;
            }
          },
          error: (error) => {
            console.log(error);
            this.sse.close();
            this.synching = false;
            this.toasts.add({
              severity: 'error',
              summary: 'Errore',
              detail: 'Si è verificato un errore durante la sincronizzazione',
              life: 5000,
            });
          },
        });
    }
  }
}
