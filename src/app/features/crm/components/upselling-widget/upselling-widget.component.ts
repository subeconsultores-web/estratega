import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, ArrowRight, CheckCircle, Loader2, RefreshCw, TrendingUp  } from 'lucide-angular';
import { UpsellingIAService, OportunidadUpselling } from '../../services/upselling-ia.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-upselling-widget',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ArrowRight, CheckCircle, Loader2, RefreshCw, TrendingUp }) }
  ],
    templateUrl: './upselling-widget.component.html'
})
export class UpsellingWidgetComponent implements OnInit {
    private upsellingService = inject(UpsellingIAService);
    private toastr = inject(ToastrService);

    oportunidades: OportunidadUpselling[] = [];
    isLoading = true;
    isGenerating = false;

    ngOnInit(): void {
        this.cargarOportunidades();
    }

    cargarOportunidades() {
        this.upsellingService.getOportunidadesActivas().subscribe({
            next: (data: OportunidadUpselling[]) => {
                this.oportunidades = data.slice(0, 5); // Mostrar top 5
                this.isLoading = false;
            },
            error: (err: any) => {
                console.error('Error cargando oportunidades de upselling:', err);
                this.isLoading = false;
            }
        });
    }

    async generarNuevas() {
        this.isGenerating = true;
        try {
            const result = await this.upsellingService.generarSugerencias();
            if (result && result.success) {
                this.toastr.success(result.message, 'Análisis Completado');
            }
        } catch (err: any) {
            console.error(err);
            this.toastr.error('Error al generar sugerencias de upselling con IA', 'Fallo de Análisis');
        } finally {
            this.isGenerating = false;
        }
    }
}
