import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { StockComponent } from './features/stock/stock.component';
import { EventListComponent } from './features/events/event-list/event-list.component';
import { OSListComponent } from './features/os/os-list/os-list.component';
import { UserManagementComponent } from './features/admin/user-management.component';
import { OperationalUnitsComponent } from './features/admin/operational-units.component'; // <-- IMPORTAR AQUI
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'eventos', component: EventListComponent, canActivate: [authGuard] },
  { path: 'ordens', component: OSListComponent, canActivate: [authGuard] },
  { path: 'estoque', component: StockComponent, canActivate: [authGuard] }, 
  { path: 'usuarios', component: UserManagementComponent, canActivate: [authGuard] }, 
  { path: 'unidades', component: OperationalUnitsComponent, canActivate: [authGuard] }, // <-- ADICIONAR A ROTA
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];