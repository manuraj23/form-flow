import { Component, Input, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatError, MatFormField, MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth-service';
import { ToastrService } from 'ngx-toastr';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-change-password',
  imports: [FormsModule, MatFormField,MatFormFieldModule,MatError, MatInputModule, MatIconModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePassword {
  @Input() verified!: WritableSignal<string>;
  password: string = '';
  confirmPassword: string = '';
  constructor(
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService,
  ) {}

  changePassword() {
    if (this.password.length < 6) {
      this.toastr.error('Password must be at least 6 characters');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.toastr.error('Confirm your password');
      return;
    }
    this.authService.resetPassword({
      email: this.verified(),
      newPassword: this.password
    }).subscribe({
      next: (res) => {
        this.router.navigate(["/home"]);
        this.toastr.info('Password reset successful!!');
      },
      error: (err) => {
        console.error('Email verification failed', err);
        this.toastr.error('Password reset unsuccessful!!');
      },
    });
  }
}
