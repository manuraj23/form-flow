import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot} from '@angular/router';
import { AuthService } from './services/auth-service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  authService.checkAuthStatus();

  return authService.isLoggedIn()
    ? true
    : router.createUrlTree(['/login'], {queryParams: {returnUrl: state.url}});
};