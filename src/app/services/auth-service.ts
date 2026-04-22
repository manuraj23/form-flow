import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.backendUrl + 'auth';
  private oAuthurl = environment.backendUrl + 'oauth2/authorization';

  isLoggedIn = signal(false);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/verifyAccount`, {
        email,
        otp,
      })
      .pipe(
        tap((res: any) => {
          this.setTokens(res.accessToken, res.refreshToken);
          this.isLoggedIn.set(true);
        }),
      );
  }
  resendOtp(data: string) {
    return this.http.post(`${this.baseUrl}/resendOtpVerifyaccount`, data).pipe(
      tap((res: any) => {
        console.log('OTP Re-sent');
      }),
    );
  }
  sendOtp(data: string) {
    return this.http
      .post(`${this.baseUrl}/forgotPassword`, {
        email: data,
      })
      .pipe(
        tap((res: any) => {
          console.log('An OTP has been sent to the registered Email');
        }),
      );
  }

  verifyResetOtp(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/verifyResetOtp`, data, {
        responseType: 'text',
      })
      .pipe(
        tap((res: string) => {
          console.log(res);
        }),
      );
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/resetPassword`, data).pipe(
      tap((res: any) => {
        this.setTokens(res.accessToken, res.refreshToken);
        this.isLoggedIn.set(true);
      }),
    );
  }

  checkUsernameAailability(data: string) {
    return this.http.post(`${this.baseUrl}/usernameCheck`, data).pipe(tap((res: any) => {}));
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  setTokens(accessToken: string, refreshToken?: string) {
    localStorage.setItem('accessToken', accessToken);

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.isLoggedIn.set(false);
  }

  checkAuthStatus() {
    let token = this.getAccessToken();

    if(!token) token = this.getRefreshToken();

    this.isLoggedIn.set(!!token);
  }

  signup(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/signup`, payload).pipe(
      tap((res: any) => {
        this.router.navigate(['/verify'], {
          queryParams: { email: payload.email },
        });
      }),
    );
  }

  googleLogin() {
    window.location.assign(`${this.oAuthurl}/google`);
  }

  handleOAuthCallback(): void {
    const params = new URLSearchParams(window.location.search);

    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken) {
      this.setTokens(accessToken, refreshToken || undefined);
      this.isLoggedIn.set(true);

      // ✅ Clean URL (important)
      window.history.replaceState({}, document.title, '/home');

      // ✅ Redirect
      this.router.navigate(['/home']);
    }
  }

  githubLogin() {
    window.location.assign(`${this.oAuthurl}/github`);
  }

  login(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, payload).pipe(
      tap((res: any) => {
        this.setTokens(res.accessToken, res.refreshToken);
        this.isLoggedIn.set(true);
      }),
    );
  }

  logout() {
    const refreshToken = this.getRefreshToken();
    this.http.post(`${this.baseUrl}/logout`, { refreshToken }).subscribe({
      next: () => {
        console.log('logged out successfully !');
      },
      error: () => {},
    });

    this.clearTokens();
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.clearTokens();
      this.isLoggedIn.set(false);
      return throwError(() => new Error('No refresh token'));
    }

    return this.http.post(`${this.baseUrl}/refresh`, { refreshToken }).pipe(
      tap((res: any) => {
        this.setTokens(res.accessToken, res.refreshToken);
        this.isLoggedIn.set(true); // ✅ ADD THIS
      }),
    );
  }

  getCurrentUser(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub;
    } catch (e) {
      return null;
    }
  }
}
