import { Routes } from "@angular/router";

export const SOLO_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./solo.component').then(m => m.SoloComponent)
    }
];