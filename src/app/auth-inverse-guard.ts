import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth-service';

export const authInverseGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  authService.checkAuthStatus();
  
  return authService.isLoggedIn()
    ? router.createUrlTree(['/home'])
    : true;
};
