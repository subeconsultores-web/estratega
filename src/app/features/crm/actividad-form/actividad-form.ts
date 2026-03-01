import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-actividad-form',
  imports: [],
  templateUrl: './actividad-form.html',
  styleUrl: './actividad-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActividadForm {
  constructor(private cdr: ChangeDetectorRef) { }
}
