import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, Copy, FileDown, FileSearch, ListChecks, Loader2, RotateCcw, Sparkles, Wand2, X  } from 'lucide-angular';
import { PropuestasIAService } from '../../services/propuestas-ia.service';
import { ToastrService } from 'ngx-toastr';
import { marked } from 'marked';
// @ts-ignore
import html2pdf from 'html2pdf.js';

@Component({
    selector: 'app-propuesta-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Copy, FileDown, FileSearch, ListChecks, Loader2, RotateCcw, Sparkles, Wand2, X }) }
  ],
    templateUrl: './propuesta-modal.component.html'
})
export class PropuestaModalComponent {
    @Input() isOpen = false;
    @Input() clienteId!: string;
    @Input() nombreEmpresa!: string;

    @Output() closeModal = new EventEmitter<void>();

    private propuestaService = inject(PropuestasIAService);
    private toastr = inject(ToastrService);

    // Form state
    tono: 'formal' | 'agresivo' | 'breve' | 'casual' = 'formal';
    contextoExtra = '';
    serviciosInput = '';
    // Example format: "Diseño Web: 500000\nGestión RRSS: 300000"

    // Process State
    isGenerating = signal(false);
    propuestaMarkdown = signal<string | null>(null);
    propuestaHtml = signal<string | null>(null);

    close() {
        if (this.isGenerating()) return;
        this.isOpen = false;
        this.closeModal.emit();
        // Reset state
        setTimeout(() => {
            this.propuestaMarkdown.set(null);
            this.propuestaHtml.set(null);
        }, 300);
    }

    async generarPropuesta() {
        if (!this.serviciosInput.trim()) {
            this.toastr.warning('Ingresa al menos un servicio a cotizar.');
            return;
        }

        const lineas = this.serviciosInput.split('\\n').filter(l => l.trim().length > 0);
        const serviciosOfrecidos = lineas.map(linea => {
            const separator = linea.includes(':') ? ':' : '-';
            const [nombre, precio] = linea.split(separator).map(s => s.trim());
            return {
                nombre: nombre || 'Servicio',
                precio: precio || 'Precio a convenir'
            };
        });

        this.isGenerating.set(true);
        this.propuestaMarkdown.set(null);
        this.propuestaHtml.set(null);

        try {
            const md = await this.propuestaService.generarPropuesta({
                clienteId: this.clienteId,
                serviciosOfrecidos,
                tono: this.tono,
                contextoExtra: this.contextoExtra
            });

            this.propuestaMarkdown.set(md);
            this.propuestaHtml.set(await marked.parse(md));
            this.toastr.success('Propuesta generada con IA exitosamente');

        } catch (error) {
            console.error('Error generando propuesta', error);
            this.toastr.error('Error al contactar a Sube IA.');
        } finally {
            this.isGenerating.set(false);
        }
    }

    copyToClipboard() {
        const md = this.propuestaMarkdown();
        if (md) {
            navigator.clipboard.writeText(md).then(() => {
                this.toastr.success('Copiado al portapapeles');
            });
        }
    }

    exportarPDF() {
        const element = document.getElementById('propuesta-pdf-content');
        if (!element) return;

        const opt: any = {
            margin: 15,
            filename: `Propuesta_${this.nombreEmpresa}_${new Date().getTime()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).save();
        this.toastr.info('Generando PDF...');
    }
}
