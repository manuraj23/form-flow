import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-share-dialog',
  imports: [MatIcon, CommonModule],
  templateUrl: './share-dialog.html',
  styleUrl: './share-dialog.css',
})
export class ShareDialog {
link: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private cd: ChangeDetectorRef,
    private dialogRef: MatDialogRef<any>,
    private toastr: ToastrService
  ) {}

  ngAfterViewInit() {
    this.link = this.data.link;
    this.cd.detectChanges();
  }

  copyLink() {
    navigator.clipboard.writeText(this.link);
    this.toastr.success('Link copied to clipboard!');
  }

  closeDialog(){
   this.dialogRef.close();
  }
}
