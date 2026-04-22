import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule, MatHint, MatLabel } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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
    MatInputModule,
    MatOptionModule,
    MatSelectModule
  ],
  templateUrl: './field-quiz-config.html',
  styleUrl: './field-quiz-config.css',
})
export class FieldQuizConfig {
  @Input() field: any;
  @Input() defaultPoints: number = 0;
  @Output() fieldChange = new EventEmitter<any>();

  constructor(private cd: ChangeDetectorRef) { }

  ngOnInit() {
    if (!this.field.quizConfig) {
      this.field.quizConfig = {
        isScored: true,
        points: this.defaultPoints || 1,
        negativeMarks: 0,
        correctAnswer: this.field.type === 'CHECKBOX' ? [] : null
      };
    } else {
      const isArray = Array.isArray(this.field.quizConfig.correctAnswer);
      if (this.field.type === 'CHECKBOX' && !isArray) {
        this.field.quizConfig.correctAnswer = this.field.quizConfig.correctAnswer ? [this.field.quizConfig.correctAnswer] : [];
      } else if (this.field.type !== 'CHECKBOX' && isArray) {
        this.field.quizConfig.correctAnswer = this.field.quizConfig.correctAnswer[0] || null;
      }
      this.cd.detectChanges();
    }
  }

    onValueChange() {
      this.fieldChange.emit(this.field);
    }

  get isSelectionField(): boolean {
      return ['RADIO', 'CHECKBOX', 'DROPDOWN'].includes(this.field.type);
    }
  }