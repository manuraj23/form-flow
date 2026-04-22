import { Component, OnDestroy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormService } from '../../../services/form-service';

@Component({
  selector: 'app-generate-form-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './generate-form-dialog.html',
  styleUrl: './generate-form-dialog.css',
})
export class GenerateFormDialog implements OnDestroy {
  prompt = signal('');
  loading = signal(false);

  private destroy$ = new Subject<void>();
  private dialogRef = inject(MatDialogRef<GenerateFormDialog>);
  private formService = inject(FormService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  constructor() {
    // Listen for backdrop/programmatic close attempts while loading
    this.dialogRef
      .backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.handleClose());
  }


  onGenerate(): void {
    if (!this.prompt().trim() || this.loading()) return;

    this.loading.set(true);

    this.formService.generateForm(this.prompt())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.formId != null) {
            this.snackBar.open('Form generated successfully!', 'Close', {
              duration: 3000,
              panelClass: ['snack-success']
            });
            this.dialogRef.close();
            this.router.navigate(['/edit-form', response.formId]);
          } else {
            this.loading.set(false);
            this.snackBar.open('Generation failed: no form ID returned.', 'Close', {
              duration: 4000,
              panelClass: ['snack-error']
            });
          }
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('An error occurred during generation.', 'Close', {
            duration: 4000,
            panelClass: ['snack-error']
          });
        }
      });
  }

  onCancel(): void {
    this.handleClose();
  }

  private handleClose(): void {
    if (this.loading()) {
      this.destroy$.next(); // terminates ongoing HTTP subscription
      this.loading.set(false);
      this.dialogRef.close();
      this.snackBar.open('Generation terminated.', 'Close', {
        duration: 3000,
        panelClass: ['snack-warn'],
      });
    } else {
      this.dialogRef.close();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
