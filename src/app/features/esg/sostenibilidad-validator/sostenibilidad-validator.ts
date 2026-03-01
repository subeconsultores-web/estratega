import { Component } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { LucideAngularModule, Download, LUCIDE_ICONS, LucideIconProvider, Leaf, XCircle, ShieldCheck, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-sostenibilidad-validator',
  imports: [CommonModule, LucideAngularModule, DatePipe, DecimalPipe, SlicePipe],
  templateUrl: './sostenibilidad-validator.html',
  styleUrl: './sostenibilidad-validator.scss',
  standalone: true,
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Download, Leaf, XCircle, ShieldCheck, CheckCircle }) }]
})
export class SostenibilidadValidatorComponent {
  state: 'LOADING' | 'VERIFIED' | 'INVALID' = 'LOADING';
  hashSegment: string = '';
  esgRecord: any = null;
}
