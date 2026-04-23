import { ChangeDetectorRef, Component } from '@angular/core';
import { FormService } from '../../services/form-service';
import { CommonModule } from '@angular/common';
import { Template } from '../../interfaces/formTemplate';
import { MatDialog } from '@angular/material/dialog';
import { FormSubmission } from '../../pages/form-submission/form-submission';
import { Router } from '@angular/router';

@Component({
  selector: 'app-templates',
  imports: [CommonModule],
  templateUrl: './templates.html',
  styleUrl: './templates.css',
})
export class Templates {
  templates: Template[] = [];
  selectedTemplate: Template = { id: '', templateName: '', title: '', description: '' };
  templateDetails: any;

  constructor(
    private formService: FormService,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit() {
    this.formService.getAllTemplates().subscribe((data: Template[]) => {
      this.templates = data;
      this.selectedTemplate = this.templates[0];
      this.selectTemplate(this.selectedTemplate);
      this.cd.detectChanges();
    });
  }

  selectTemplate(template: Template) {
    this.selectedTemplate = template;
    this.formService.getTemplateById(this.selectedTemplate.id).subscribe((data) => {
      this.templateDetails = data;
      console.log(this.templateDetails);
    });
  }

  previewTemplate() {
    const previewData = {
      title: this.templateDetails.title,
      description: this.templateDetails.description,
      sections: this.templateDetails.sections.map((section: any, sIndex: number) => ({
        sectionTitle: section.sectionTitle,
        sectionOrder: section.sectionOrder || sIndex + 1,

        fields: section.fields.map((field: any, fIndex: number) => ({
          fieldType: field.fieldType, // ⚠️ check this name
          fieldOrder: field.fieldOrder || fIndex + 1,
          id: field.id || `temp_${fIndex}`,

          fieldConfig: {
            label: field.fieldConfig?.label,
            placeholder: field.fieldConfig?.placeholder,
            options: field.fieldConfig?.options || [],
            validations: field.fieldConfig?.validations || {},
          },

          fieldStyle: {
            color: field.fieldStyle?.color,
            fontSize: field.fieldStyle?.fontSize,
            bold: field.fieldStyle?.bold,
            italics: field.fieldStyle?.italics,
            underline: field.fieldStyle?.underline,
          },
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

  useTemplate() {
    this.formService.useTemplate(this.selectedTemplate.id).subscribe((response) => {
      const newFormId = response.formId;
      this.router.navigate(['/edit-form', newFormId]);
    });
  }
}
