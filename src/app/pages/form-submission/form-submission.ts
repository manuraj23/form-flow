import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, Optional } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InputText } from '../../components/cards/input-text/input-text';
import { FileUpload } from '../../components/cards/file-upload/file-upload';
import { CheckBox } from '../../components/cards/check-box/check-box';
import { RadioButton } from '../../components/cards/radio-button/radio-button';
import { SelectCard } from '../../components/cards/select-card/select-card';
import { Textarea } from '../../components/cards/textarea/textarea';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormService } from '../../services/form-service';
import { MatIconModule } from '@angular/material/icon';
import { Form } from '../../interfaces/form-schema';
import { fileSizeValidator, fileTypeValidator } from '../../validators/file.validators';
import { ToastrService } from 'ngx-toastr';
import { FormSettingsSchema } from '../../interfaces/form-settings-schema';
import { ThemeService } from '../../services/theme-service';
import { AuthService } from '../../services/auth-service';
import { Loader } from '../../components/loader/loader';

@Component({
  selector: 'app-form-submission',
  imports: [
    CommonModule,
    InputText,
    FileUpload,
    CheckBox,
    RadioButton,
    SelectCard,
    Textarea,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    RouterLink,
    Loader
  ],
  templateUrl: './form-submission.html',
  styleUrl: './form-submission.css',
})
export class FormSubmission {
  formGroup: FormGroup = new FormGroup({});
  formStructure: any;
  isReadOnly: boolean = false;
  isSubmitting: boolean = false;
  isSubmitted: boolean = false;
  closeMessage: string = '';
  isClosed: boolean = false;
  responseCount: any;
  isFormReady: boolean = false;
  showReview = false;
  response: any = null;
  showScore: boolean = false;
  timeLeft: number = 0; // In seconds
  timerInterval: any;
  displayTime: string = '';
  quizStarted = false;
  totalPoints = 0;
  showProctorWarning = false;
  isEditMode = false;
  responseId: string | null = null;
  lastSavedData: any;

  constructor(
    private route: ActivatedRoute,
    private formService: FormService,
    private themeService: ThemeService,
    private cd: ChangeDetectorRef,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private toastr: ToastrService,
    private authService: AuthService,
    private router: Router,
  ) { }

  ngOnInit() {
    //Preview Mode
    if (this.dialogData) {
      this.formStructure = this.dialogData;
      this.isReadOnly = this.dialogData.isReadOnly;
      this.buildReactiveForm();
      this.setupConditionalLogic();
    }
    //Response Mode
    else {
      const formId = this.route.snapshot.paramMap.get('id');
      if (formId) {
        this.formService.getResponseFormById(formId).subscribe({
          next: (form: Form) => {
            console.log(form);
            this.formStructure = form;
            console.log(this.formStructure);
            // if (localStorage.getItem('prevTheme') === null) {
            //   localStorage.setItem('prevTheme', localStorage.getItem('theme') || 'theme-pink');
            // }
            // this.themeService.setTheme(form.theme);
            // this.themeService.loadTheme();
            this.isReadOnly = false;
            this.responseCount = form.totalResponses;
            if (this.checkAvailability(form)) {
              this.handleTheme(form);
              if (this.formStructure.settings?.isQuizMode) {
                this.totalPoints = this.calculateTotalPoints(form);
              } else {
                this.buildReactiveForm();
                this.setupConditionalLogic();
                this.isFormReady = true;
                this.loadDraft(formId);
                this.setupDraftTimer(formId);
              }
            } else {
              this.isClosed = true;
              this.isFormReady = true;
            }
            this.cd.detectChanges();
          },
          error: (err) => {
            this.toastr.error('Error: Form not found on server.');
          },
        });
      }
    }
  }

  checkAvailability(form: any): boolean {
    const settings = form.settings;
    if (!settings) return true;

    const now = new Date();
    const deadline = settings.deadline ? new Date(form.settings.deadline) : null;

    if (deadline && now > deadline) {
      this.closeMessage = settings.closeMessage || "This form is closed";
      return false;
    }

    if (settings.maxResponses && Number(this.responseCount) >= Number(settings.maxResponses)) {
      this.closeMessage = "This form has reached the maximum number of allowed responses.";
      return false;
    }

    if (settings.isPrivate && !this.authService.isLoggedIn()) {
      this.closeMessage = "This is a private form. Please log in to view and submit.";
      return false;
    }

    return true;
  }

  canEditResponse(): boolean {
    if (this.formStructure?.settings?.isQuizMode || !this.formStructure?.settings?.isPrivate) return false;
    if (!this.response?.editableUntil) return false;

    const now = new Date().getTime();
    const deadline = new Date(this.response.editableUntil).getTime();
    return now < deadline;
  }

  enableEditMode() {
    if (this.canEditResponse()) {
      this.isEditMode = true;
      this.isSubmitted = false; // Toggles view back to form
      if (this.lastSavedData) {
      this.formGroup.patchValue(this.lastSavedData);
    }
      this.toastr.info('You are now editing your previous response.');
    } else {
      this.toastr.error('The editing window has closed.');
    }
  }

  handleTheme(form: Form) {
    if (localStorage.getItem('prevTheme') === null) {
      localStorage.setItem('prevTheme', localStorage.getItem('theme') || 'theme-pink');
    }
    this.themeService.setTheme(form.theme);
    this.themeService.loadTheme();
  }

  getFieldStyle(config: any) {
    return {
      'color': config?.color || '#000000',
      'font-size': config?.fontSize || '12px',
      'font-weight': config?.bold ? 'bold' : 'normal',
      'font-style': config?.italic ? 'italic' : 'normal',
      'text-decoration': config?.underline ? 'underline' : 'none',
    };
  }

  getControl(field: any): FormControl {
    const controlId = String(field.id || field.fieldOrder);
    const control = this.formGroup.get(controlId);
    if (!control) {
      throw new Error(`Control with id ${controlId} not found in FormGroup`);
    }
    return control as FormControl;
  }

  buildReactiveForm() {
    const controls: any = {};
    if (!this.formStructure || !this.formStructure.sections) return;

    this.formStructure.sections.forEach((section: any) => {
      section.fields.forEach((field: any) => {
        const controlKey = String(field.id || field.fieldOrder);
        const config = field.fieldConfig || {};
        const validators = [];
        if (config.validations?.required) validators.push(Validators.required);
        if (config.validations?.email) validators.push(Validators.email);
        if (config.validations?.minLength)
          validators.push(Validators.minLength(config.validations.minLength));
        if (config.validations?.maxLength)
          validators.push(Validators.maxLength(config.validations.maxLength));
        if (config.validations?.min) validators.push(Validators.min(config.validations.min));
        if (config.validations?.max) validators.push(Validators.max(config.validations.max));
        if (field.fieldType === 'FILE') {
          if (config.validations?.maxSize) {
            validators.push(fileSizeValidator(config.validations.maxSize));
          }
          if (config.validations?.fileType) {
            const types = config.validations.fileType
              .split(',')
              .map((t: string) => t.trim().toLowerCase());
            validators.push(fileTypeValidator(types));
          }
        }
        const initialValue = field.fieldType === 'FILE' ? null : '';
        controls[controlKey] = new FormControl(initialValue, validators);
      });
    });

    this.formGroup = new FormGroup(controls);
    this.cd.detectChanges();
  }

  setupConditionalLogic() {
    this.evaluateAllVisibility();

    this.formGroup.valueChanges.subscribe(() => {
      this.evaluateAllVisibility();
    });
  }

  evaluateAllVisibility() {
    this.formStructure.sections.forEach((section: any) => {
      section.fields.forEach((field: any) => {
        const control = this.formGroup.get(field.id);
        if (control) {
          if (this.isFieldVisible(field)) {
            control.enable({ emitEvent: false });
          } else {
            control.disable({ emitEvent: false });
          }
        }
      });
    });
    this.cd.detectChanges();
  }

  isFieldVisible(field: any): boolean {
    const logic = field.fieldLogic;
    if (!logic || !logic.enabled) return true;

    const sourceValue = this.formGroup.get(logic.sourceFieldId)?.value;

    let isMatch = false;
    if (Array.isArray(sourceValue)) {
      // For Checkbox
      isMatch = sourceValue.includes(logic.value);
    } else {
      // For Radio/Dropdown
      isMatch = String(sourceValue ?? '') === String(logic.value ?? '');
    }
    if (logic.operator === 'NOT_EQUALS') {
      isMatch = !isMatch;
    }

    return logic.action === 'SHOW' ? isMatch : !isMatch;
  }

  isSectionVisible(section: any): boolean {
    if (!section.fields || section.fields.length === 0) return false;
    return section.fields.some((field: any) => this.isFieldVisible(field));
  }

  setupDraftTimer(formId: string) {
    this.formGroup.valueChanges.subscribe(values => {
      localStorage.setItem(`form_draft_${formId}`, JSON.stringify(values));
    })
  }

  loadDraft(formId: string) {
    const savedDraft = localStorage.getItem(`form_draft_${formId}`);
    if (savedDraft) {
      const draftValues = JSON.parse(savedDraft);
      this.formGroup.patchValue(draftValues);
    }
  }

  // QUIZ FUNCTIONS

  calculateTotalPoints(form: Form): number {
    let points = 0;
    form.sections?.forEach(section => {
      section.fields?.forEach(field => {
        points += (field.quizConfig?.points || 0);
      });
    });
    return points;
  }

  startQuiz() {
    this.quizStarted = true;
    this.isSubmitted = false;

    this.buildReactiveForm();
    this.setupConditionalLogic();

    if (this.formStructure.settings?.duration > 0) {
      this.startTimer(this.formStructure.settings.duration);
    }
    this.initProctoring();

    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.formService.recordQuizStart(this.formStructure.id).subscribe({
      next: (res) => console.log('Attempt tracked on server'),
      error: (err) => this.toastr.error('Failed to initialize quiz session')
    });
  }

  startTimer(minutes: number) {
    this.timeLeft = minutes * 60;
    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        this.formatTime();
        this.cd.detectChanges();
      } else {
        this.handleHardSubmit();
      }
    }, 1000);
  }

  formatTime() {
    const mins = Math.floor(this.timeLeft / 60);
    const secs = this.timeLeft % 60;
    this.displayTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  private visibilityHandler = () => {
    if (document.visibilityState === 'hidden' && this.quizStarted && !this.isSubmitted) {
      this.handleProctorViolation('Tab switch');
    }
  };

  private blurHandler = () => {
    if (this.quizStarted && !this.isSubmitted) {
      this.handleProctorViolation('Window focus lost');
    }
  };

  initProctoring() {
    document.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('blur', this.blurHandler);
  }

  stopProctoring() {
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    window.removeEventListener('blur', this.blurHandler);
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.stopProctoring(); // Stop listening once component is gone
  }

  handleProctorViolation(reason: string) {
    if (this.isSubmitting || this.isSubmitted) return;

    this.showProctorWarning = true;

    setTimeout(() => {
      this.showProctorWarning = false;
      if (!this.isSubmitted) {
        this.submitResponse(true);
      }
    }, 3000);
  }

  handleHardSubmit() {
    clearInterval(this.timerInterval);
    this.toastr.warning('Time is up! Submitting your answers...');
    this.submitResponse(true);
  }

  submitResponse(isForced = false) {
    if (this.isReadOnly) {
      this.toastr.warning('This is a preview. Data is not saved.');
      return;
    }
    if (this.formGroup.valid || isForced) {
      this.isSubmitting = true;

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      // console.log('PAYLOAD BEING SENT:', JSON.stringify(this.formGroup.value));

      const payload = {
        ...this.formGroup.value,
        responseId : this.isEditMode ? this.response.id : null
      }

      this.formService.submitResponse(
        this.formStructure.id,
        payload
      ).subscribe({
        next: (res: any) => {
          console.log(res);

          this.toastr.success('Response saved successfully!');

          this.response = res;
          this.lastSavedData = this.formGroup.value;
        
          this.showScore =
            this.formStructure?.settings?.isQuizMode &&
            this.formStructure?.settings?.showScore;

          this.formGroup.reset();
          this.isSubmitting = false;
          this.isSubmitted = true;
          this.quizStarted = false;

          localStorage.removeItem(`form_draft_${this.formStructure.id}`);
        },

        error: (err) => {
          console.error(err);
          this.toastr.error('Could not save response.');
          this.isSubmitting = false;
        }

      });

    } else {
      this.formGroup.markAllAsTouched();
      this.toastr.error('Please fix the errors before submitting.');
    }
  }

  // toggleReview() {
  //   this.showReview = !this.showReview;
  // }

  get currentUser(): string | null {
    return this.authService.getCurrentUser();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  resetForm() {
    this.isSubmitted = false;
    this.isSubmitting = false;
    this.ngOnInit();
  }

  logoutAndSwitch() {
    this.authService.logout();
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }
}