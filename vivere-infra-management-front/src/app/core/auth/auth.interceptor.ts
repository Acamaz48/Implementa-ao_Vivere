import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { UserStore } from '../stores/user.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const userStore = inject(UserStore); // Injetamos a Store para poder limpar a sessão se der erro

  // Resgatamos o token do armazenamento local (ou da store)
  const token = localStorage.getItem('accessToken');

  let clonedReq = req;

  // Se existe token, clonamos a requisição e adicionamos o cabeçalho
  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Devolvemos a requisição interceptando possíveis erros do backend
  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 Unauthorized = Token expirou, é inválido ou não foi enviado
      if (error.status === 401) {
        console.warn('🔒 Sessão expirada ou acesso negado. Redirecionando para login...');
        
        // 1. Limpamos os dados corrompidos/expirados do navegador
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // (Opcional, mas recomendado) Se a sua UserStore tiver um método clear() ou logout(), chame-o aqui:
        // userStore.logout(); 

        // 2. Redirecionamos para a tela de login para o utilizador se reautenticar
        router.navigate(['/login']);
        
        // NOTA DE ARQUITETURA: No futuro, se quisermos "Silent Refresh" (Renovar sem o utilizador perceber),
        // é exatamente neste bloco IF que interceptamos a chamada, batemos na rota /auth/refresh,
        // pegamos o novo token e re-executamos a 'clonedReq' original.
      }

      // Repassa o erro para que os componentes (como a tela de login) possam ler a mensagem
      return throwError(() => error);
    })
  );
};