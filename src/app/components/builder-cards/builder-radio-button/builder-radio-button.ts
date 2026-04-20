import { Component, Input, SimpleChanges } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { BuilderFieldSchema } from '../../../interfaces/builder-field-schema';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-builder-radio-button',
  imports: [MatFormFieldModule, ReactiveFormsModule, MatIconModule, FormsModule, MatRadioModule],
  templateUrl: './builder-radio-button.html',
  styleUrl: './builder-radio-button.css',
})
export class BuilderRadioButton {
  @Input() isQuizMode: boolean = false;
  @Input() bluePrint!: BuilderFieldSchema;
  fieldData: BuilderFieldSchema = this.bluePrint;

  ngOnInit() {
    if (!this.fieldData.options) {
      this.fieldData.options = [{ label: 'Option 1', isCorrect: false }];
      // this.fieldData.options = ['Option 1'];
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
    // this.bluePrint.options?.push(`Option ${this.bluePrint.options.length + 1}`);
    this.bluePrint.options?.push({
      label: `Option ${this.bluePrint.options.length + 1}`,
      isCorrect: false
    });
  }

  setCorrect(index: number) {
    this.bluePrint.options?.forEach((opt: any, i: number) => {
      opt.isCorrect = i === index;
    });
  }

  removeOption(index: number) {
    this.bluePrint.options?.splice(index, 1);
  }
}
