import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserStore } from '../stores/user.store';

export const authGuard: CanActivateFn = () => {
  const userStore = inject(UserStore);
  const router = inject(Router);

  // Consulta a Store (Signal ou Método) para saber se existe uma sessão válida ativa
  const isAuth = userStore.isAuthenticated();

  if (isAuth) {
    // Acesso permitido
    return true;
  }

  // Acesso bloqueado: Utilizador não está logado ou a sessão foi limpa pelo Interceptor
  router.navigate(['/login']);
  return false;
};