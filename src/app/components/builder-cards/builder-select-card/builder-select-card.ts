import { Component, Input, SimpleChanges } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { BuilderFieldSchema } from '../../../interfaces/builder-field-schema';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-builder-select-card',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatIconModule, FormsModule, MatSelectModule],
  templateUrl: './builder-select-card.html',
  styleUrl: './builder-select-card.css',
})
export class BuilderSelectCard {
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
}