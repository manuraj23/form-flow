import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule, MatHint, MatLabel } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-field-quiz-config',
  imports: [MatSlideToggleModule,
    FormsModule,
    CommonModule,
    MatFormFieldModule,
    MatLabel,
    MatIconModule,
    MatHint,
    MatInputModule

  ],
  templateUrl: './field-quiz-config.html',
  styleUrl: './field-quiz-config.css',
})
export class FieldQuizConfig {
  @Input() field: any; 
  @Input() defaultPoints: number = 0; 
  @Output() fieldChange = new EventEmitter<any>();

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit() {
    if (!this.field.quizConfig) {
      this.field.quizConfig = {
        isScored: true,
        points: this.defaultPoints || 1,
        negativeMarks: 0
      };
    }
    this.cd.detectChanges();
  }

  onValueChange() {
    this.fieldChange.emit(this.field);
  }

  get isSelectionField(): boolean {
    return ['RADIO', 'CHECKBOX', 'DROPDOWN'].includes(this.field.type);
  }
}