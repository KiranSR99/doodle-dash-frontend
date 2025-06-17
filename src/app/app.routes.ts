import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
    },
    {
        path: 'play-solo',
        loadComponent: () => import('./components/drawing-canvas/drawing-canvas.component').then(m => m.DrawingCanvasComponent)
    },
    {
        path: 'handle-room',
        loadComponent: () => import('./components/handle-room/handle-room.component').then(m => m.HandleRoomComponent)
    },
    {
        path: 'room/:roomCode',
        loadComponent: () => import('./components/game-room/game-room.component').then(m => m.GameRoomComponent)
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];
