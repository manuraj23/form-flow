import { Component, OnInit } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CreateGroup } from '../create-group/create-group';
import { MatDialogModule } from '@angular/material/dialog';
import { FormService } from '../../services/form-service';
import { ViewChild, TemplateRef } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-groups',
  imports: [CommonModule, MatIconModule, MatDialogModule, FormsModule],
  templateUrl: './groups.html',
  styleUrl: './groups.css',
})
export class Groups implements OnInit {

  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;
  dialogRef: any;

  constructor (private dialog : MatDialog, private formService : FormService, private cdr : ChangeDetectorRef) {}

  ngOnInit() {
    this.loadGroups();
  }

  selectedGroup : any = null;

  groups : any[] = []

  recentGroups : any[] = [];

  searchText: string = '';
  filteredGroups: any[] = [];

  paginatedGroups: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  members : any[] = [];

  showAddMemberInput: boolean = false;
  newMemberInput: string = '';
  showAddAdminInput: boolean = false;
  newAdminInput: string = '';

  isSidebarOpen: boolean = false;
  selectedGroupDetails: any = null;

  selectGroup(group: any) {
    this.selectedGroup = group;

    this.members = [];

    const currentGroupId = group.groupId;

    this.formService.getGroupMembers(group.groupId).subscribe({
      next: (res: any) => {
        if (this.selectedGroup?.groupId !== currentGroupId) return;

        console.log('MEMBERS RESPONSE:', res);
        const members = res.members || [];
        console.log('MEMBERS ARRAY:', members);

        this.formService.getGroupAdmins(group.groupId).subscribe({
          next: (adminRes: any) => {
            console.log('ADMINS RESPONSE:', adminRes);
            const admins = adminRes.admins || [];

            const adminUsernames = admins.map((a: any) => a.username);

            this.members = members.map((m: any) => ({
              ...m,
              role: adminUsernames.includes(m.username) ? 'ADMIN' : 'MEMBER'
            }));
            this.cdr.detectChanges();
            console.log('FINAL MEMBERS:', this.members);
          },
          error: () => {
            this.members = members.map((m: any) => ({
              ...m,
              role: 'MEMBER'
            }));
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error(err);
        console.log('MEMBERS ERROR:', err);
        this.members = [];
      }
    });
  }

  openCreateGroupDialog() {
    const dialogRef = this.dialog.open(CreateGroup, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadGroups();
      }
    });
  }

  openEditGroupDialog(group: any) {
    const dialogRef = this.dialog.open(CreateGroup, {
      width: '500px',
      data: { group }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadGroups();
      }
    });
  }

  loadGroups() {
    this.formService.getMyGroups().subscribe({
      next: (res: any) => {
        console.log('Groups API Response:', res);
        console.log('Groups Array:', res.groups); 

        this.groups = res.groups || [];

        // Sort by latest created
        this.groups.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Top 3 recent
        this.recentGroups = this.groups.slice(0, 3);

        this.filteredGroups = [...this.groups];

        this.currentPage = 1;
        this.loadPagination();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  onSearch() {
    const value = this.searchText.toLowerCase();

    this.filteredGroups = this.groups.filter(group =>
      group.groupName.toLowerCase().includes(value)
    );

    this.currentPage = 1;
    this.loadPagination();
  }

  loadPagination() {
    this.totalPages = Math.ceil(this.filteredGroups.length / this.itemsPerPage);
    this.updatePaginatedGroups();
  }

  updatePaginatedGroups() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    this.paginatedGroups = this.filteredGroups.slice(start, end);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePaginatedGroups();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedGroups();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedGroups();
    }
  }

  addMembers() {
    if (!this.selectedGroup || !this.selectedGroup.groupId) {
      alert('Please select a group first');
      return;
    }

    if (!this.newMemberInput) return;

    const memberList = this.newMemberInput
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    this.formService.addMembersToGroup(this.selectedGroup.groupId, memberList)
      .subscribe({
        next: () => {
          alert('Members added successfully');

          this.newMemberInput = '';
          this.showAddMemberInput = false;

          this.selectGroup(this.selectedGroup);
        },
        error: (err) => {
          console.error(err);
          alert(err.error || 'Error adding members');
        }
      });
  }

  cancelAddMember() {
    this.showAddMemberInput = false;
    this.newMemberInput = '';
  }

  removeMember(member: any) {
    this.dialogRef = this.dialog.open(this.confirmDialog, {
      data: { message: `Are you sure you want to remove ${member.username}?` }
    });

    this.dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) return;

      const payload = [member.email];

      this.formService.removeUsersFromGroup(this.selectedGroup.groupId, payload)
        .subscribe({
          next: () => {
            // instant UI update
            this.members = this.members.filter(
              m => m.username !== member.username
            );
          },
          error: (err) => {
            console.error(err);
            alert(err.error || 'Error removing member');
          }
        });
    });
  }

  addAdmins() {
    if (!this.selectedGroup || !this.selectedGroup.groupId) {
      alert('Please select a group first');
      return;
    }

    if (!this.newAdminInput) return;

    const adminList = this.newAdminInput
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    this.formService.addAdminsToGroup(this.selectedGroup.groupId, adminList)
      .subscribe({
        next: () => {
          alert('Admin added successfully');

          this.newAdminInput = '';
          this.showAddAdminInput = false;

          this.selectGroup(this.selectedGroup);
        },
        error: (err) => {
          console.error(err);
          alert(err.error || 'Error adding admins');
        }
      });
  }

  cancelAddAdmin() {
    this.showAddAdminInput = false;
    this.newAdminInput = '';
  }

  toggleGroupDetails(group: any) {
    if (this.selectedGroupDetails?.groupId === group.groupId) {
      this.isSidebarOpen = !this.isSidebarOpen;
    } else {
      this.selectedGroupDetails = group;
      this.isSidebarOpen = true;
      
      if (this.selectedGroup?.groupId !== group.groupId) {
        this.selectGroup(group);
      }
    }
  }
  

  trackByGroup(index: number, group: any) {
  return group.id;
}

openSidebar() {
  this.isSidebarOpen = true;
  document.body.style.overflow = 'hidden';
}

closeSidebar() {
  this.isSidebarOpen = false;
  document.body.style.overflow = 'auto';
}
}
