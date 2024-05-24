import { Injectable, NgZone } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SseService {
  private eventSource: EventSource | null = null;
  isConnected: boolean = false;

  // Zone necessario perchè gli SSE sono asincroni e fuori dal change detection scope di angular
  constructor(private zone: NgZone) {}

  // Metodo per stabilire la connessione a un endpoint SSE e riceverne i messaggi/eventi
  connect(
    url: string,
    options: EventSourceInit,
    eventNames: string[] = []
  ): Observable<any> {
    this.eventSource = new EventSource(url, options);
    this.isConnected = true;
    return new Observable((subscriber: Subscriber<any>) => {
      if (!this.eventSource) {
        return;
      }
      this.eventSource.onerror = (error) => {
        this.zone.run(() => subscriber.error(error));
        this.isConnected = false;
      };
      this.eventSource.onopen = () => {
        this.zone.run(() => subscriber.next({type: '_OPEN'}));
      };
      eventNames.forEach((event: string) => {
        if (this.eventSource) {
          this.eventSource.addEventListener(event, (data: MessageEvent) => {
            this.zone.run(() => subscriber.next(data));
          });
        }
      });
    });
  }

  // Metodo per chiudere la connessione
  close(): void {
    if (!this.eventSource) {
      return;
    }

    this.eventSource.close();
    this.isConnected = false;
    this.eventSource = null;
  }
}
