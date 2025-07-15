import { Routes } from "@angular/router";
import { GameComponent } from "./game/game.component";

export const MULTIPLAYER_ROUTES: Routes = [
    {
        path: 'room-entry',
        loadComponent: () => import('./room-entry/room-entry.component').then(m => m.RoomEntryComponent)
    },
    {
        path: 'lobby/:roomCode',
        loadComponent: () => import('./lobby/lobby.component').then(m => m.LobbyComponent)
    },
    {
        path: 'game/:roomCode',
        loadComponent: () => import('./game/game.component').then(m => m.GameComponent)
    },
    {
        path: 'game',
        component: GameComponent
    }
];