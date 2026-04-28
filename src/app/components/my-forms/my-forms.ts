import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { FORMS_DATA } from '../../data/form-data';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ShareDialog } from '../share-dialog/share-dialog';

import { FormService } from '../../services/form-service';

import { Router, RouterLink } from '@angular/router';
import { MatFormField, MatLabel, MatOption, MatSelect } from '@angular/material/select';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { Form } from '../../interfaces/form-schema';
import { DeleteDialog } from '../delete-dialog/delete-dialog';
import { ToastrService } from 'ngx-toastr';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-my-forms',
  imports: [RouterLink, MatIcon, DatePipe, MatDialogModule, MatMenu, MatMenuTrigger, CommonModule, MatMenuModule, MatIconModule, MatTooltip
  ],
  templateUrl: './my-forms.html',
  styleUrl: './my-forms.css',
})
export class MyForms {
  @Input() type: 'myForms' | 'trash' = 'myForms';
  forms: any[] = [];
  totalFormsarray: any[] = [];
  totalForms = 0;
  totalActive = 0;
  totalRes = 0;
  publicForms = 0;
  privateForms = 0;
  isprivate = false;
  paginatedForms: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 4;
  totalPages: number = 1;

  constructor(
    private dialog: MatDialog,
    private formService: FormService,
    private cd: ChangeDetectorRef,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.type == 'myForms') {
      this.getFormData();
    } else if (this.type == 'trash') {
      this.getTrashFormData();
    }
  }

  getFormData() {
    this.formService.getAllForms().subscribe((data: any[]) => {
      this.forms = this.sortFormsByDate(data);
      this.loadPagination();
      console.log('Forms Data:', this.forms);
      this.totalFormsarray = data;
      this.loadSummary(); 

    });
  }

  getTrashFormData() {
  this.formService.getTrashForms().subscribe((data: any) => {
    this.forms = this.sortFormsByDate(data);
    this.totalFormsarray = data;
    this.loadSummary();

    this.loadPagination(); 
  });
}

  sortFormsByDate(forms: any[]) {
    return forms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  loadSummary() {
    this.totalForms = this.forms.length;
    this.totalActive = this.forms.filter((f: any) => f.published == true).length;
    this.totalRes = this.forms.reduce((sum, f: any) => sum + (f.responses || 0), 0);
    this.publicForms = this.forms.filter((f: any) => f.settings?.isPrivate == null).length;

    this.privateForms = this.forms.filter((f: any) => f.settings?.isPrivate === true).length;
  }

  deleteForm(id: string) {
    this.dialog
      .open(DeleteDialog)
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.formService.deleteFormById(id).subscribe({
            next: () => {
              this.forms = this.forms.filter((form) => form.id !== id);
              this.totalFormsarray = this.forms;
              this.loadSummary();
              this.adjustPageAfterDelete();
              this.cd.detectChanges();
              this.toastr.success('Form moved to trash!');
            },
            error: (err) => {
              console.error(err);
              this.toastr.error('Error moving form to trash.');
            },
          });
        }
      });
  }


  shareForm(id: number, published: boolean) {
    if (published == false) {
      this.toastr.warning("It is just a draft form. You can't share it");
      return;

    }

    const link = `${window.location.origin}/form/${id}`;

    this.dialog.open(ShareDialog, {
      width: '500px',
      height: '150px',
      data: { link: link },
    });
  }

  seeResponses(id: number) {
    const link = `${window.location.origin}/response/${id}`;
    window.open(link, '_blank');
  }

  restoreForm(id: string) {
    this.formService.restoreForms(id).subscribe({
      next: (data: any) => {
        console.log(data);
        this.forms = this.forms.filter((form) => form.id !== id);
        this.totalFormsarray = this.forms;
        this.loadSummary();
       this.adjustPageAfterDelete();
        this.cd.detectChanges();
        this.toastr.success('Form restored successfully!');
      },
      error: (err: any) => {
        console.error(err);
        this.toastr.error('Restore failed!');
      },
    });
  }

  filterStatus(status: String) {
    if (status == 'all') {
      this.forms = this.totalFormsarray;
    } else if (status == 'published') {
      this.forms = this.totalFormsarray.filter((f: any) => f.published == true);
    } else if (status == 'draft') {
      this.forms = this.totalFormsarray.filter((f: any) => f.published == false);
    }

    this.currentPage = 1;
    this.loadPagination();
    this.loadSummary();
  }

  loadPagination() {
    this.totalPages = Math.ceil(this.forms.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePaginatedForms();
  }

  updatePaginatedForms() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    this.paginatedForms = this.forms.slice(start, end);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePaginatedForms();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedForms();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedForms();
    }
  }

  adjustPageAfterDelete() {
  this.totalPages = Math.ceil(this.forms.length / this.itemsPerPage);

  if (this.currentPage > this.totalPages) {
    this.currentPage = this.totalPages || 1;
  }

  this.updatePaginatedForms();
}


editForm(id: string, editable: boolean) {
  if (editable) {
    this.router.navigate(['/edit-form', id]);
  }
  else{
    this.toastr.warning("This form is not editable as it has been published. You can create it's version to make changes.");
    this.router.navigate(['/edit-form', id], { queryParams: { mode: 'version' } });
  }
}
}
