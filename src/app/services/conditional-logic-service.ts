import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConditionalLogicService {
  private formStructure = new BehaviorSubject<any>(null);

  updateFormState(structure: any) {
    this.formStructure.next(structure);
  }

  getAllCurrentFields(): any[] {
    const currentStructure = this.formStructure.getValue();
    if (!currentStructure || !currentStructure.sections) return [];

    return currentStructure.sections.flatMap((section: any) => section.fields || []);
  }
}
