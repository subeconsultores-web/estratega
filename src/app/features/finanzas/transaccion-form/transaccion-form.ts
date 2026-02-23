import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FinanzasService } from '../../../core/services/finanzas.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Transaccion } from '../../../core/models/finanzas.model';
import { SubeIaExtractService } from '../../../core/services/sube-ia-extract.service';

@Component({
  selector: 'app-transaccion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterModule],
  templateUrl: './transaccion-form.html',
  styles: ``,
})
export class TransaccionForm implements OnInit {
  private fb = inject(FormBuilder);
  private finanzasService = inject(FinanzasService);
  private authService = inject(AuthService);
  private subeIaExtract = inject(SubeIaExtractService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  isSubmitting = false;
  isEditMode = false;
  transaccionId: string | null = null;
  isScanningWithIA = false;

  // TODO: Connect this to actual Users later
  private currentUserId = 'SYSTEM';

  ngOnInit(): void {
    this.initForm();
    this.transaccionId = this.route.snapshot.paramMap.get('id');
    if (this.transaccionId) {
      this.isEditMode = true;
      // TODO: Load Transaccion if editing is allowed.
    } else {
      // Default to today
      this.form.patchValue({ fecha: new Date().toISOString().substring(0, 10) });
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      tipo: ['egreso', Validators.required],
      categoria: ['gasto_operativo', Validators.required],
      monto: [0, [Validators.required, Validators.min(1)]],
      moneda: ['CLP', Validators.required],
      fecha: ['', Validators.required],
      metodoPago: ['transferencia', Validators.required],
      estado: ['completado', Validators.required],
      referenciaExterna: [''],
      notas: ['']
    });
  }

  triggerFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Clear to allow re-selection
    this.fileInput.nativeElement.value = '';
    this.isScanningWithIA = true;

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const data = await this.subeIaExtract.extractTransactionData(base64, file.type);

          if (data.monto) this.form.patchValue({ monto: data.monto });
          if (data.fecha) this.form.patchValue({ fecha: data.fecha });
          if (data.categoria) this.form.patchValue({ categoria: data.categoria });
          if (data.notas || data.proveedor) {
            const existingNotes = this.form.value.notas || '';
            const append = `[IA] Proveedor: ${data.proveedor || 'N/A'}. ${data.notas || ''}`;
            this.form.patchValue({ notas: existingNotes ? `${existingNotes}\n${append}` : append });
          }

          this.form.markAsTouched();
          alert('¡Documento analizado! Revisa los campos completados.');
        } catch (err) {
          console.error(err);
          alert('Error analizando documento. Prueba ingresando los datos a mano.');
        } finally {
          this.isScanningWithIA = false;
        }
      };
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        this.isScanningWithIA = false;
      };
    } catch (error) {
      console.error('File handle error:', error);
      this.isScanningWithIA = false;
    }
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    try {
      const formVal = this.form.value;
      const payload: Omit<Transaccion, 'id' | 'tenantId' | 'createdAt'> = {
        tipo: formVal.tipo,
        categoria: formVal.categoria,
        monto: formVal.monto,
        moneda: formVal.moneda,
        fecha: new Date(formVal.fecha + 'T12:00:00Z'), // Basic timezone neutralization
        metodoPago: formVal.metodoPago,
        estado: formVal.estado,
        referenciaExterna: formVal.referenciaExterna,
        notas: formVal.notas,
        creadoPor: this.currentUserId
      };

      if (this.isEditMode && this.transaccionId) {
        // Not implemented: edit transaction. In strict accounting, transactions shouldn't be edited easily.
        alert('La edición de transacciones registradas está restringida. Contáctate con soporte financiero.');
      } else {
        await this.finanzasService.createTransaccion(payload);
        this.router.navigate(['/finanzas/transacciones']);
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Ocurrió un error al guardar la transacción.');
    } finally {
      this.isSubmitting = false;
    }
  }
}
