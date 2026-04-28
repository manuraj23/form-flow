import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth-service';
import { Router } from '@angular/router';
import { LoaderService } from '../services/loader-service';
import { ToastrService } from 'ngx-toastr';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: any, next: any) => {
  const authService = inject(AuthService);
  const loaderService = inject(LoaderService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  const skipUrls = ['/login', '/refresh', '/signup', '/forgotPassword'];
  const skipLoadingUrls = ['/usernameCheck', '/generateForm', '/ai/chat'];

  const shouldSkipLoading = skipLoadingUrls.some((url) => req.url.includes(url));

  if (!shouldSkipLoading) {
    loaderService.show();
  }

  // SKIP AUTH LOGIC for auth APIs
  if (skipUrls.some((url) => req.url.includes(url))) {
    return next(req).pipe(
      finalize(() => {
        if (!shouldSkipLoading) loaderService.hide();
      }),
    );
  }

  const accessToken = authService.getAccessToken();
  const refreshToken = authService.getRefreshToken();

  // ✅ CASE 1: Access token present → attach and send
  if (accessToken) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${accessToken}` },
    });

    return next(authReq).pipe(
      finalize(() => {
        if (!shouldSkipLoading) loaderService.hide();
      }),
      handleError(authService, router, toastr, loaderService, shouldSkipLoading, req, next),
    );
  }

  // ✅ CASE 2: No access token BUT refresh token exists → refresh first, then send
  if ((!accessToken || accessToken==='') && refreshToken) {
    return handleRefreshAndRetry(authService, router, toastr, loaderService, shouldSkipLoading, req, next);
  }

  // ✅ CASE 3: No tokens at all → send as-is (server will reject, handleError will catch it)
  return next(req).pipe(
    finalize(() => {
      if (!shouldSkipLoading) loaderService.hide();
    }),
    handleError(authService, router, toastr, loaderService, shouldSkipLoading, req, next),
  );
};

function handleRefreshAndRetry(
  authService: AuthService,
  router: Router,
  toastr: ToastrService,
  loaderService: LoaderService,
  shouldSkipLoading: boolean,
  req: any,
  next: any,
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((res: any) => {
        isRefreshing = false;
        const newAccessToken = res.accessToken;
        refreshTokenSubject.next(newAccessToken);

        const retryReq = req.clone({
          setHeaders: { Authorization: `Bearer ${newAccessToken}` },
        });

        return next(retryReq);
      }),
      catchError((err) => {
        isRefreshing = false;
        // Refresh token itself failed → full logout
        authService.clearTokens();
        authService.isLoggedIn.set(false);
        router.navigate(['/login']);
        toastr.error('Session Timed Out! Please login again.');
        return throwError(() => err);
      }),
      finalize(() => {
        if (!shouldSkipLoading) loaderService.hide();
      }),
    );
  }

  // Refresh already in progress → queue this request until token is ready
  return refreshTokenSubject.pipe(
    filter((token) => token !== null),
    take(1),
    switchMap((token) => {
      const retryReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token!}` },
      });
      return next(retryReq);
    }),
    finalize(() => {
      if (!shouldSkipLoading) loaderService.hide();
    }),
  );
}

function handleError(
  authService: AuthService,
  router: Router,
  toastr: ToastrService,
  loaderService: LoaderService,
  shouldSkipLoading: boolean,
  req: any,
  next: any,
) {
  return catchError((error: HttpErrorResponse) => {
    if (error.status === 401 || error.status === 403) {
      if (error.status === 403) {
        // 403 = authenticated but forbidden — no point refreshing
        toastr.error('Permission Denied!!');
        return throwError(() => error);
      }

      // 401 = token likely expired → try refresh
      return handleRefreshAndRetry(
        authService,
        router,
        toastr,
        loaderService,
        shouldSkipLoading,
        req,
        next,
      );
    }

    if (error.status === 500) toastr.error('Internal Server Error!!!');
    if (error.status === 404) toastr.info('No data found!!!');

    return throwError(() => error);
  });
}