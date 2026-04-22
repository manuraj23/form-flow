import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ConditionalLogicService } from '../../services/conditional-logic-service';
import { ToastrService } from 'ngx-toastr';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-conditional-logic',
  imports: [CommonModule,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatIconModule],
  templateUrl: './conditional-logic.html',
  styleUrl: './conditional-logic.css',
})
export class ConditionalLogic {

  @Input() logicData: any = { enabled: false };
  @Input() currentItemId: string = '';

  @Output() logicChange = new EventEmitter<ConditionalLogic>();

  allFields: any[] = [];
  availableSources: any[] = [];
  availableOptions: any[] = [];

  constructor(private conditionalLogicService: ConditionalLogicService,
    private toastr: ToastrService,
  ) { }

  ngOnInit() {
    this.allFields = this.conditionalLogicService.getAllCurrentFields();

    const currentIndex = this.allFields.findIndex(f => String(f.id) === String(this.currentItemId));

    this.availableSources = this.allFields.filter((f, index) => {
      const isControlField = ['RADIO', 'CHECKBOX', 'DROPDOWN'].includes(f.type);
      return isControlField && index < currentIndex;
    });

    if (this.logicData?.sourceFieldId) {
      this.updateAvailableOptions(this.logicData.sourceFieldId);
    }
  }

  onSourceChange(sourceId: string) {
    this.updateAvailableOptions(sourceId);
    this.logicData.value = null; // Reset value when source changes
    this.emitChange();
  }

  updateAvailableOptions(sourceId: string) {
    const sourceField = this.availableSources.find(s => s.id === sourceId);
    this.availableOptions = sourceField?.options || [];
  }

  emitChange() {
    if (!this.logicData.enabled) {
      this.logicChange.emit(undefined);
      return;
    }

    const isComplete =
      this.logicData.action &&
      this.logicData.sourceFieldId &&
      this.logicData.operator &&
      this.logicData.value;

    if (isComplete) {
      this.logicChange.emit(this.logicData);
    } else {
      this.logicChange.emit(undefined);
    }

    //console.log(this.logicChange)
  }
}