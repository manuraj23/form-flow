import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, NgModule, ViewChild } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { FormService } from '../../services/form-service';
import { Route, Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-ai-chatbot',
  imports: [MatIcon, CommonModule, FormsModule],
  templateUrl: './ai-chatbot.html',
  styleUrl: './ai-chatbot.css',
})
export class AiChatbot {
  userMessage: string = '';
  messages: { sender: 'user' | 'bot'; text: string }[] = [];
  sessionId: string | null = null;
  isLoading: boolean = false;

  @ViewChild('chatBody') chatBody!: ElementRef;
  @ViewChild('chatInput') chatInput!: ElementRef;

  constructor(
    private formService: FormService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private dialogRef: MatDialogRef<AiChatbot>
  ) {}

  ngOnInit() {

    this.messages.push({
      sender: 'bot',
      text: 'Hello 👋 Tell me what form you want to create.',
    });
  }


  sendMessage() {
    console.log('send message called');

    if (!this.userMessage.trim()) return;

    const messageText = this.userMessage;

    // 👤 USER MESSAGE
    this.messages.push({
      sender: 'user',
      text: messageText,
    });

    this.userMessage = '';
    this.isLoading = true;


    this.formService.sendChatMessage(messageText, this.sessionId).subscribe({
      next: (res) => {
        this.isLoading = false;

        if (res.sessionId) {
          this.sessionId = res.sessionId;
        }

        let botMessage = res.message;

        if (
          res.type === 'error' ||
          botMessage?.includes('503') ||
          botMessage?.includes('429') ||
          botMessage?.toLowerCase().includes('high demand') ||
          botMessage?.toLowerCase().includes('unavailable')
        ) {
          botMessage ='⚠️ Chatbot limit reached. Try again after some time.';
        }

        this.messages.push({
          sender: 'bot',
          text: botMessage,
        });

        if (res.type === 'form' && res.complete && res.formId) {
          this.messages.push({
            sender: 'bot',
            text: '✅ Redirecting you to your form...',
          });

          this.cd.detectChanges();

          setTimeout(() => {
            this.router.navigate(['/edit-form', res.formId]);
          }, 1000);
        }

        this.cd.detectChanges();
        this.scrollToBottom();
      },

      error: (err) => {
        this.isLoading = false;

        let errorMessage = '❌ Something went wrong. Please try again.';


        if (err.status === 503 || err.status === 429) {
          errorMessage = '⚠️ Chatbot limit reached. Try again after some time.';
        }

        this.messages.push({
          sender: 'bot',
          text: errorMessage,
        });

        this.cd.detectChanges();
        this.scrollToBottom();
      },
    });

    this.scrollToBottom();
  }


  scrollToBottom() {
    setTimeout(() => {
      if (this.chatBody) {
        this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
      }
    }, 100);
  }


  onFocus() {
  setTimeout(() => {
    this.chatInput.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, 300);
}


closeDialog() {
  this.dialogRef.close();
}
}
