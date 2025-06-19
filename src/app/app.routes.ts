import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
    },
    {
        path: 'play-solo',
        loadComponent: () => import('./components/play-solo/play-solo.component').then(m => m.PlaySoloComponent)
    },
    {
        path: 'room-entry',
        loadComponent: () => import('./components/room-entry/room-entry.component').then(m => m.RoomEntryComponent)
    },
    {
        path: 'room/:roomCode',
        loadComponent: () => import('./components/lobby/lobby.component').then(m => m.LobbyComponent)
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];
