import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, ShieldCheck, CheckCircle2, XCircle, FileText, Loader2, DollarSign, Download, Lock } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { Title } from '@angular/platform-browser';

@Component({
   selector: 'app-interactive-proposal',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
   providers: [
      { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ShieldCheck, CheckCircle2, XCircle, FileText, Loader2, DollarSign, Download, Lock }) }
   ],
   template: `
    <!-- Top Branding Bar -->
    <div class="w-full h-1" [style.background]="tenantConfig?.colorPrimario || '#0f172a'"></div>
    
    <div class="min-h-screen bg-slate-50 font-sans selection:bg-slate-200" *ngIf="!isLoading && !loadingError">
      
      <!-- Public Header -->
      <header class="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center sm:gap-0 gap-4">
          <div class="flex items-center space-x-4">
             <img *ngIf="tenantConfig?.logoUrl" [src]="tenantConfig.logoUrl" alt="Logo Empresa" class="h-10 object-contain">
             <div *ngIf="!tenantConfig?.logoUrl" class="font-bold text-xl" [style.color]="tenantConfig?.colorPrimario || '#0f172a'">
               {{ tenantName }}
             </div>
             <div class="h-6 w-px bg-slate-200 hidden sm:block"></div>
             <div class="hidden sm:flex items-center text-sm text-slate-500 font-medium">
               <lucide-icon name="file-text" class="w-4 h-4 mr-1.5"></lucide-icon> Propuesta Comercial
             </div>
          </div>
          <div class="flex items-center space-x-3">
             <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                   [ngClass]="{
                     'bg-amber-100 text-amber-800': data?.estadoActual === 'Enviada' || data?.estadoActual === 'Revision_Solicitada',
                     'bg-emerald-100 text-emerald-800': data?.estadoActual === 'Aceptada',
                     'bg-rose-100 text-rose-800': data?.estadoActual === 'Rechazada'
                   }">
               {{ 
                  data?.estadoActual === 'Aceptada' ? 'Aprobada Digitalmente' : 
                  (data?.estadoActual === 'Rechazada' ? 'Rechazada' : 'Pendiente de Respuesta') 
               }}
             </span>
             <button class="text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-full hover:bg-slate-100" title="Descargar como PDF (Próximamente)">
                 <lucide-icon name="download" class="w-5 h-5"></lucide-icon>
             </button>
          </div>
        </div>
      </header>

      <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <!-- Titulo y Cliente -->
        <div class="mb-10 text-center sm:text-left">
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Propuesta de Servicios
          </h1>
          <p class="text-lg text-slate-600">Preparado especialmente para <span class="font-bold text-slate-900 border-b-2 border-slate-200 pb-0.5">{{ clientName }}</span></p>
          <div class="mt-4 flex flex-col sm:flex-row items-center sm:space-x-4 text-sm text-slate-500 justify-center sm:justify-start">
             <span class="flex items-center"><lucide-icon name="file-text" class="w-4 h-4 mr-1.5"></lucide-icon> Ref: {{ data?.correlativo }}</span>
             <span class="hidden sm:inline text-slate-300">•</span>
             <span class="flex items-center mt-2 sm:mt-0"><lucide-icon name="lock" class="w-4 h-4 mr-1.5 text-emerald-600"></lucide-icon> Conexión Segura e Inmutable</span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Columna Izquierda: Detalles -->
          <div class="lg:col-span-2 space-y-8">
             
             <!-- Items -->
             <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <div class="px-6 py-5 border-b border-slate-100">
                  <h3 class="text-lg font-bold text-slate-900">Alcance Propuesto</h3>
               </div>
               <div class="divide-y divide-slate-100">
                  <div *ngFor="let item of data?.items; let i = index" class="p-6 transition-colors"
                       [ngClass]="{'hover:bg-slate-50': !item.opcional, 'bg-white hover:bg-slate-50 border border-transparent': item.opcional && !opcionalesSeleccionados[i], 'bg-emerald-50/50 border-emerald-200/50': item.opcional && opcionalesSeleccionados[i]}">
                     <div class="flex justify-between items-start">
                        <div class="pr-4 flex items-start">
                           <div *ngIf="item.opcional" class="mr-4 mt-1">
                               <input type="checkbox" [checked]="opcionalesSeleccionados[i]" (change)="toggleOpcional(i)"
                                      [disabled]="data?.estadoActual !== 'Enviada' && data?.estadoActual !== 'Revision_Solicitada'"
                                      class="w-5 h-5 rounded border-slate-300 cursor-pointer focus:ring-0" [style.color]="tenantConfig?.colorPrimario || '#0f172a'">
                           </div>
                           <div>
                               <h4 class="text-base font-bold text-slate-900 flex items-center">
                                  <span class="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md mr-3 hidden sm:inline-block">{{ item.cantidad }}x</span>
                                  {{ item.nombre }}
                                  <span *ngIf="item.opcional" class="ml-2 text-[10px] uppercase font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">Adicional Recomendado</span>
                               </h4>
                               <p class="text-sm text-slate-600 mt-2 leading-relaxed" *ngIf="item.descripcion">{{ item.descripcion }}</p>
                           </div>
                        </div>
                        <div class="text-right flex-shrink-0">
                           <div class="font-bold text-slate-900 whitespace-nowrap">{{ item.subtotal | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
                           <div class="text-xs text-slate-500 mt-1 font-medium">{{ item.precioUnitario | currency:'CLP':'symbol-narrow':'1.0-0' }} / u</div>
                        </div>
                     </div>
                  </div>
               </div>
             </div>

             <!-- Términos Adicionales -->
             <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" *ngIf="data?.condicionesAdicionales">
               <div class="px-6 py-5 border-b border-slate-100">
                  <h3 class="text-lg font-bold text-slate-900">Condiciones Adicionales</h3>
               </div>
               <div class="p-6 prose prose-sm prose-slate max-w-none text-slate-600 whitespace-pre-line leading-relaxed">
                 {{ data.condicionesAdicionales }}
               </div>
             </div>

          </div>

          <!-- Columna Derecha: Totales y Firma -->
          <div class="space-y-6">
             <!-- Card Resumen -->
             <div class="bg-white text-slate-900 rounded-2xl shadow-lg border border-slate-200 overflow-hidden sticky top-[90px]">
                <div class="p-6">
                   <h3 class="font-bold text-lg mb-4">Inversión Estimada</h3>
                   
                   <div class="space-y-4">
                      <div class="flex justify-between text-sm text-slate-600 font-medium">
                         <span>Subtotal</span>
                         <span>{{ effectiveSubtotal | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                      </div>
                      
                      <div class="flex justify-between text-sm text-emerald-600 font-medium" *ngIf="effectiveDiscount > 0">
                         <span>Descuento Aplicado</span>
                         <span>- {{ effectiveDiscount | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                      </div>
                      
                      <div class="flex justify-between text-sm text-slate-600 font-medium pb-4 border-b border-slate-100">
                         <span>Impuesto ({{ data?.porcentajeImpuesto }}%)</span>
                         <span>{{ effectiveTax | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                      </div>
                      
                      <div class="flex justify-between items-center py-2">
                         <span class="font-bold text-lg text-slate-900">Total Financiamiento</span>
                         <span class="font-black text-2xl" [style.color]="tenantConfig?.colorPrimario || '#0f172a'">
                            {{ effectiveTotal | currency:'CLP':'symbol-narrow':'1.0-0' }}
                         </span>
                      </div>
                   </div>
                </div>
                
                <!-- Caja de Firma Interactiva -->
                <div class="bg-slate-50 p-6 border-t border-slate-200">
                   
                   <div *ngIf="data?.estadoActual === 'Enviada' || data?.estadoActual === 'Revision_Solicitada'">
                      <p class="text-sm text-slate-600 mb-4 text-center font-medium">Para comenzar con el proyecto, por favor aprueba digitalmente este documento.</p>
                      
                      <form [formGroup]="firmaForm" (ngSubmit)="firmarPropuesta()" class="space-y-4">
                         <div>
                            <input type="text" formControlName="name" placeholder="Tu Nombre Completo" 
                                   class="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all placeholder:text-slate-400">
                         </div>
                         <div>
                            <input type="text" formControlName="idNumber" placeholder="RUT / DNI (Opcional)" 
                                   class="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all placeholder:text-slate-400">
                         </div>

                         <div class="pt-2">
                             <button type="submit" [disabled]="firmaForm.invalid || isProcessing"
                                     class="w-full flex justify-center items-center py-3 px-4 rounded-xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                     [style.background]="tenantConfig?.colorPrimario || '#0f172a'">
                                 <lucide-icon *ngIf="isProcessing" name="loader-2" class="w-5 h-5 mr-2 animate-spin"></lucide-icon>
                                 <lucide-icon *ngIf="!isProcessing" name="shield-check" class="w-5 h-5 mr-2"></lucide-icon>
                                 {{ isProcessing ? 'Procesando Firma...' : 'Aprobar Propuesta' }}
                             </button>
                         </div>
                      </form>
                      <p class="text-[11px] text-slate-400 mt-4 text-center">Al aprobar, reconoces los términos estipulados y la captura segura de tu IP y metadatos de validación cruzada para efectos de auditoría.</p>
                   </div>

                   <!-- Estado Aprobado -->
                   <div *ngIf="data?.estadoActual === 'Aceptada'" class="text-center py-4">
                      <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                         <lucide-icon name="check-circle-2" class="w-8 h-8"></lucide-icon>
                      </div>
                      <h4 class="font-bold text-emerald-800 text-lg">Propuesta Aprobada</h4>
                      <p class="text-sm text-slate-600 mt-1">El equipo ha sido notificado y el portal de la cuenta ha sido actualizado. ¡Gracias por confiar en nosotros!</p>
                   </div>
                   
                   <!-- Estado Rechazado -->
                   <div *ngIf="data?.estadoActual === 'Rechazada'" class="text-center py-4">
                      <div class="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                         <lucide-icon name="x-circle" class="w-8 h-8"></lucide-icon>
                      </div>
                      <h4 class="font-bold text-rose-800 text-lg">Propuesta Declinada</h4>
                      <p class="text-sm text-slate-600 mt-1">Nuestros agentes se pondrán en contacto contigo en caso de dudas o ajustes necesarios.</p>
                   </div>
                </div>

             </div>
          </div>
        </div>
      </main>

      <footer class="bg-white border-t border-slate-200 py-8 text-center text-sm text-slate-500 pb-12">
         © {{ currentYear }} {{ tenantName }}. Todos los derechos reservados.<br>
         <span class="text-xs text-slate-400 mt-2 block">Powered by Estratega CRM</span>
      </footer>
    </div>

    <!-- Loading State -->
    <div class="h-screen w-full flex flex-col items-center justify-center bg-slate-50" *ngIf="isLoading">
       <lucide-icon name="loader-2" class="w-10 h-10 text-slate-400 animate-spin mb-4"></lucide-icon>
       <p class="text-slate-500 font-medium animate-pulse">Cargando propuesta segura...</p>
    </div>

    <!-- Error State -->
    <div class="h-screen w-full flex flex-col items-center justify-center bg-slate-50 px-4" *ngIf="!isLoading && loadingError">
       <div class="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <lucide-icon name="x-circle" class="w-8 h-8"></lucide-icon>
       </div>
       <h2 class="text-2xl font-bold text-slate-900 mb-2 text-center">Propuesta Protegida o Invalida</h2>
       <p class="text-slate-600 text-center max-w-md">No hemos encontrado este documento o ha expirado. Por favor, solicita a tu ejecutivo un nuevo enlace.</p>
    </div>
  `
})
export class InteractiveProposalComponent implements OnInit {
   private route = inject(ActivatedRoute);
   private functions = inject(Functions);
   private fb = inject(FormBuilder);
   private toastr = inject(ToastrService);
   private titleService = inject(Title);

   cotiId: string | null = null;

   isLoading = true;
   loadingError = false;
   isProcessing = false;

   // Data
   data: any = null;
   tenantConfig: any = null;
   tenantName: string = 'Empresa';
   clientName: string = 'Cliente';

   currentYear = new Date().getFullYear();

   opcionalesSeleccionados: { [index: number]: boolean } = {};

   firmaForm: FormGroup = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      idNumber: ['']
   });

   get effectiveSubtotal(): number {
      if (!this.data) return 0;
      let sub = this.data.subtotal; // Base firm commitment
      if (this.data.items) {
         this.data.items.forEach((item: any, index: number) => {
            if (item.opcional && this.opcionalesSeleccionados[index]) {
               sub += item.subtotal;
            }
         });
      }
      return sub;
   }

   get effectiveDiscount(): number {
      if (!this.data || !this.data.descuento) return 0;
      if (this.data.descuento.tipo === 'monto') {
         return Math.min(this.data.descuento.valor, this.effectiveSubtotal);
      } else {
         return this.effectiveSubtotal * (this.data.descuento.valor / 100);
      }
   }

   get effectiveTax(): number {
      if (!this.data) return 0;
      const subConDesc = this.effectiveSubtotal - this.effectiveDiscount;
      return subConDesc * ((this.data.porcentajeImpuesto || 0) / 100);
   }

   get effectiveTotal(): number {
      if (!this.data) return 0;
      return (this.effectiveSubtotal - this.effectiveDiscount) + this.effectiveTax;
   }

   toggleOpcional(index: number) {
      if (this.data?.estadoActual !== 'Enviada' && this.data?.estadoActual !== 'Revision_Solicitada') return;
      this.opcionalesSeleccionados[index] = !this.opcionalesSeleccionados[index];
   }

   ngOnInit() {
      this.cotiId = this.route.snapshot.paramMap.get('id');
      if (this.cotiId) {
         this.fetchPublicProposal(this.cotiId);
      } else {
         this.isLoading = false;
         this.loadingError = true;
      }
   }

   async fetchPublicProposal(id: string) {
      try {
         const getPublicFn = httpsCallable(this.functions, 'getPublicCotizacion');
         const response = await getPublicFn({ id });
         const payload: any = response.data;

         if (payload?.success) {
            this.data = payload.cotizacion;
            this.tenantConfig = payload.tenant.config;
            this.tenantName = payload.tenant.nombreEmpresa;
            this.clientName = payload.cliente.nombreEmpresa;

            // Setup local state for accepted optionals if already accepted (historical state)
            if (this.data.estadoActual === 'Aceptada') {
               this.data.items.forEach((item: any, i: number) => {
                  if (item.opcional && item.aceptadoClientSide) {
                     this.opcionalesSeleccionados[i] = true;
                  }
               });
            }

            // Setup Brand Name into the Page Title dynamically
            this.titleService.setTitle(`Propuesta Comercial | ${this.tenantName}`);

            this.loadingError = false;
         } else {
            this.loadingError = true;
         }
      } catch (e: any) {
         console.error('Llamada a Cloud Function fallida:', e);
         this.loadingError = true;
      } finally {
         this.isLoading = false;
      }
   }

   async firmarPropuesta() {
      if (this.firmaForm.invalid || !this.cotiId) return;

      this.isProcessing = true;
      try {
         const formVal = this.firmaForm.value;
         const acceptFn = httpsCallable(this.functions, 'acceptPublicCotizacion');

         const opcionalesAceptados: number[] = [];
         if (this.data.items) {
            this.data.items.forEach((item: any, i: number) => {
               if (item.opcional && this.opcionalesSeleccionados[i]) {
                  opcionalesAceptados.push(i);
               }
            });
         }

         const payload = await acceptFn({
            id: this.cotiId,
            firmaDato: {
               name: formVal.name,
               idNumber: formVal.idNumber,
               ip: 'Client-Detected-IP' // Generalmente la IP se saca en el backend vía Request Headers `x-forwarded-for`, pero esto es mock
            },
            opcionalesAceptados
         });

         if ((payload.data as any).success) {
            this.toastr.success('¡Propuesta firmada exitosamente! El equipo ha sido notificado.');
            this.data.estadoActual = 'Aceptada'; // Optimistic local update
         }
      } catch (error: any) {
         console.error(error);
         this.toastr.error('Hubo un error procesando tu firma electrónica. Intenta nuevamente o contacta a la empresa.');
      } finally {
         this.isProcessing = false;
      }
   }
}
