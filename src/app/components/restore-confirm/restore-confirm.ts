import { Component } from '@angular/core';
import { MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-restore-confirm',
  imports: [MatDialogActions, MatDialogContent],
  templateUrl: './restore-confirm.html',
  styleUrl: './restore-confirm.css',
})
export class RestoreConfirm {
constructor(private dialogRef: MatDialogRef<RestoreConfirm>) {}

  close(value: boolean) {
    this.dialogRef.close(value);
  }
}
