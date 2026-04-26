import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { EditField } from '../edit-field/edit-field';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { BuilderInputText } from '../../components/builder-cards/builder-input-text/builder-input-text';
import { BuilderFileUpload } from '../../components/builder-cards/builder-file-upload/builder-file-upload';
import { BuilderRadioButton } from '../../components/builder-cards/builder-radio-button/builder-radio-button';
import { BuilderSelectCard } from '../../components/builder-cards/builder-select-card/builder-select-card';
import { BuilderTextarea } from '../../components/builder-cards/builder-textarea/builder-textarea';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { FormService } from '../../services/form-service';
import { FormSubmission } from '../form-submission/form-submission';
import { ThemeSelector } from '../../components/theme-selector/theme-selector';
import { ThemeService } from '../../services/theme-service';
import { BuilderCheckBox } from '../../components/builder-cards/builder-check-box/builder-check-box';
import { ToastrService } from 'ngx-toastr';
import { FormSettingsDialog } from '../../components/form-settings-dialog/form-settings-dialog';
import { ConditionalLogicService } from '../../services/conditional-logic-service';
import { ConditionalLogic } from '../../components/conditional-logic/conditional-logic';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-form-builder',
  imports: [
    RouterLink,
    RouterOutlet,
    MatIconModule,
    MatCheckboxModule,
    CommonModule,
    MatDialogModule,
    FormsModule,
    MatMenuModule,
    BuilderInputText,
    BuilderCheckBox,
    BuilderFileUpload,
    BuilderRadioButton,
    BuilderSelectCard,
    BuilderTextarea,
    DragDropModule,
    MatMenuModule,
    ThemeSelector,
    MatTooltipModule,
  ],
  templateUrl: './form-builder.html',
  styleUrl: './form-builder.css',
})
export class FormBuilder {
  formTitle: string = 'Untitled Form';
  formDescription: string = '';
  formSections: any[] = [
    {
      id: crypto.randomUUID(),
      title: 'Add Section Title',
      fields: [],
    },
  ];
  formSettings: any;
  editingFormId: string | null = null;

  selectedFieldIndex: number | null = null;
  selectedSectionIndex: number | null = null;

  predefinedColours: string[] = ['#000000', '#EF4444', '#10B981', '#3B82F6'];
  mode: string = '';
  parentid: string | null = null;
 
  editingForm: any;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private formService: FormService,
    private themeService: ThemeService,
    private cd: ChangeDetectorRef,
    private toastr: ToastrService,
    private conditionalLogicService: ConditionalLogicService,
  ) { }

  elements = [
    { type: 'TEXT', label: 'Text Input' },
    { type: 'CHECKBOX', label: 'Checkbox' },
    { type: 'FILE', label: 'File Upload' },
    { type: 'RADIO', label: 'Radio Button' },
    { type: 'DROPDOWN', label: 'Select Card' },
    { type: 'TEXTAREA', label: 'Text Area' },
  ];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.mode = params['mode'];
      this.parentid = params['parentId'] || null;
    });
    console.log("create button parent id:", this.parentid);

    this.editingFormId = this.route.snapshot.paramMap.get('id');
    console.log('Editing Form ID:', this.editingFormId);
    if (this.editingFormId) {
      this.loadFromForEditing(this.editingFormId);
    }

    if (localStorage.getItem('prevTheme') === null) {
      localStorage.setItem('prevTheme', localStorage.getItem('theme') || 'theme-pink');
    }
    this.themeService.loadTheme();
  }

  loadFromForEditing(formId: string) {
    this.formService.getFormById(formId).subscribe({
      next: (form) => {
        console.log(form);
        this.editingForm = form;
        this.parentid = form.mainParentId || form.id || null;
        console.log('Parent ID set to:', this.parentid);
        localStorage.setItem('prevTheme', localStorage.getItem('theme') || 'theme-pink');
        localStorage.setItem('theme', form.theme);
        this.themeService.loadTheme();
        this.formTitle = form.title;
        this.formDescription = form.description;
        this.formSettings = form.settings || { isQuizMode: false, defaultPointsPerField: 0 };
        this.formSections = form.sections.map((section: any) => ({
          id: section.id ? section.id.toString() : crypto.randomUUID(),
          title: section.sectionTitle,
          fields: section.fields
            .sort((a: any, b: any) => a.fieldOrder - b.fieldOrder)
            .map((field: any, index: number) => ({
              id: field.id,
              type: field.fieldType,
              label: field.fieldConfig.label,
              validations: field.fieldConfig.validations || {},
              options: field.fieldConfig.options,
              placeholder: field.fieldConfig.placeholder || '',
              fieldLogic: field.fieldLogic || {
                enabled: false
              },
              color: field.fieldStyle.color || '#000000',
              fontSize: field.fieldStyle.fontSize || '12px',
              bold: field.fieldStyle.bold || false,
              italic: field.fieldStyle.italics || false,
              underline: field.fieldStyle.underline || false,
              quizConfig: field.quizConfig || {
                isScored: false,
              }
            })),
            
        }));
        this.formSections = [...this.formSections];
        
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Could not load form for editing.');
      },
    });
  }

  openSettings() {
    const dialogRef = this.dialog.open(FormSettingsDialog, {
      width: '400px',
      data: { ...this.formSettings }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.formSettings = result;

        if (result.isQuizMode && result.defaultPointsPerField > 0) {
          this.applyBulkScores(result.defaultPointsPerField);
        }

        // Force immediate UI refresh
        setTimeout(() => {
          this.cd.detectChanges();
        }, 0);
      }
    });
  }

  applyBulkScores(points: number) {
    this.formSections.forEach(section => {
      section.fields.forEach((field: { type: string; quizConfig: { isScored: boolean; points: number; }; }) => {
        if (['RADIO', 'CHECKBOX', 'DROPDOWN'].includes(field.type)) {
          field.quizConfig.isScored = true;
          field.quizConfig.points = points;
        }
      });
    });
    this.toastr.success(`Quiz Mode: All selection fields set to ${points} points.`);
    this.cd.detectChanges();
  }

  get totalQuizScore(): number {
    let total = 0;
    this.formSections.forEach(section => {
      section.fields.forEach((field: { quizConfig: { isScored: any; points: any; }; }) => {
        if (field.quizConfig.isScored) {
          total += (field.quizConfig.points || 0);
        }
      });
    });
    return total;
  }

  saveForm(isPublished: boolean) {
    const hasFields = this.formSections.some(
      (section) => section.fields && section.fields.length > 0,
    );

    if (!this.formTitle?.trim()) {
      this.toastr.error('Please provide a title for your form.');
      return;
    }

    if (!hasFields) {
      this.toastr.error('Cannot save an empty form.');
      return;
    }

    const formToSave = {
      id: this.editingFormId,
      title: this.formTitle,
      description: this.formDescription,
      sections: this.formSections,
      published: isPublished,
      settings: this.formSettings,
    };
    console.log(formToSave);

    if (this.editingFormId) {
      this.formService.updateForm(formToSave).subscribe({
        next: (response) => {

          if (this.mode === 'version') {
            this.toastr.success('Version Updated Successfully to Database!');
            this.router.navigate(['/versions', this.editingFormId]);
          }
          else {
            if (!isPublished) {
              this.toastr.success('Form Updated Successfully to Database!');
            } else {
              this.toastr.success('Form is Published!');
            }
            this.router.navigate(['/']);
          }

        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Error saving form to backend. Check if Spring Boot is running.');
        },
      });
    } else {
      this.formService.createForm(formToSave).subscribe({
        next: (response) => {
          if (!isPublished) {
            this.toastr.success('Form Saved Successfully to Database!');
          } else {
            this.toastr.success('Form is Published!');
          }

          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Error saving form.');
        },
      });
    }
    localStorage.setItem('theme', localStorage.getItem('prevTheme') || 'theme-pink');
    localStorage.removeItem('prevTheme');
    this.themeService.loadTheme();
  }

  addSection() {
    this.formSections.push({
      id: crypto.randomUUID(),
      title: `Add Section Title`,
      fields: [],
    });
  }

  removeSection(index: number) {
    if (this.formSections.length > 1) {
      this.formSections.splice(index, 1);
    } else {
      this.toastr.error('A form must have at least one section.');
    }
  }

  duplicateSection(sectionIndex: number) {
    const originalSection = this.formSections[sectionIndex];

    const clonedSection = JSON.parse(JSON.stringify(originalSection));

    clonedSection.id = crypto.randomUUID();
    clonedSection.title = 'Copy of ' + clonedSection.title;
    clonedSection.fields.forEach((field: any, index: number) => {
      field.id = crypto.randomUUID();
    });

    this.formSections.splice(sectionIndex + 1, 0, clonedSection);
  }

  get sectionsIds(): string[] {
    return this.formSections.map((s) => s.id);
  }

  onDrop(event: CdkDragDrop<any[]>, sectionIndex: number) {
    if (event.previousContainer === event.container) {
      // Rearrange
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else if (event.previousContainer.id === 'sidebar') {
      //Sidebar to Canvas
      const field = event.previousContainer.data[event.previousIndex];

      const newField = {
        id: crypto.randomUUID(),
        type: field.type,
        label: field.label,
        validations: {},
        options: ['CHECKBOX', 'RADIO', 'DROPDOWN'].includes(field.type) ? ['Option 1'] : [],
        placeholder: field.placeholder || '',
        fieldLogic: {
          enabled: false
        },
        color: '#000000',
        fontSize: '12px',
        bold: false,
        italic: false,
        underline: false,
        quizConfig: ['CHECKBOX', 'RADIO', 'DROPDOWN'].includes(field.type) && this.formSettings?.isQuizMode ? {
          isScored: true,
          points: this.formSettings.defaultPointsPerField || 0,
          negativeMarks: 0,
          correctAnswer: '',
        } : { isScored: false },
      };

      this.formSections[sectionIndex].fields.splice(event.currentIndex, 0, newField);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  onSectionDrop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.formSections, event.previousIndex, event.currentIndex);
  }

  removeField(sectionIndex: number, fieldIndex: number) {
    // To remove field from canvas
    this.formSections[sectionIndex].fields.splice(fieldIndex, 1);
    this.formSections = [...this.formSections];
  }

  editField(sectionIndex: number, fieldIndex: number) {
    const field = this.formSections[sectionIndex].fields[fieldIndex];

    if (!field.fieldLogic) {
      field.fieldLogic = {
        enabled: false
      };
    }

    const fieldToEdit = JSON.parse(
      JSON.stringify(field),
    );

    this.conditionalLogicService.updateFormState({ sections: this.formSections });

    const dialogRef = this.dialog.open(EditField, {
      width: '400px',
      data: {
        field: fieldToEdit,
        isQuizMode: this.formSettings?.isQuizMode || false,
      },
      panelClass: 'custom-dialog-container',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        //Update field with new data once saved
        this.formSections[sectionIndex].fields[fieldIndex] = result;
        this.formSections = [...this.formSections];

        this.cd.detectChanges();
      }
    });
    this.cd.detectChanges();
  }

  duplicateField(sectionIndex: number, fieldIndex: number) {
    const originalField = this.formSections[sectionIndex].fields[fieldIndex];

    const clonedField = JSON.parse(JSON.stringify(originalField));

    clonedField.id = crypto.randomUUID();

    this.formSections[sectionIndex].fields.splice(fieldIndex + 1, 0, clonedField);
  }

  selectField(sectionIndex: number, fieldIndex: number) {
    this.selectedSectionIndex = sectionIndex;
    this.selectedFieldIndex = fieldIndex;
  }

  @HostListener('document:click')
  clearSelection() {
    this.selectedFieldIndex = null;
    this.selectedSectionIndex = null;
  }

  openPreview() {
    const previewData = {
      title: this.formTitle,
      description: this.formDescription,
      sections: this.formSections.map((section, sIndex) => ({
        sectionTitle: section.title,
        sectionOrder: sIndex + 1,
        fields: section.fields.map((field: any, fIndex: number) => ({
          fieldType: field.type,
          fieldOrder: fIndex + 1,
          id: field.id || `temp_${fIndex}`,
           fieldConfig: {
            label: field.label,
            placeholder: field.placeholder,
            options: field.options,
            validations: field.validations,
          },
          fieldStyle: {
            color: field.color,
            fontSize: field.fontSize,
            bold: field.bold,
            italics: field.italics,
            underline: field.underline
          },
          fieldLogic: field.fieldLogic,
          quizConfig: field.quizConfig,
        })),
      })),
      isReadOnly: true,
    };
    this.dialog.open(FormSubmission, {
      width: '90vw',
      height: '90vh',
      data: previewData,
    });
  }

  saveVersion(isPublished: boolean) {
    const hasFields = this.formSections.some(
      (section) => section.fields && section.fields.length > 0,
    );

    if (!this.formTitle?.trim()) {
      this.toastr.error('Please provide a title for your form.');
      return;
    }

    if (!hasFields) {
      this.toastr.error('Cannot save an empty form.');
      return;
    }

    const formToSave = {
      id: this.editingFormId,
      title: this.formTitle,
      description: this.formDescription,
      sections: this.formSections,
      published: isPublished,
      settings: this.formSettings,
      mainParentId: this.parentid,
    };
    console.log(formToSave);
    console.log('Parent id:', formToSave.mainParentId);

    if(this.editingForm.editable){
      this.formService.updateForm(formToSave).subscribe({
        next: (response) => {
          if (!isPublished) { 
            this.toastr.success('Form Version Updated Successfully to Database!');
            this.router.navigate(['/versions', this.editingFormId]);
          }
          else{
            this.toastr.success('Form Version is Published!');
            this.router.navigate(['/']);
          }
        },
        error: (err) => {
        console.error(err);
        this.toastr.error('Error saving form.');
        },
      });
    }

    else{
    this.formService.createForm(formToSave).subscribe({
      next: (response) => {
        if (!isPublished) {
          this.toastr.success('Form Version saved successully,');
        } else {
          this.toastr.success('Form Version is Published!');
        }

        if(isPublished){
        this.router.navigate(['/']);
        }
         else{
          this.router.navigate(['/versions', this.editingFormId]);
         }
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Error saving form.');
      },
    });

  }
    localStorage.setItem('theme', localStorage.getItem('prevTheme') || 'theme-pink');
    localStorage.removeItem('prevTheme');
    this.themeService.loadTheme();
  }


  // onDrop(event: CdkDragDrop<any[]>, sectionIndex: number) {

  //   // Reorder inside same section
  //   if (event.previousContainer === event.container) {
  //     moveItemInArray(
  //       event.container.data,
  //       event.previousIndex,
  //       event.currentIndex
  //     );
  //     return;
  //   }

  //   // Sidebar → Canvas
  //   if (event.previousContainer.id === 'sidebar') {

  //     // IMPORTANT: Deep clone dragged item
  //     const draggedItem = JSON.parse(
  //       JSON.stringify(event.item.data)
  //     );

  //     const isQuiz = this.formSettings?.isQuiz;

  //     const newField: any = {
  //       id: Date.now().toString(),
  //       type: draggedItem.type,
  //       fieldConfig: {
  //         label: draggedItem.label,
  //         validations: {},
  //         placeholder: '',
  //         options: [],
  //       },
  //       fieldStyle: {
  //       color: '#000000',
  //       fontSize: '12px',
  //       bold: false,
  //       italic: false,
  //       underline: false,
  //       }
  //     };

  //     // Assign options ONLY for correct types
  //     if (['CHECKBOX', 'RADIO', 'DROPDOWN'].includes(newField.type)) {
  //       newField.options = [
  //         { label: 'Option 1', isCorrect: false },
  //         { label: 'Option 2', isCorrect: false }
  //       ];
  //       if (isQuiz) {
  //         if (newField.type === 'TEXT') {
  //           newField.correctAnswer = '';
  //         }
  //       }
  //       // Insert into section
  //       this.formSections[sectionIndex].fields.splice(
  //         event.currentIndex,
  //         0,
  //         newField
  //       );

  //       //Force UI refresh (important)
  //       this.formSections = [...this.formSections];
  //       return;
  //     }

  //     // Between sections
  //     transferArrayItem(
  //       event.previousContainer.data,
  //       event.container.data,
  //       event.previousIndex,
  //       event.currentIndex
  //     );

  //     // Refresh
  //     this.formSections = [...this.formSections];
  //   }
  // }

  // openSectionSettings(sectionIndex: number) {
  //   if (!this.formSettings?.isQuiz) {
  //     this.toastr.warning('Enable Quiz mode to use marks settings');
  //     return;
  //   }

  //   const dialogRef = this.dialog.open(FormSettingsMarks, {
  //     width: '350px',
  //     maxWidth: '90vw',
  //     data: {
  //       positiveMarks: this.formSections[sectionIndex]?.positiveMarks || 0,
  //       negativeMarks: this.formSections[sectionIndex]?.negativeMarks || 0
  //     }
  //   });

  //   dialogRef.afterClosed().subscribe(result => {
  //     if (result) {
  //       this.formSections[sectionIndex] = {
  //         ...this.formSections[sectionIndex],
  //         positiveMarks: result.positiveMarks,
  //         negativeMarks: result.negativeMarks
  //       };
  //     }
  //   });
  // }

  // get filteredElements() {
  //   if (this.formSettings?.isQuiz) {
  //     return this.elements.filter(el =>
  //       ['TEXT', 'CHECKBOX', 'DROPDOWN', 'RADIO'].includes(el.type)
  //     );
  //   }
  //   return this.elements;
  // }

  // setCorrectOption(field: any, index: number) {
  //   field.options.forEach((opt: any, i: number) => {
  //     opt.isCorrect = i === index;
  //   });
  // }
}
