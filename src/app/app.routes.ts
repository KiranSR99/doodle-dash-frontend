import { Routes } from '@angular/router';
import { TimerComponent } from './shared/components/timer/timer.component';
import { TestComponent } from './shared/components/test/test.component';
import { RoundDetailComponent } from './shared/components/round-detail/round-detail.component';
import { ScratchComponent } from './shared/components/scratch/scratch.component';

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
        path: 'detail',
        component: RoundDetailComponent
    },
    {
        path: 'scratch',
        component: ScratchComponent
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];
