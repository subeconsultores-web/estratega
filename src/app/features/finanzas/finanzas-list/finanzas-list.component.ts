import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FinanzasService } from '../../../core/services/finanzas.service';
import { Transaccion } from '../../../core/models/finanzas.model';
import { Observable } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { RouterModule } from '@angular/router';
import { LoadingSkeleton } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
    selector: 'app-finanzas-list',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterModule, LoadingSkeleton],
    templateUrl: './finanzas-list.component.html'
})
export class FinanzasListComponent implements OnInit {
    private finanzasService = inject(FinanzasService);

    transacciones$!: Observable<Transaccion[]>;

    ngOnInit() {
        this.transacciones$ = this.finanzasService.getTransacciones();
    }
}
