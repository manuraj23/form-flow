import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { ConditionalLogic } from '../../components/conditional-logic/conditional-logic';
import { FieldQuizConfig } from '../../components/field-quiz-config/field-quiz-config';

@Component({
  selector: 'app-edit-field',
  imports: [CommonModule, FormsModule, MatDialogContent, MatDialogActions, MatTabsModule, ConditionalLogic, FieldQuizConfig],
  templateUrl: './edit-field.html',
  styleUrl: './edit-field.css',
})
export class EditField {
  field: any;
  isQuizMode: boolean = false;

  validationOptions: any[] = [];

  availableFileTypes: string[] = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<EditField>,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.data) {
      this.field = { ...this.data.field };
      this.isQuizMode = !!this.data.isQuizMode;
      this.setValidationOptions();
    }
    this.cd.detectChanges();
  }

  setValidationOptions() {
    if (this.field.type === 'TEXT') {
      this.validationOptions = [
        { key: 'required', label: 'Required', value: false },
        { key: 'minLength', label: 'Min Length', value: null },
        { key: 'maxLength', label: 'Max Length', value: null },
        { key: 'email', label: 'Email', value: false },
      ];
    }

    if (this.field.type === 'NUMBER') {
      this.validationOptions = [
        { key: 'required', label: 'Required', value: false },
        { key: 'min', label: 'Min Value', value: null },
        { key: 'max', label: 'Max Value', value: null },
      ];
    }

    if (this.field.type === 'CHECKBOX') {
      this.validationOptions = [
        { key: 'required', label: 'Required (must be checked)', value: false },
      ];
    }

    if (this.field.type === 'RADIO') {
      this.validationOptions = [
        { key: 'required', label: 'Required (must select one option)', value: false },
      ];
    }

    if (this.field.type === 'DROPDOWN') {
      this.validationOptions = [{ key: 'required', label: 'Required', value: false }];
    }

    if (this.field.type === 'FILE') {
      this.validationOptions = [
        { key: 'required', label: 'Required', value: false },
        { key: 'maxSize', label: 'Max File Size (KB)', value: null },
        { key: 'fileType', label: 'Allowed File Types', value: [] },
      ];
    }

    if (this.field.type === 'TEXTAREA') {
      this.validationOptions = [
        { key: 'required', label: 'Required', value: false },
        { key: 'minLength', label: 'Min Length', value: null },
        { key: 'maxLength', label: 'Max Length', value: null },
      ];
    }

    if (this.field.validations) {
      this.validationOptions.forEach((opt) => {
        if (this.field.validations[opt.key] !== undefined) {
          if (opt.key === 'fileType') {
            opt.value = this.field.validations[opt.key]
              .split(',')
              .map((t: string) => t.trim().toLowerCase());
          } else {
            opt.value = this.field.validations[opt.key];
          }
        }
      });
    }
  }
  onFileTypeChange(option: any, type: string, checked: boolean) {
    if (checked) {
      option.value.push(type);
    } else {
      option.value = option.value.filter((t: string) => t !== type);
    }
  }

  get isLogicInvalid(): boolean {
    const logic = this.field.fieldLogic;
    if (!logic || !logic.enabled) return false;

    // Return true (invalid) if enabled but missing fields
    return !logic.sourceFieldId || !logic.operator || !logic.value;
  }

  onLogicChange(logicData: any) {
    if (logicData) {
      this.field.fieldLogic = { ...logicData };
    } else {
      delete this.field.fieldLogic;
    }
  }

  save() {
    const validations: any = {};

    this.validationOptions.forEach((opt) => {
      if (opt.value !== null && opt.value !== false && opt.value !== '') {
        if (opt.key === 'fileType' && Array.isArray(opt.value)) {
          validations[opt.key] = opt.value.join(',');
        } else {
          validations[opt.key] = opt.value === true ? true : opt.value;
        }
      }
    });

    console.log(this.field.quizConfig);

    const finalPayload = {
      ...this.field,
      validations: validations,
      quizConfig: {...this.field.quizConfig}
    };

    this.dialogRef.close(finalPayload);
    console.log(finalPayload);
  }

  cancel() {
    this.dialogRef.close();
  }
}
