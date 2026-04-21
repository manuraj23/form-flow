import { Component, Input, SimpleChanges } from '@angular/core';
import { BuilderFieldSchema } from '../../../interfaces/builder-field-schema';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-builder-file-upload',
  imports: [MatFormFieldModule, MatIconModule],
  templateUrl: './builder-file-upload.html',
  styleUrl: './builder-file-upload.css',
})
export class BuilderFileUpload {
  @Input() bluePrint!: BuilderFieldSchema;
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
  formatFileTypes(types: string): string {
    return types
      .split(',')
      .map((t) => t.toUpperCase())
      .join(', ');
  }
}