import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
    },
    {
        path: 'solo',
        loadChildren: () => import('./features/solo/solo.routes').then(m => m.SOLO_ROUTES)
    },
    {
        path: 'multiplayer',
        loadChildren: () => import('./features/multiplayer/multiplayer.routes').then(m => m.MULTIPLAYER_ROUTES)
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];
