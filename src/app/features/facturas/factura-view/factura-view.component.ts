import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { getFunctions, httpsCallable } from '@angular/fire/functions';

import { FacturaService } from '../../../core/services/factura.service';
import { CrmService } from '../../../core/services/crm.service';
import { Factura } from '../../../core/models/factura.model';

@Component({
    selector: 'app-factura-view',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './factura-view.component.html'
})
export class FacturaViewComponent implements OnInit {
    private facturaService = inject(FacturaService);
    private crmService = inject(CrmService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private toastr = inject(ToastrService);
    private location = inject(Location);
    private functions = inject(getFunctions);

    facturaId = this.route.snapshot.paramMap.get('id');
    factura: Factura | undefined;
    cliente: any;
    isLoading = true;

    ngOnInit() {
        this.loadFactura();
    }

    loadFactura() {
        if (this.facturaId) {
            this.facturaService.getFactura(this.facturaId).subscribe(f => {
                if (f) {
                    this.factura = f;
                    if (this.factura.clienteId) {
                        this.crmService.getCliente(this.factura.clienteId).subscribe(c => {
                            this.cliente = c;
                            this.isLoading = false;
                        });
                    } else {
                        this.isLoading = false;
                    }
                } else {
                    this.toastr.error('Factura no encontrada');
                    this.router.navigate(['/facturas']);
                }
            });
        }
    }

    // Future Stripe Integration Button trigger
    async pagarConStripe() {
        this.toastr.info('Inicializando pasarela segura...', 'Stripe Checkout');

        try {
            // Initialize Callable target targeting 'createCheckoutSession'
            const buildCheckout = httpsCallable(this.functions, 'createCheckoutSession');
            const result: any = await buildCheckout({
                facturaId: this.facturaId,
                tenantId: this.factura!.tenantId
            });

            if (result.data && result.data.url) {
                // Perform raw Redirect replacing the app view securely dropping the User onto Stripe Hosted Environment
                window.location.href = result.data.url;
            } else {
                this.toastr.error('Stripe retornó un estado anómalo.');
            }
        } catch (e: any) {
            console.error(e);
            this.toastr.error(e.message || 'Error inicializando pago con Stripe. Revisa la consola.');
        }
    }

    anularFactura() {
        if (confirm('¿Estás seguro de que deseas anular esta factura definitivamente?')) {
            this.facturaService.cambiarEstado(this.facturaId!, 'anulada').then(() => {
                this.toastr.success('Factura Anulada');
            }).catch(e => {
                console.error(e);
                this.toastr.error('Error al anular factura');
            });
        }
    }

    goBack() {
        this.location.back();
    }
}
