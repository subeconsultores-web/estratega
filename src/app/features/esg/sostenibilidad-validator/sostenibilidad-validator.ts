import { Component } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-sostenibilidad-validator',
  imports: [CommonModule, LucideAngularModule, DatePipe, DecimalPipe, SlicePipe],
  templateUrl: './sostenibilidad-validator.html',
  styleUrl: './sostenibilidad-validator.scss',
  standalone: true
})
export class SostenibilidadValidatorComponent {
  state: 'LOADING' | 'VERIFIED' | 'INVALID' = 'LOADING';
  hashSegment: string = '';
  esgRecord: any = null;
}
