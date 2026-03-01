import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Briefcase, ChevronLeft, Clock, Edit2, ExternalLink, FileSearch, FileText, Files, Loader, Loader2, Plus, Sparkles, TrendingUp, UploadCloud, Users } from 'lucide-angular';
import { CrmService } from '../../../core/services/crm.service';
import { Cliente, Actividad } from '../../../core/models/crm.model';
import { UpsellingIAService, OportunidadUpselling } from '../services/upselling-ia.service';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { PropuestaModalComponent } from '../components/propuesta-modal/propuesta-modal.component';
import { InvitarClienteDialogComponent } from '../invitar-cliente-dialog/invitar-cliente-dialog.component';

@Component({
  selector: 'app-cliente-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, LoadingSkeleton, PropuestaModalComponent, InvitarClienteDialogComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Briefcase, ChevronLeft, Clock, Edit2, ExternalLink, FileSearch, FileText, Files, Loader, Loader2, Plus, Sparkles, TrendingUp, UploadCloud, Users }) }
  ],
  templateUrl: './cliente-detalle.html',
  styleUrl: './cliente-detalle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClienteDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  private crmService = inject(CrmService);
  private upsellingService = inject(UpsellingIAService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  clienteId: string | null = null;
  cliente: Cliente | null = null;
  actividades: Actividad[] = [];
  documentos: any[] = [];
  oportunidadesUpselling: OportunidadUpselling[] = [];

  isLoading = true;
  isLoadingActividades = true;
  isLoadingDocumentos = true;
  isPropuestaModalOpen = false;
  isInviteDialogOpen = false;
  isUploading = false;
  isAnalyzingId: string | null = null;
  isGeneratingSugerencia = false;
  nextBestActionIA: any = null;

  private functions = inject(Functions);

  ngOnInit() {
    this.clienteId = this.route.snapshot.paramMap.get('id');
    if (this.clienteId) {
      this.cargarDatosCliente(this.clienteId);
      this.cargarActividades(this.clienteId);
      this.cargarDocumentos(this.clienteId);
      this.cargarOportunidades(this.clienteId);
    }
  }

  cargarDatosCliente(id: string) {
    this.crmService.getCliente(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.cliente = data || null;
        if (this.cliente?.nextBestActionIA) {
          this.nextBestActionIA = this.cliente.nextBestActionIA;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar cliente', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarActividades(id: string) {
    this.crmService.getActividadesCliente(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.actividades = data;
        this.isLoadingActividades = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar actividades', err);
        this.isLoadingActividades = false;
        this.cdr.detectChanges();
      }
    });
  }

  getBadgeColor(estado: string | undefined): string {
    switch (estado) {
      case 'lead': return 'bg-blue-100 text-blue-800';
      case 'prospecto': return 'bg-yellow-100 text-yellow-800';
      case 'activo': return 'bg-emerald-100 text-emerald-800';
      case 'inactivo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  }

  openPropuestaModal() {
    this.isPropuestaModalOpen = true;
  }

  cargarDocumentos(id: string) {
    this.crmService.getDocumentosCliente(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.documentos = data;
        this.isLoadingDocumentos = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar documentos', err);
        this.isLoadingDocumentos = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarOportunidades(id: string) {
    this.upsellingService.getOportunidadesPorCliente(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (ops: OportunidadUpselling[]) => {
        this.oportunidadesUpselling = ops;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar upselling:', err);
      }
    });
  }

  async descartarOportunidad(op: OportunidadUpselling) {
    if (!op.id || !this.clienteId) return;
    await this.upsellingService.actualizarEstadoOportunidad(this.clienteId, op.id, 'descartado');
  }

  async aceptarOportunidad(op: OportunidadUpselling) {
    if (!op.id || !this.clienteId) return;
    await this.upsellingService.actualizarEstadoOportunidad(this.clienteId, op.id, 'contactado');
    // Idealmente acá se abre Modal de Correo o similar. Por ahora lo pasamos a contactado.
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file || !this.clienteId) return;

    this.isUploading = true;
    this.cdr.detectChanges();
    try {
      await this.crmService.uploadDocumento(this.clienteId, file);
      // Toast success ya que el subido es silencioso
      // La función Cloud procesará y aparecerá en this.documentos gracias a Firebase Realtime
    } catch (error) {
      console.error('Error al subir documento', error);
    } finally {
      this.isUploading = false;
      event.target.value = ''; // Reset
      this.cdr.detectChanges();
    }
  }

  async reanalizarDocumento(doc: any) {
    if (!doc.id || !this.clienteId) return;
    this.isAnalyzingId = doc.id;
    this.cdr.detectChanges();

    try {
      await this.crmService.retryAnalisisIA(doc);
      // La vista se actualizará gracias a la suscripción Real-time en cargarDocumentos
    } catch (error) {
      console.error('Error forzando análisis', error);
      // Aquí se podría poner un toast de error
    } finally {
      this.isAnalyzingId = null;
      this.cdr.detectChanges();
    }
  }

  async solicitarSugerenciaVentas() {
    if (!this.clienteId) return;
    this.isGeneratingSugerencia = true;
    this.cdr.detectChanges();

    try {
      const generarDoc = httpsCallable(this.functions, 'generarNextBestAction');
      const result = await generarDoc({ clienteId: this.clienteId });

      const payload: any = result.data;
      if (payload && payload.success) {
        this.nextBestActionIA = {
          siguienteMejorAccion: payload.data.siguienteMejorAccion,
          justificacion: payload.data.justificacion,
          asuntoSugerido: payload.data.asuntoSugerido,
          fechaGeneracion: new Date()
        };
        if (this.cliente) {
          this.cliente.score = payload.data.scorePredictivo;
        }
      }
    } catch (error) {
      console.error('Error generando sugerencia de ventas:', error);
    } finally {
      this.isGeneratingSugerencia = false;
      this.cdr.detectChanges();
    }
  }

  onClientInvited(event: { uid: string; email: string }) {
    // Actualizar estado local del cliente para reflejar portal activo
    if (this.cliente) {
      this.cliente.portalActivo = true;
      this.cliente.portalUserId = event.uid;
    }
    this.isInviteDialogOpen = false;
    this.cdr.detectChanges();
  }
}
