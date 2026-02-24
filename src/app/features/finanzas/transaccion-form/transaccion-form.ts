import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FinanzasService } from '../../../core/services/finanzas.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, ArrowLeft, Bot, Info, Loader2, ScanLine, Sparkles  } from 'lucide-angular';
import { Transaccion } from '../../../core/models/finanzas.model';
import { SubeIaExtractService } from '../../../core/services/sube-ia-extract.service';

@Component({
  selector: 'app-transaccion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ArrowLeft, Bot, Info, Loader2, ScanLine, Sparkles }) }
  ],
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
    this.authService.user$.subscribe(u => {
      if (u) this.currentUserId = u.uid;
    });
    this.initForm();
    this.transaccionId = this.route.snapshot.paramMap.get('id');
    if (this.transaccionId) {
      this.isEditMode = true;
      this.cargarTransaccion(this.transaccionId);
    } else {
      // Default to today
      this.form.patchValue({ fecha: new Date().toISOString().substring(0, 10) });
    }
  }

  cargarTransaccion(id: string) {
    this.finanzasService.getTransaccion(id).subscribe(t => {
      if (t) {
        let fechaFormatted = '';
        if (t.fecha) {
          fechaFormatted = t.fecha.toDate ? t.fecha.toDate().toISOString().substring(0, 10) : new Date(t.fecha).toISOString().substring(0, 10);
        }
        this.form.patchValue({
          tipo: t.tipo,
          categoria: t.categoria,
          monto: t.monto,
          moneda: t.moneda,
          fecha: fechaFormatted,
          metodoPago: t.metodoPago,
          estado: t.estado,
          referenciaExterna: t.referenciaExterna,
          notas: t.notas
        });

        // Bloquear edición por reglas de caja
        this.form.disable();
      }
    });
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

  async anularTransaccion() {
    if (!this.transaccionId) return;
    if (confirm('¿Estás seguro de anular esta transacción? Esto no se puede deshacer y modificará los reportes de caja.')) {
      this.isSubmitting = true;
      try {
        await this.finanzasService.updateTransaccion(this.transaccionId, { estado: 'anulado' });
        alert('Transacción anulada exitosamente.');
        this.router.navigate(['/finanzas/transacciones']);
      } catch (e) {
        console.error('Error al anular:', e);
        alert('No se pudo anular la transacción.');
      } finally {
        this.isSubmitting = false;
      }
    }
  }
}
