import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { LUCIDE_ICONS, LucideIconProvider,  LucideAngularModule, ArrowLeft, FileText, Loader2, Send, ShieldCheck  } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';

import { ContratoService } from '../../../core/services/contrato.service';
import { Contrato, FirmaData } from '../../../core/models/contrato.model';
import { SignaturePadComponent } from '../../../shared/components/signature-pad/signature-pad.component';

@Component({
    selector: 'app-contrato-view',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, SignaturePadComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ArrowLeft, FileText, Loader2, Send, ShieldCheck }) }
  ],
    templateUrl: './contrato-view.component.html'
})
export class ContratoViewComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private contratoService = inject(ContratoService);
    private toastr = inject(ToastrService);
    private location = inject(Location);

    contratoId = this.route.snapshot.paramMap.get('id');
    contrato: Contrato | undefined;
    isLoading = true;

    ngOnInit() {
        this.loadContrato();
    }

    loadContrato() {
        if (!this.contratoId) return;
        this.isLoading = true;
        this.contratoService.getContratoById(this.contratoId).subscribe({
            next: (data) => {
                this.contrato = data;
                this.isLoading = false;
            },
            error: (e) => {
                console.error(e);
                this.toastr.error('Acuerdo no encontrado o acceso denegado');
                this.isLoading = false;
            }
        });
    }

    onFirmaCompletada(firmaBody: FirmaData) {
        if (!this.contrato || !this.contratoId) return;

        // We send to backend that it's now Signed with its signature data
        this.contratoService.cambiarEstado(this.contratoId, 'Firmado', 'Cliente aplicó firma digital exitosamente', firmaBody)
            .then(() => {
                this.toastr.success('¡El contrato ha sido firmado legalmente!');
                // Reload data to reflect new status
                this.loadContrato();
            })
            .catch((err) => {
                console.error(err);
                this.toastr.error('Error finalizando la firma en los registros');
            });
    }

    enviarContrato() {
        if (!this.contratoId) return;
        // Just changes State to "Enviado" meaning the client can now sign it.
        if (confirm('¿Confirmas el envío de este contrato comercial al cliente?')) {
            this.contratoService.cambiarEstado(this.contratoId, 'Enviado')
                .then(() => {
                    this.toastr.success('Contrato marcado como Enviado');
                }).catch(e => console.error(e));
        }
    }

    goBack() {
        this.location.back();
    }
}
