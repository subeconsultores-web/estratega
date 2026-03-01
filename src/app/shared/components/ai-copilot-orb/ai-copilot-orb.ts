import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';

export type OrbState = 'idle' | 'listening' | 'processing' | 'speaking';

@Component({
  selector: 'app-ai-copilot-orb',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-copilot-orb.html',
  styleUrls: ['./ai-copilot-orb.scss'],
  animations: [
    trigger('stateChange', [
      state('idle', style({ transform: 'scale(1)', filter: 'hue-rotate(0deg) drop-shadow(0 0 15px rgba(0, 229, 255, 0.4))' })),
      state('listening', style({ transform: 'scale(1.1)', filter: 'hue-rotate(45deg) drop-shadow(0 0 25px rgba(0, 230, 118, 0.6))' })),
      state('processing', style({ transform: 'scale(0.95)', filter: 'hue-rotate(90deg) drop-shadow(0 0 20px rgba(176, 38, 255, 0.5))' })),
      state('speaking', style({ transform: 'scale(1.05)', filter: 'hue-rotate(0deg) drop-shadow(0 0 30px rgba(0, 229, 255, 0.8))' })),
      transition('* => *', animate('300ms ease-in-out'))
    ]),
    trigger('messageFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px) scale(0.95)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(5px) scale(0.95)' }))
      ])
    ])
  ]
})
export class AiCopilotOrbComponent implements OnInit {
  currentState = signal<OrbState>('idle');
  currentMessage = signal<string | null>(null);
  isOpen = signal<boolean>(false);

  ngOnInit(): void {
    // Simulate some AI interactions for presentation
    this.simulateInteractions();
  }

  toggleOrb() {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      this.setState('listening', 'Te escucho... ¿En qué puedo ayudarte?');
      setTimeout(() => {
        this.setState('processing', 'Analizando datos del CRM...');
        setTimeout(() => {
          this.setState('speaking', 'He preparado la cotización para Empresa X y añadido el Sello Verde ESG.');
          setTimeout(() => {
            this.setState('idle', null);
          }, 4000);
        }, 2000);
      }, 2500);
    } else {
      this.setState('idle', null);
    }
  }

  setState(state: OrbState, message: string | null = null) {
    this.currentState.set(state);
    this.currentMessage.set(message);
  }

  private simulateInteractions() {
    setTimeout(() => {
      if (!this.isOpen()) {
        this.setState('speaking', 'Hola, soy tu Copiloto Estratega. Haz clic en mí.');
        setTimeout(() => {
          if (!this.isOpen()) this.setState('idle', null);
        }, 5000);
      }
    }, 3000);
  }
}
