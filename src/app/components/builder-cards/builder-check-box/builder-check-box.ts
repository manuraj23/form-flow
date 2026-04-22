import { Component, Input, SimpleChanges } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CheckboxField } from '../../../interfaces/field-config-schema';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BuilderFieldSchema } from '../../../interfaces/builder-field-schema';
import { FormsModule } from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-builder-check-box',
  imports: [MatFormFieldModule, MatCheckboxModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './builder-check-box.html',
  styleUrl: './builder-check-box.css',
})
export class BuilderCheckBox {
  @Input() bluePrint!:BuilderFieldSchema;
  fieldData: BuilderFieldSchema = this.bluePrint;

  ngOnInit() {
    if (!this.fieldData.options) {
      this.fieldData.options = ['Option 1'];
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['bluePrint']) {
      const current = changes['bluePrint'].currentValue;
      this.updateUI(current);
    }
  }
  updateUI(data: BuilderFieldSchema) {
    this.fieldData = data;
  }

  addOption() {
    this.bluePrint.options?.push(`Option ${this.bluePrint.options.length + 1}`);
  }

  removeOption(index : number) {
    this.bluePrint.options?.splice(index, 1);
  }

  
  isOptionCorrect(optionValue: string): boolean {
    const config = this.fieldData?.quizConfig;
    if (!config?.isScored || !config?.correctAnswer) return false;

    if (Array.isArray(config.correctAnswer)) {
      return config.correctAnswer.includes(optionValue);
    }

    return config.correctAnswer === optionValue;
  }
}