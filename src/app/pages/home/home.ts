import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MyForms } from '../../components/my-forms/my-forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ThemeSelector } from '../../components/theme-selector/theme-selector';
import { ThemeService } from '../../services/theme-service';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { SharedWithMe } from '../../components/shared-with-me/shared-with-me';
import { GenerateForm } from "../../components/generate-form/generate-form";
import { Groups } from "../../components/groups/groups";
import { MatDialog } from '@angular/material/dialog';
import { LogoutDialog } from '../../components/dialogs/logout-dialog/logout-dialog';
import { Templates } from '../../components/templates/templates';

@Component({
  selector: 'app-home',
  imports: [MatIconModule, CommonModule, MyForms, RouterLink, RouterOutlet, ThemeSelector, MatMenuModule, MatButtonModule, SharedWithMe, GenerateForm, Groups, Templates],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  activesection = 'MyForm';
  isSidebarOpen = false;



  constructor(
    private themeService: ThemeService,
    private router: Router,
    private dialog: MatDialog, 
  ) {}

  ngOnInit() {
    localStorage.setItem(
      'theme',
      localStorage.getItem('prevTheme') || localStorage.getItem('theme') || 'theme-pink',
    );
    localStorage.removeItem('prevTheme');
    this.themeService.loadTheme();
  }
  logout() {
    this.dialog.open(LogoutDialog, { width: '360px' })
    .afterClosed()
    .subscribe(confirmed => {
      if (confirmed) this.router.navigate(['/logout']);
    });
  }

  toggleSidebar() {
  this.isSidebarOpen = !this.isSidebarOpen;
}
}
