import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { FirmaData } from '../../../core/models/contrato.model';
import { ContratoService } from '../../../core/services/contrato.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-signature-pad',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './signature-pad.component.html'
})
export class SignaturePadComponent implements AfterViewInit {
    @Input() contratoId!: string;
    @Input() tenantId!: string;
    @Output() firmaCompletada = new EventEmitter<FirmaData>();

    private toastr = inject(ToastrService);
    private contratoService = inject(ContratoService);

    activeTab: 'dibujo' | 'upload' | 'digital' = 'dibujo';
    isSubmitting = false;

    // --- DIBUJO ---
    @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
    private ctx!: CanvasRenderingContext2D | null;
    private isDrawing = false;
    hasDrawn = false;

    // --- UPLOAD ---
    selectedFile: File | null = null;

    // --- DIGITAL ---
    nombreDigital = '';
    aceptaTerminos = false;

    ngAfterViewInit() {
        this.initCanvas();
    }

    setTab(tab: 'dibujo' | 'upload' | 'digital') {
        this.activeTab = tab;
        // reset if needed
        if (tab === 'dibujo') {
            setTimeout(() => this.initCanvas(), 0);
        }
    }

    // --- CANVAS LOGIC ---
    private initCanvas() {
        if (!this.canvasRef) return;
        const canvas = this.canvasRef.nativeElement;
        // Fix resolution
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        this.ctx = canvas.getContext('2d');
        if (this.ctx) {
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.strokeStyle = '#000000';
        }
        this.hasDrawn = false;
    }

    startDrawing(e: MouseEvent | TouchEvent) {
        e.preventDefault();
        this.isDrawing = true;
        this.hasDrawn = true;
        const pos = this.getPos(e);
        if (this.ctx) {
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
        }
    }

    draw(e: MouseEvent | TouchEvent) {
        if (!this.isDrawing) return;
        e.preventDefault();
        const pos = this.getPos(e);
        if (this.ctx) {
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();
        }
    }

    stopDrawing() {
        this.isDrawing = false;
        if (this.ctx) this.ctx.closePath();
    }

    clearCanvas() {
        if (!this.ctx || !this.canvasRef) return;
        const canvas = this.canvasRef.nativeElement;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.hasDrawn = false;
    }

    private getPos(evt: MouseEvent | TouchEvent) {
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if (evt instanceof TouchEvent) {
            clientX = evt.touches[0].clientX;
            clientY = evt.touches[0].clientY;
        } else {
            clientX = evt.clientX;
            clientY = evt.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    // --- UPLOAD LOGIC ---
    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
            this.selectedFile = file;
        } else {
            this.toastr.error('Solo se permiten imágenes PNG o JPG');
            this.selectedFile = null;
        }
    }

    // --- SUBMIT FIRMA ---
    async firmarContrato() {
        this.isSubmitting = true;

        try {
            if (this.activeTab === 'dibujo') {
                if (!this.hasDrawn) {
                    this.toastr.warning('Por favor dibuja tu firma.');
                    this.isSubmitting = false; return;
                }
                const dataUrl = this.canvasRef.nativeElement.toDataURL('image/png');
                const fileUrl = await this.contratoService.uploadFirmaDibujo(this.tenantId, this.contratoId, dataUrl);

                this.emitFirma({
                    metodo: 'dibujo',
                    urlFirmaStorage: fileUrl
                });

            } else if (this.activeTab === 'upload') {
                if (!this.selectedFile) {
                    this.toastr.warning('Selecciona una imagen de tu firma plana');
                    this.isSubmitting = false; return;
                }
                const fileUrl = await this.contratoService.uploadFirmaFile(this.tenantId, this.contratoId, this.selectedFile);

                this.emitFirma({
                    metodo: 'upload',
                    urlFirmaStorage: fileUrl
                });

            } else if (this.activeTab === 'digital') {
                if (!this.nombreDigital.trim() || !this.aceptaTerminos) {
                    this.toastr.warning('Ingresa tu nombre y acepta los términos de firma digital');
                    this.isSubmitting = false; return;
                }

                this.emitFirma({
                    metodo: 'digital',
                    auditTrail: {
                        nombreTipeado: this.nombreDigital,
                        timestamp: new Date(),
                        userAgent: navigator.userAgent
                    }
                });
            }

        } catch (e) {
            console.error(e);
            this.toastr.error('Error procesando la firma');
            this.isSubmitting = false;
        }
    }

    private emitFirma(data: FirmaData) {
        this.toastr.success('Firma procesada con éxito');
        this.isSubmitting = false;
        this.firmaCompletada.emit(data);
    }
}
