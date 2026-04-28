import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Form } from '../interfaces/form-schema';
import { Observable, of } from 'rxjs';
import { ThemeService } from './theme-service';
import { ChartData } from '../interfaces/chart-data-response-schema';
import { FormResponseData } from '../interfaces/form-response-schema';
import { environment } from '../../environments/environment';
import { Template } from '../interfaces/formTemplate';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root',
})
export class FormService {
  url = environment.backendUrl;

  constructor(
    private http: HttpClient,
    private themeService: ThemeService,
    private authService: AuthService
  ) { }

  mapToFormSchema(rawForm: any): Form {
    return {
      id: rawForm.id,
      theme: localStorage.getItem('theme') || 'theme-pink',
      title: rawForm.title,
      description: rawForm.description,
      published: rawForm.published,
      settings: rawForm.settings,
      mainParentId: rawForm.mainParentId,
      sections: rawForm.sections.map((section: any, sectionIndex: number) => ({
        id: section.id,
        sectionTitle: section.title,
        sectionOrder: sectionIndex + 1,

        fields: section.fields.map((field: any, fieldIndex: number) => ({
          id: field.id,
          fieldType: field.type,
          fieldOrder: fieldIndex + 1,

          fieldConfig: {
            label: field.label,
            validations: field.validations,
            options: field.options,
            placeholder: field.placeholder,
          },
          fieldStyle: {
            color: field.color,
            fontSize: field.fontSize,
            bold: field.bold,
            italic: field.italic,
            underline: field.underline,
          },
          fieldLogic: field.fieldLogic,
          quizConfig: field.quizConfig
        })),
      })),
    }
  }

  private mapToFormData(formId: string, rawValue: any, responseId?: string | null): FormData {
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
        responseId: responseId || null,
        response: cleanedResponse,
      }),
    );
    files.forEach((file) => {
      formData.append('files', file);
    });
    //console.log(formData);
    return formData;
  }

  createForm(formData: any): Observable<any> {
    const mappedData = this.mapToFormSchema(formData);
    console.log(mappedData);
    let data: any = this.http.post(this.url + 'user/createForm', mappedData, {
      responseType: 'text',
    });
    return data;
  }

  updateForm(formData: any): Observable<any> {
    const mappedData = this.mapToFormSchema(formData);
    console.log('Updating form with ID:', formData.id);
    let data: any = this.http.put(this.url + 'user/updateForm/' + formData.id, mappedData, {
      responseType: 'text',
    });
    return data;
  }

  getFormById(id: string): Observable<Form> {
    return this.http.get<Form>(this.url + 'user/form/' + id);
  }
  
  checkUserSubmission(formId: string) {
    return this.http.get(this.url + `api/responses/hasResponded/${formId}`);
  }

  getResponseFormById(id: string): Observable<Form> {
    return this.http.get<Form>(this.url + 'public/form/' + id);
  }

  generateForm(promptText : string): Observable<any> {
    return this.http.post(this.url + 'ai/generateForm', {
      prompt : promptText
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
    const formData = this.mapToFormData(formId, rawValue, null);
    //console.log(formData);
    return this.http.post(this.url + 'api/responses', formData);
  }

  editResponse(id: any, rawValue: any, responseId?: string) {
     const formData = this.mapToFormData(id, rawValue, responseId);
    return this.http.put(this.url + `api/responses/${responseId}/edit`, formData);
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

  addMembersToGroup(groupId: string, members: string[]) {
    return this.http.post(`${this.url}group/${groupId}/addMembers`, members, { responseType: 'text' });
  }

  getGroupMembers(groupId: string) {
    return this.http.get(`${this.url}group/${groupId}/members`);
  }

  removeUsersFromGroup(groupId: string, users: string[]) {
    return this.http.post(this.url + `group/${groupId}/removeUsers`, users, { responseType: 'text' });
  }

  addAdminsToGroup(groupId: string, emails: string[]) {
    return this.http.post(this.url + `group/${groupId}/addAdmins`, emails, { responseType: 'text' });
  }

  getGroupAdmins(groupId: string) {
    return this.http.get(this.url + `group/${groupId}/admins`);
  }

  updateGroup(groupId: string, data: any) {
    return this.http.put(this.url + 'group/' + groupId + '/update', data, { responseType: 'text' });
  }

  assignFormToGroup(groupId : string, formId : string, role : string) {
    return this.http.post(this.url + `group/${groupId}/assignForm/${formId}/${role}`, {});
  }

  getAllTemplates(): Observable<Template[]> {
    return this.http.get<Template[]>(this.url + 'user/templates');
  }

  getTemplateById(templateId: string) {
    return this.http.get(this.url + 'user/templates/' + templateId);
  }

  // template.service.ts
  useTemplate(templateId: string) {
    return this.http.post<any>(
      this.url + 'user/templates/' + templateId + '/use',
      {}
    );
  }

  //Quiz API
  
  private getUserId() : string | null{
    const loggedInUser = this.authService.getCurrentUser();
    if (loggedInUser) return null;

    let guestId = localStorage.getItem('quiz_guest_id');
    if(!guestId){
      guestId = crypto.randomUUID();
      localStorage.setItem('quiz_guest_id', guestId);
    }
    return guestId;
  }

  recordQuizStart(formId: string) {
    const tempUserId = this.getUserId();

    let params = new HttpParams();

    if (tempUserId) {
      params = params.set('tempUserId', tempUserId);
    }

    return this.http.post(
      `${this.url}api/responses/timerStart/${formId}`,
      null,
      { params }
    );
  }

}
