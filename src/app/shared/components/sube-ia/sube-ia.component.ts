import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { AiService, ChatMessage } from '../../../core/services/ai.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-sube-ia',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule, BaseChartDirective],
    templateUrl: './sube-ia.component.html'
})
export class SubeIAComponent implements OnInit {
    private aiService = inject(AiService);

    isOpen = false;
    userInput = '';

    history$: Observable<ChatMessage[]>;
    isProcessing$: Observable<boolean>;

    @ViewChild('chatScroll') private chatScrollContainer!: ElementRef;

    constructor() {
        this.history$ = this.aiService.history$;
        this.isProcessing$ = this.aiService.processing$;
    }

    ngOnInit(): void {
        // Auto-scroll when history updates
        this.history$.subscribe(() => {
            setTimeout(() => this.scrollToBottom(), 100);
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            setTimeout(() => this.scrollToBottom(), 100);
        }
    }

    async sendMessage() {
        if (!this.userInput.trim()) return;

        const message = this.userInput;
        this.userInput = ''; // Clear input immediately for better UX

        // Pass general context if any
        const context = {
            currentLocation: window.location.pathname,
            time: new Date().toISOString()
        };

        await this.aiService.askQuestion(message, context);
    }

    handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    clearChat() {
        this.aiService.clearHistory();
    }

    private scrollToBottom(): void {
        if (this.chatScrollContainer) {
            try {
                this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
            } catch (err) { }
        }
    }

    // Helper to render basic markdown for bold texts and linebreaks
    // In a robust implementation, you should use ngx-markdown.
    formatMarkdown(text: string): string {
        let formatted = text.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\\n/g, '<br/>');
        return formatted;
    }
}
