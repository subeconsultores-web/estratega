import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-portal-dashboard',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterModule],
    template: `
        <div class="space-y-6">
            <!-- Saludo -->
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Hola de nuevo</h1>
                <p class="text-gray-500 mt-1">Aquí está el resumen del avance de tus proyectos y estado de cuenta al día de hoy.</p>
            </div>

            <!-- Stats Rápidas -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Deuda Pendiente</p>
                            <p class="text-3xl font-bold text-gray-900 mt-2">$0</p>
                        </div>
                        <div class="p-2 bg-green-50 text-green-600 rounded-lg">
                            <lucide-icon name="check-circle" class="w-5 h-5"></lucide-icon>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Proyectos Activos</p>
                            <p class="text-3xl font-bold text-gray-900 mt-2">1</p>
                        </div>
                        <div class="p-2 bg-blue-50 text-primary rounded-lg">
                            <lucide-icon name="briefcase" class="w-5 h-5"></lucide-icon>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Soporte Activo</p>
                            <p class="text-xl font-bold text-gray-900 mt-2 flex items-center">
                                <span class="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Todo en orden
                            </p>
                        </div>
                        <div class="p-2 bg-gray-50 text-gray-400 rounded-lg">
                            <lucide-icon name="headphones" class="w-5 h-5"></lucide-icon>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Accesos Rapidos o Facturas Urgentes -->
            <h2 class="text-lg font-bold text-gray-900 mt-8 mb-4">Módulos</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               
               <a routerLink="/portal/proyectos" class="group bg-white border border-gray-200 rounded-xl p-5 hover:border-primary hover:shadow-md transition-all cursor-pointer">
                   <div class="w-10 h-10 bg-blue-50 text-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       <lucide-icon name="folder-kanban" class="w-5 h-5"></lucide-icon>
                   </div>
                   <h3 class="font-bold text-gray-900">Seguimiento Operativo</h3>
                   <p class="text-sm text-gray-500 mt-1">Revisa el avance de tareas en tiempo real de tus proyectos vigentes.</p>
               </a>
               
               <a routerLink="/portal/facturas" class="group bg-white border border-gray-200 rounded-xl p-5 hover:border-primary hover:shadow-md transition-all cursor-pointer">
                   <div class="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       <lucide-icon name="receipt" class="w-5 h-5"></lucide-icon>
                   </div>
                   <h3 class="font-bold text-gray-900">Facturación y Pagos</h3>
                   <p class="text-sm text-gray-500 mt-1">Descarga PDFs de tus ciclos de cobro y emite pagos vía Tarjeta de Crédito.</p>
               </a>

            </div>
        </div>
    `
})
export class PortalDashboardComponent { }
