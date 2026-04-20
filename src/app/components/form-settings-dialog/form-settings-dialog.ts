import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormSettingsSchema } from '../../interfaces/form-settings-schema';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-form-settings-dialog',
  imports: [MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatSlideToggleModule,
    MatIconModule
  ],
  providers: [
    provideNativeDateAdapter()
  ],
  templateUrl: './form-settings-dialog.html',
  styleUrl: './form-settings-dialog.css',
})
export class FormSettingsDialog {
  selectedDate: Date | null = null;

  constructor(
    public dialogRef: MatDialogRef<FormSettingsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: FormSettingsSchema
  ) {
    if (!this.data) {
      this.data = { deadline: undefined, closeMessage: '', maxResponses: undefined, isPrivate: false, isQuizMode: false };
    }
  }

  // clearDeadline() {
  //   this.data.deadline = null;
  //   this.data.closeMessage = ''; 
  // }

  onSave() {
    if (this.data.deadline) {
      const finalDate = new Date(this.data.deadline);
      finalDate.setHours(23, 59, 59, 999);
      this.data.deadline = finalDate.toISOString();

      console.log("Saving deadline as:", this.data.deadline);
    }
    this.dialogRef.close(this.data);
  }

  onCancel() {
    this.dialogRef.close();
  }
}