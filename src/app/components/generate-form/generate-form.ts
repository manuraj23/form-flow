import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { GenerateFormDialog } from '../dialogs/generate-form-dialog/generate-form-dialog';
import { AiChatbot } from '../ai-chatbot/ai-chatbot';

@Component({
  selector: 'app-generate-form',
  standalone: true,
  imports: [MatButtonModule, MatTooltipModule, MatIconModule],
  templateUrl: './generate-form.html',
  styleUrl: './generate-form.css'
})
export class GenerateForm implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private dialog: MatDialog) {}

  openDialog(): void {
    this.dialog.open(GenerateFormDialog, {
      width: '480px',
      disableClose: true,
      panelClass: 'generate-form-dialog'
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openChat(){
    this.dialog.open(AiChatbot, {
      width: '480px',
    });
  }
}