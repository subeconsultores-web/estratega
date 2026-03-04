import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CmsService } from '../../../../core/services/cms';
import { LandingConfig } from '../../../../core/models/cms.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-landing-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './landing-config.html',
  styleUrl: './landing-config.scss'
})
export class LandingConfigComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cmsService = inject(CmsService);
  private toastr = inject(ToastrService);

  configForm!: FormGroup;
  isLoading = true;
  isSaving = false;

  ngOnInit() {
    this.initForm();
    this.loadData();
  }

  private initForm() {
    this.configForm = this.fb.group({
      heroTitle: this.fb.group({
        es: ['', Validators.required],
        en: [''],
        pt: ['']
      }),
      heroSubtitle: this.fb.group({
        es: ['', Validators.required],
        en: [''],
        pt: ['']
      }),
      aboutTitle: this.fb.group({
        es: ['', Validators.required],
        en: [''],
        pt: ['']
      }),
      aboutDescription: this.fb.group({
        es: ['', Validators.required],
        en: [''],
        pt: ['']
      }),
      missionText: this.fb.group({
        es: ['', Validators.required],
        en: [''],
        pt: ['']
      }),
      visionText: this.fb.group({
        es: ['', Validators.required],
        en: [''],
        pt: ['']
      })
    });
  }

  private loadData() {
    this.cmsService.getLandingConfig().subscribe(config => {
      this.isLoading = false;
      if (config) {
        this.configForm.patchValue(config);
      }
    });
  }

  async saveConfig() {
    if (this.configForm.invalid) {
      this.toastr.warning('Completa los campos requeridos', 'Formulario inválido');
      return;
    }

    this.isSaving = true;
    try {
      const formValue = this.configForm.value as Partial<LandingConfig>;
      await this.cmsService.saveLandingConfig(formValue);
      this.toastr.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error(error);
      this.toastr.error('Error al guardar la configuración');
    } finally {
      this.isSaving = false;
    }
  }
}
