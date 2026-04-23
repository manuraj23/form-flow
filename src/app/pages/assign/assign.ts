import { ChangeDetectorRef, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormService } from '../../services/form-service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-assign',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, MatCheckboxModule, MatMenuModule],
  templateUrl: './assign.html',
  styleUrl: './assign.css',
})
export class Assign {

  formId! : string;
  form:any;
  description: string = '';
  constructor (private router : Router, 
    private route: ActivatedRoute, 
    private formService: FormService,
    private cd: ChangeDetectorRef,
    private toastr: ToastrService) {
    this.formId = this.route.snapshot.paramMap.get('id')!;
  }
  

  searchText: string = '';
  selectedCount: number = 0;
  recipients: any[]= [];
  searchedUser: string | null = null;
  selectedRole: string = 'Respondent';
  editorCount: number = 0;
  responderCount: number = 0;
  viewerCount: number = 0;
  searchedGroups: any[]= [];
  allGroups: any[] = [];

  

  ngOnInit() {
    this.formService.getFormById(this.formId).subscribe(data => {
      this.form = data;
      this.cd.detectChanges();
    });

    this.formService.getSavedAccess(this.formId).subscribe({
      next: (access: any) => {
        
        if (access) {
          const editorList: string[] = access.access?.editor || [];
          const responderList: string[] = access.access?.responder || [];
          const viewerList: string[] = access.access?.viewer || [];

          const preAssigned: any[] = [];

          editorList.forEach(name => preAssigned.push({ name, selected: true, role: 'Editor', preAssigned: true }));
          responderList.forEach(name => preAssigned.push({ name, selected: true, role: 'Respondent', preAssigned: true }));
          viewerList.forEach(name => preAssigned.push({ name, selected: true, role: 'Viewer', preAssigned: true }));

          this.recipients = preAssigned;
    
          console.log(this.description);
          this.updateSummary();
          this.cd.detectChanges();
        }
      },
      error: () => {
        this.recipients = [];
      }
    });

    this.formService.getMyGroups().subscribe({
      next: (res: any) => {
        this.allGroups = res.groups || [];
      },
      error: () => {}
    });
  }

  filteredRecipients() {
    return this.recipients;
  }

  updateSummary() {
    const selected = this.recipients.filter(r => r.selected);

    this.selectedCount = selected.length;

    this.editorCount = selected.filter(r => r.role === 'Editor').length;
    this.responderCount = selected.filter(r => r.role === 'Respondent').length;
    this.viewerCount = selected.filter(r => r.role === 'Viewer').length;
  }

  assignForm() {
    const selectedGroups = this.searchedGroups.filter(g => g.selected);
    if (this.selectedCount === 0 && selectedGroups.length === 0) {
    this.toastr.error('Please select at least one recipient.');
    return;
  }

  selectedGroups.forEach(g => {
    this.formService.assignFormToGroup(g.groupId, this.formId, g.role.toUpperCase()).subscribe({
      next: () => {},
      error: () => {
        this.toastr.error(`Error assigning to group ${g.groupName}`);
      }
    });
  });

  const editor: String[] = [];
  const responder: String[] = [];
  const viewer: String[] = [];

  this.recipients.forEach((r: any) => {
    if (r.selected) {
      if (r.role === 'Editor') {
        editor.push(r.name);   
      } else if (r.role === 'Respondent') {
        responder.push(r.name);
      } else {
        viewer.push(r.name);
      }
    }
  });

 
 console.log("description", this.description);
  const payload = {
    formId: this.formId,
    owner: this.form.createdBy, 
    access: {
      editor: editor,
      responder: responder,
      viewer: viewer,
      responseViewer:[],
      message: [this.description? this.description : 'Please fill the form']
    },
    
  };

  console.log("Payload:", payload);

  this.formService.saveFormAccess(payload).subscribe({
    next: (res) => {
      this.toastr.success('Form assigned successfully');
      this.router.navigate(['/']);
    },
    error: (err) => {
      console.error(err);
      this.toastr.error('Something went wrong!');
    }
  });
  }


search() {
  if (!this.searchText) return;

  const isEmail = this.searchText.includes('@');

  if (isEmail) {
    this.searchedGroups = [];
    this.formService.getUsernameByEmail(this.searchText).subscribe({
      next: (res: any) => {
        if (res === this.form.createdBy) {
          this.toastr.warning('Form creator cannot be added');
          return;
        }
        this.searchedUser = res;
      },
      error: () => {
        this.toastr.error('User not found');
        this.searchedUser = null;
      }
    });
  } else {
    this.searchedUser = null;
    const match = this.allGroups.find(g =>
      g.groupName.toLowerCase() === this.searchText.toLowerCase()
    );

    if (match) {
      const exists = this.searchedGroups.some(g => g.groupId === match.groupId);

      if (exists) {
        this.toastr.warning('Group already added');
        return;
      }

      this.searchedGroups.push({
        ...match,
        selected: true,
        role: 'Respondent'
      });

    } else {
      this.toastr.error('Group not found');
    }
  }
}

addRecipient() {

  const exists = this.recipients.some(r => r.name === this.searchedUser);
  if (exists) {
    this.toastr.warning('User already added');
    return;
  }

  this.recipients.push({
    name: this.searchedUser,
    selected: true,
    role: this.selectedRole
  });

  this.updateSummary();

  // reset
  this.searchedUser = null;
  this.searchText = '';
  this.selectedRole = 'Respondent';
}


}