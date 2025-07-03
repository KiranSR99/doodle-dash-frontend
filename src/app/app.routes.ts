import { Routes } from '@angular/router';
import { TimerComponent } from './shared/components/timer/timer.component';
import { TestComponent } from './shared/components/test/test.component';

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
        path: 'timer',
        component: TimerComponent
    },
    {
        path: 'test',
        component: TestComponent
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];
