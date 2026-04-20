import { Component, Input, SimpleChanges } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BuilderFieldSchema } from '../../../interfaces/builder-field-schema';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-builder-input-text',
  imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatIcon,FormsModule],
  templateUrl: './builder-input-text.html',
  styleUrl: './builder-input-text.css',
})
export class BuilderInputText {
  // @Input() isQuiz: boolean = false;

  @Input() bluePrint!: BuilderFieldSchema;
fieldData!: BuilderFieldSchema;
  type: string = 'text';

  ngOnInit() {
  this.updateUI(this.bluePrint);
}
  ngOnChanges(changes: SimpleChanges) {
    
    if (changes['bluePrint']) {
      const current = changes['bluePrint'].currentValue;
      this.updateUI(current);
    }
  }
updateUI(data: BuilderFieldSchema) {
  this.fieldData = data;

  this.type = this.fieldData.validations?.email ? 'email' : 'text';

  // if (this.isQuiz && this.fieldData.correctAnswer === undefined) {
  //   this.fieldData.correctAnswer = '';
  // }
}}
