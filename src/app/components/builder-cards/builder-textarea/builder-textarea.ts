import { Component, Input, SimpleChanges } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { BuilderFieldSchema } from '../../../interfaces/builder-field-schema';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-builder-textarea',
  imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule,MatIconModule],
  templateUrl: './builder-textarea.html',
  styleUrl: './builder-textarea.css',
})
export class BuilderTextarea {
  @Input() bluePrint!:BuilderFieldSchema;
  fieldData: BuilderFieldSchema = this.bluePrint;
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['bluePrint']) {
      const current = changes['bluePrint'].currentValue;
      this.updateUI(current);
    }
  }
  updateUI(data: BuilderFieldSchema) {
    this.fieldData = data;
  }
}