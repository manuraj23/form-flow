import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Form } from '../interfaces/form-schema';
import { Observable, of } from 'rxjs';
import { ThemeService } from './theme-service';
import { ChartData } from '../interfaces/chart-data-response-schema';
import { FormResponseData } from '../interfaces/form-response-schema';

@Injectable({
  providedIn: 'root',
})
export class FormService {
  url = 'http://localhost:8082/formflow/';

  constructor(
    private http: HttpClient,
    private themeService: ThemeService,
  ) { }

  mapToFormSchema(rawForm: any): Form {
    return {
      id: rawForm.id,
      theme: localStorage.getItem('theme') || 'theme-pink',
      title: rawForm.title,
      description: rawForm.description,
      published: rawForm.pubilshed,
      settings: {
        ...rawForm.settings,
        scoreShow: rawForm.settings?.showScore ?? false
      },
      mainParentId: rawForm.mainParentId,

      sections: rawForm.sections.map((section: any, sectionIndex: number) => ({
        id: section.id,
        sectionTitle: section.title,
        sectionOrder: sectionIndex + 1,

        // ADD MARKS
        positiveMarks: section.positiveMarks || 0,
        negativeMarks: section.negativeMarks || 0,

        fields: section.fields.map((field: any, fieldIndex: number) => {

          //Extract options as string[]
          const optionsArray = (field.options || []).map((opt: any) => opt.label);

          //Find correct answer for MCQ
          const correctOption = (field.options || []).find((opt: any) => opt.isCorrect);

          return {
            id: field.id,
            fieldType: field.type,
            fieldOrder: fieldIndex + 1,

            fieldConfig: {
              label: field.label,

              //convert required properly
              required: field.validations?.required || false,

              //send plain options array
              options: optionsArray,

              //answer logic
              answer: field.type === 'TEXT'
                ? field.correctAnswer || ''
                : correctOption?.label || '',

              placeholder: field.placeholder
            },

            fieldStyle: {
              color: field.color,
              fontSize: field.fontSize,
              bold: field.bold,
              italic: field.italic,
              underline: field.underline,
            },
            fieldLogic: {
              enabled: field.fieldLogic.enabled,
              sourceFieldId: field.fieldLogic.sourceFieldId,
              operator: field.fieldLogic.operator,
              value: field.fieldLogic.value,
              action: field.fieldLogic.action
            }
          }
        }),
      })),
    }
  }

  private mapToFormData(formId: string, rawValue: any): FormData {
    const formData = new FormData();
    const cleanedResponse: any = {};
    const files: File[] = [];

    Object.keys(rawValue).forEach((key) => {
      const value = rawValue[key];

      if (value instanceof File) {
        files.push(value);
        cleanedResponse[key] = value.name;
      } else {
        cleanedResponse[key] = value;
      }
    });
    formData.append(
      'response',
      JSON.stringify({
        formId: formId,
        response: cleanedResponse,
      }),
    );
    files.forEach((file) => {
      formData.append('files', file);
    });
    return formData;
  }

  createForm(formData: any): Observable<any> {
    const mappedData = this.mapToFormSchema(formData);
    let data: any = this.http.post(this.url + 'user/createForm', mappedData, {
      responseType: 'text',
    });
    return data;
  }

  updateForm(formData: any): Observable<any> {
    const mappedData = this.mapToFormSchema(formData);
    let data: any = this.http.put(this.url + 'user/updateForm/' + formData.id, mappedData, {
      responseType: 'text',
    });
    return data;
  }

  getFormById(id: string): Observable<Form> {
    return this.http.get<Form>(this.url + 'user/form/' + id);
  }

  getResponseFormById(id: string): Observable<Form> {
    return this.http.get<Form>(this.url + 'public/form/' + id);
  }

  generateForm(promptText: string): Observable<any> {
    return this.http.post(this.url + 'user/form/generate', {
      prompt: promptText
    });
  }

  getUniqueAssigneesByFormId(id: string): Observable<ChartData> {
    return this.http.get<ChartData>(this.url + 'api/responses/assignees/' + id);
  }

  getUniqueRespondentsByFormId(id: string): Observable<ChartData> {
    return this.http.get<ChartData>(this.url + 'api/responses/respondents/' + id);
  }

  getAllForms(): Observable<Form[]> {
    return this.http.get<Form[]>(this.url + 'user/allForm');
  }

  getFormByStatus() { }

  submitResponse(formId: string, rawValue: any) {
    const formData = this.mapToFormData(formId, rawValue);
    return this.http.post(this.url + 'api/responses', formData);
  }

  getFormResponseById(id: string) {
    return this.http.get(this.url + 'api/responses/' + id);
  }

  getAllFormResponsesById(id: string): Observable<FormResponseData[]> {
    return this.http.get<FormResponseData[]>(this.url + 'api/responses/' + id);
  }
  deleteFormById(id: string) {
    return this.http.patch(this.url + 'user/form/moveToTrash/' + id, {}, { responseType: 'text' });
  }

  getTrashForms() {
    return this.http.get(this.url + 'user/form/trash');
  }

  restoreForms(id: string) {
    return this.http.patch(
      this.url + 'user/form/restoreFromTrash/' + id,
      {},
      { responseType: 'text' },
    );
  }

  // Get All Users for Assigning Forms
  getAllUsers() {
    return this.http.get(this.url + 'admin/getAllUsers');
  }

  // Save Form Access for Assigned Users
  saveFormAccess(data: any) {
    console.log(data);
    return this.http.post(this.url + 'user/save', data, { responseType: 'text' });
  }

  getSavedAccess(form_id: string) {
    return this.http.get(this.url + 'user/access/' + form_id);
  }

  getUsernameByEmail(email: string) {
    return this.http.get(`${this.url}user/username-by-email`, {
      params: { email: email },
      responseType: 'text'   // 🔥 important
    });
  }

  getSharedForms() {
    return this.http.get(this.url + 'user/shared-forms');
  }


  // Version Cpntrol APIs

  getAllVersions(formId: string) {
    return this.http.get(this.url + 'user/version/' + formId);
  }

  switchVersion(formId: string, versionId: number) {
    const url = `${this.url}user/version/switch/${formId}`;

    const body = {
      versionId: versionId
    };

    return this.http.patch(url, body, { responseType: 'text' });
  }


  deleteAllVersions(formId: string) {
    return this.http.patch(
      `${this.url}user/version/delete/${formId}`,
      {}, { responseType: 'text' }
    );
  }
  createGroup(data: any) {
    return this.http.post(this.url + 'group/createGroup', data);
  }

  getMyGroups() {
    return this.http.get(this.url + 'group/myGroups');
  }

}


