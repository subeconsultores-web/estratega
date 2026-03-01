import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Briefcase, CheckCircle, FolderKanban, Headphones, Receipt, Leaf, FileText } from 'lucide-angular';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FinanzasService } from '../../../core/services/finanzas.service';
import { ProyectosService } from '../../../core/services/proyectos.service';
import { TicketsService } from '../../../core/services/tickets.service';
import { EsgService } from '../../../core/services/esg.service';
import { ResumenESG } from '../../../core/models/sostenibilidad.model';

@Component({
    selector: 'app-portal-dashboard',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterModule],
    providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Briefcase, CheckCircle, FolderKanban, Headphones, Receipt, Leaf, FileText }) }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="space-y-6">
            <!-- Saludo Dinámico -->
            <div>
                <h1 class="text-2xl font-bold text-txt-primary">Hola {{ userName }}</h1>
                <p class="text-txt-muted mt-1">Aquí está el resumen del avance de tus proyectos y estado de cuenta al día de hoy.</p>
            </div>

            <!-- Loading -->
            <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div *ngFor="let _ of [1,2,3]" class="bg-surface rounded-xl border border-border h-28 animate-pulse"></div>
            </div>

            <!-- Stats Dinámicas -->
            <div *ngIf="!isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-sm font-medium text-txt-muted">Deuda Pendiente</p>
                            <p class="text-3xl font-bold text-txt-primary mt-2">{{ deudaPendiente | currency:'$':'1.0-0' }}</p>
                        </div>
                        <div class="p-2 bg-accent/10 text-accent rounded-lg">
                            <lucide-icon name="check-circle" class="w-5 h-5"></lucide-icon>
                        </div>
                    </div>
                </div>

                <div class="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-sm font-medium text-txt-muted">Proyectos Activos</p>
                            <p class="text-3xl font-bold text-txt-primary mt-2">{{ proyectosActivos }}</p>
                        </div>
                        <div class="p-2 bg-primary/10 text-primary rounded-lg">
                            <lucide-icon name="briefcase" class="w-5 h-5"></lucide-icon>
                        </div>
                    </div>
                </div>

                <div class="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div class="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                        <lucide-icon name="leaf" [size]="80" class="text-emerald-500"></lucide-icon>
                    </div>
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                            <p class="text-sm font-medium text-txt-muted flex items-center gap-2">Huella de Carbono <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Smart ESG</span></p>
                            <p class="text-3xl font-bold text-emerald-600 mt-2">{{(resumenEsg?.totalCarbonoKgCO2eq || 0) | number:'1.0-1'}} <span class="text-base font-normal text-txt-muted">kg CO₂</span></p>
                            <p class="text-xs text-txt-muted mt-2 max-w-[200px]">Auditoría verde de las operaciones del proyecto.</p>
                        </div>
                        <div class="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <lucide-icon name="leaf" class="w-5 h-5"></lucide-icon>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Accesos Rapidos -->
            <h2 class="text-lg font-bold text-txt-primary mt-8 mb-4">Módulos</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               
               <a routerLink="/portal/proyectos" class="group bg-surface border border-border rounded-xl p-5 hover:border-primary hover:shadow-md transition-all cursor-pointer">
                   <div class="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       <lucide-icon name="folder-kanban" class="w-5 h-5"></lucide-icon>
                   </div>
                   <h3 class="font-bold text-txt-primary">Seguimiento Operativo</h3>
                   <p class="text-sm text-txt-muted mt-1">Revisa el avance de tareas en tiempo real de tus proyectos vigentes.</p>
               </a>
               
               <a routerLink="/portal/facturas" class="group bg-surface border border-border rounded-xl p-5 hover:border-primary hover:shadow-md transition-all cursor-pointer">
                   <div class="w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       <lucide-icon name="receipt" class="w-5 h-5"></lucide-icon>
                   </div>
                   <h3 class="font-bold text-txt-primary">Facturación y Pagos</h3>
                   <p class="text-sm text-txt-muted mt-1">Descarga PDFs de tus ciclos de cobro y emite pagos vía Tarjeta de Crédito.</p>
               </a>

               <a routerLink="/portal/cotizaciones" class="group bg-surface border border-border rounded-xl p-5 hover:border-primary hover:shadow-md transition-all cursor-pointer">
                   <div class="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       <lucide-icon name="file-text" class="w-5 h-5"></lucide-icon>
                   </div>
                   <h3 class="font-bold text-txt-primary">Cotizaciones</h3>
                   <p class="text-sm text-txt-muted mt-1">Revisa propuestas comerciales, alcances de servicio y status de aprobación.</p>
               </a>

            </div>
        </div>
    `
})
export class PortalDashboardComponent implements OnInit {
    private authService = inject(AuthService);
    private finanzasService = inject(FinanzasService);
    private proyectosService = inject(ProyectosService);
    private ticketsService = inject(TicketsService);
    private esgService = inject(EsgService);
    private cdr = inject(ChangeDetectorRef);
    private destroyRef = inject(DestroyRef);

    userName = '';
    isLoading = true;
    deudaPendiente = 0;
    proyectosActivos = 0;
    ticketsAbiertos = 0;
    resumenEsg: ResumenESG | null = null;

    async ngOnInit() {
        this.isLoading = true;
        try {
            // Resolve user name and clienteId
            const user = await this.authService.getCurrentUser();
            this.userName = user?.displayName || user?.email?.split('@')[0] || 'de nuevo';
            const clienteId = await this.authService.getClienteId();

            // Load metrics — scoped by clienteId
            if (clienteId) {
                const metricas = await this.finanzasService.getMetricasResumen();
                this.deudaPendiente = metricas.porCobrar || 0;

                // Fetch ESG Data
                this.esgService.getRegistrosESG().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(registros => {
                    const resumenes = this.esgService.agruparPorMes(registros);
                    if (resumenes.length > 0) {
                        const totalCarbono = resumenes.reduce((sum, r) => sum + r.totalCarbonoKgCO2eq, 0);
                        this.resumenEsg = {
                            ...resumenes[0],
                            totalCarbonoKgCO2eq: totalCarbono
                        };
                    }
                    this.cdr.detectChanges();
                });
            }

            // Load projects count — filtered by clienteId
            this.proyectosService.getProyectos()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(proyectos => {
                    const filtered = clienteId
                        ? proyectos.filter(p => p.clienteId === clienteId)
                        : proyectos;
                    this.proyectosActivos = filtered.filter(p => p.estado === 'activo' || (p.estado as string) === 'en_progreso').length;
                    this.cdr.detectChanges();
                });

            // Load tickets count — filtered by clienteId
            this.ticketsService.getTickets()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(tickets => {
                    const filtered = clienteId
                        ? tickets.filter((t: any) => t.clienteId === clienteId)
                        : tickets;
                    this.ticketsAbiertos = filtered.filter((t: any) => t.estado === 'abierto' || t.estado === 'en_proceso').length;
                    this.cdr.detectChanges();
                });
        } catch (e) {
            console.error('Portal dashboard error', e);
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }
}
