import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormService } from '../../services/form-service';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-create-group',
  imports: [FormsModule, CommonModule, MatDialogModule, MatSlideToggleModule],
  templateUrl: './create-group.html',
  styleUrl: './create-group.css',
})
export class CreateGroup implements OnInit {

  groupName: string = '';
  description: string = '';
  isPrivate: boolean = false;
  imageUrl: string ='';
  maxMembers: number = 50;
  isEditMode: boolean = false;
  groupId: string = '';

  constructor(private dialogRef: MatDialogRef<CreateGroup>, private formService: FormService, @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit() {
    if (this.data && this.data.group) {
      const group = this.data.group;

      this.isEditMode = true;
      this.groupId = group.groupId;

      this.groupName = group.groupName;
      this.description = group.description;
      this.imageUrl = group.imageUrl;
      this.maxMembers = group.maxMembers;
      this.isPrivate = group.isPrivate;
    }
  }

  createOrUpdateGroup() {
    if (!this.groupName || !this.description) return;

    const payload = {
      groupName: this.groupName,
      description: this.description,
      isPrivate: this.isPrivate,
      imageUrl: this.imageUrl,
      maxMembers: this.maxMembers
    };

    if (this.isEditMode) {
      this.formService.updateGroup(this.groupId, payload).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error(err);
        }
      });
    } 
    else {
      this.formService.createGroup(payload).subscribe({
        next: (res) => {
          console.log('Group created', res);
          this.dialogRef.close(true); 
        },
        error: (err) => {
          console.error(err);
        }
      });
    }
  }

  close() {
    this.dialogRef.close();
  }
}
