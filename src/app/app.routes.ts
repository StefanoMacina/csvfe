import { Routes } from '@angular/router';
import { ProduzioneComponent } from './produzione/produzione.component';
import { ErrorComponent } from './error/error.component';
import { ErrorpageComponent } from './errorpage/errorpage.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'produzione',
  },
  {
    path: 'produzione',
    component: ProduzioneComponent,
    title: 'Produzione - Visualizer',
  },
  {
    path: 'errori',
    component: ErrorComponent,
    title: 'Errori - Visualizer',
  },
  {
    path: '**',
    component: ErrorpageComponent,
    pathMatch: 'full',
    title: 'Errore - Visualizer',
  },
];
