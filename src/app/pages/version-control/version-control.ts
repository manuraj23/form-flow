import { ChangeDetectorRef, Component, NgModule } from '@angular/core';
import { FormService } from '../../services/form-service';
import { MatIcon } from '@angular/material/icon';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormSubmission } from '../form-submission/form-submission';
import { ToastrService } from 'ngx-toastr';
import { DeleteDialog } from '../../components/delete-dialog/delete-dialog';
import { ConfirmDialog } from '../../components/confirm-dialog/confirm-dialog';
import { MatTooltip } from '@angular/material/tooltip';


@Component({
  selector: 'app-version-control',
  imports: [MatIcon, NgClass, DatePipe, CommonModule, RouterLink, MatTooltip],
  templateUrl: './version-control.html',
  styleUrl: './version-control.css',
})
export class VersionControl {
  
  formId : any;
  selectedForm: any ; // default to first form
   versions: any[] = [];
   version_Id: number =0;
   currentPage: number = 1;
   itemsPerPage: number = 4;
   totalPages: number = 0;
   paginatedVersions: any[] = [];

  constructor(private formService: FormService, private cd:ChangeDetectorRef, private route: ActivatedRoute, private toastr: ToastrService, private dialog: MatDialog, private router: Router ) {}

  ngOnInit(){
     this.formId= this.route.snapshot.paramMap.get('id')!;
     console.log(this.formId);
     this.getformDetails(this.formId);
  }

  getformDetails(formid: string){
    this.formService.getFormById(formid).subscribe((form: any) => {
        console.log(form);
        this.selectedForm = form;
        console.log("selected form parent id: ",this.selectedForm.mainParentId );
        this.getallVersions();
        this.cd.detectChanges();
      });
  }

  getallVersions(){
     this.formService.getAllVersions(this.selectedForm.mainParentId).subscribe((versions: any) => {
      console.log(versions);
      this.versions = versions;
      const version = this.versions.find(v => v.FormId === this.selectedForm.id);
         console.log(version)
        if (version) {
           this.version_Id = version.versionId;
       }
      this.updatePagination(); 
        this.cd.detectChanges();
     });
    
     
  }



  viewVersion(versionId: string){
    this.formService.getFormById(versionId).subscribe(data => {
    
        const previewData = {
          title: data.title,
          description: data.description,
          sections: data.sections.map((section: any, sIndex: number) => ({
            sectionTitle: section.sectionTitle,
            sectionOrder: section.sectionOrder || (sIndex + 1),
    
            fields: section.fields.map((field: any, fIndex: number) => ({
              fieldType: field.fieldType, // ⚠️ check this name
              fieldOrder: field.fieldOrder || (fIndex + 1),
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
                underline: field.fieldStyle?.underline
              }
            }))
          })),
          isReadOnly: true
        };
       
    
        this.dialog.open(FormSubmission, {
           width: '90vw',
           height: '90vh',
           data: previewData, 
            });
    
            this.cd.detectChanges();
          })
  }
 

  restoreVersion(formId: string, versionId: number, status: boolean){
    if (status == true) {
    this.toastr.warning('Already active versions cannot be restored.');
    return;
  }

  const dialogRef = this.dialog.open(ConfirmDialog, {
    width: '450px',
    data: {}
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // ✅ User clicked YES
      this.formService.switchVersion(formId, versionId).subscribe({
        next: (res) => {
          console.log(res);
          this.toastr.success('Version switched successfully!');

          // ✅ Redirect to home page
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Failed to switch version. Please try again.');
        }
      });
    }
  });

}



  updatePagination() {
  const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  const endIndex = startIndex + this.itemsPerPage;
  this.paginatedVersions = this.versions.slice(startIndex, endIndex);
   this.totalPages = Math.ceil(this.versions.length / this.itemsPerPage); 
}

nextPage() {
  if (this.currentPage * this.itemsPerPage < this.versions.length) {
    this.currentPage++;
    this.updatePagination();
  }
}

prevPage() {
  if (this.currentPage > 1) {
    this.currentPage--;
    this.updatePagination();
  }
}

deleteAllVersions(parentId: string){
  if (!parentId) return;

  const dialogRef = this.dialog.open(DeleteDialog, {
    width: '350px'
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.formService.deleteAllVersions(parentId).subscribe({
        next: () => {
          // success
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error(err);
          alert('Failed to delete versions');
        }
      });
    }
  });
}


deleteVersion(formId: string, versionId: number){
  this.dialog
      .open(DeleteDialog)
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.formService.deleteFormById(formId).subscribe({
            next: () => {
              this.versions = this.versions.filter((v) => v.versionId !== versionId);
              this.updatePagination();
              this.cd.detectChanges();
              this.toastr.success('Form moved to trash!');
              this.router.navigate(['/home']);
            },
            error: (err) => {
              console.error(err);
              this.toastr.error('Error moving form to trash.');
            },
          });
        }
      }); 

}

}
