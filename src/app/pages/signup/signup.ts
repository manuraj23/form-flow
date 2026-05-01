import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth-service';
import { ToastrService } from 'ngx-toastr';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Subject, Subscription } from 'rxjs';
import { GoogleAuthButton } from "../../components/google-auth-button/google-auth-button";
// GithubAuthButton removed - not used in template

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, RouterLink, GoogleAuthButton],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup implements OnInit, OnDestroy {

  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  email: string = '';

  usernameExists = signal(true);

  private usernameSubject = new Subject<string>();
  private sub!: Subscription;

  constructor(
    private authService: AuthService,
    private toastr: ToastrService,
  ) {}

  ngOnInit() {
    this.sub = this.usernameSubject.pipe(
      debounceTime(750),
      distinctUntilChanged(),
      filter(value => value!=null && value.trim().length >= 3),
      switchMap(value => {
        const trimmed = value.trim();
        return this.authService.checkUsernameAailability(trimmed);
      })
    ).subscribe({
      next: (res: any) => {
        this.usernameExists.set(!res.available);
      },
      error: () => {
        this.usernameExists.set(true);
      }
    });
  }

  onUsernameChange(value: string) {
    if (!value || value.trim().length < 3) {
      return;
    }
    this.usernameSubject.next(value);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  onSignup() {
    if (!this.username || !this.password || !this.email) {
      this.toastr.error('Please enter valid credentials');
      return;
    }

    if (this.username.trim().length < 3) {
      this.toastr.error('Username must be at least 3 characters');
      return;
    }

    if (this.usernameExists() === true) {
      this.toastr.error('Username already taken');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.email)) {
      this.toastr.error('Please enter a valid email address');
      return;
    }

    if (this.password.length < 6) {
      this.toastr.error('Password must be at least 6 characters');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.toastr.error('Confirm your password');
      return;
    }

    this.authService
      .signup({
        username: this.username.trim(),
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: () => {
          this.toastr.success('An OTP has been sent to your provided Mail');
        },
        error: (err) => {
          if (err.status === 409) {
            this.toastr.info('Email already linked with other account');
          } else {
            this.toastr.error('Something went wrong');
          }
        },
      });
  }
}