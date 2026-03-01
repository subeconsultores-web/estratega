import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
    selector: 'app-skill-radar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './skill-radar.component.html',
    styleUrls: ['./skill-radar.component.scss']
})
export class SkillRadarComponent implements AfterViewInit, OnDestroy {
    @ViewChild('radarCanvas') radarCanvas!: ElementRef<HTMLCanvasElement>;
    private chartInstance: Chart | null = null;

    ngAfterViewInit(): void {
        this.initChart();
    }

    ngOnDestroy(): void {
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
    }

    private initChart() {
        const ctx = this.radarCanvas.nativeElement.getContext('2d');
        if (!ctx) return;

        // Create gradient for the radar fill
        const gradient = ctx.createRadialGradient(
            this.radarCanvas.nativeElement.width / 2,
            this.radarCanvas.nativeElement.height / 2,
            0,
            this.radarCanvas.nativeElement.width / 2,
            this.radarCanvas.nativeElement.height / 2,
            this.radarCanvas.nativeElement.width / 2
        );
        gradient.addColorStop(0, 'rgba(0, 229, 255, 0.6)');
        gradient.addColorStop(0.5, 'rgba(176, 38, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 230, 118, 0.2)');

        this.chartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: [
                    'Pensamiento Crítico', 'Resiliencia', 'Gestión del Tiempo',
                    'Liderazgo', 'Trabajo en Equipo', 'Resolución Problemas',
                    'Adaptabilidad', 'Fluidez Digital (IA)', 'Comunicación',
                    'Creatividad', 'Ética Profesional', 'Empatía', 'Toma Decisiones'
                ],
                datasets: [{
                    label: 'Nivel Actual',
                    data: [5, 4, 3, 5, 6, 2, 5, 4, 6, 5, 6, 4, 5],
                    backgroundColor: gradient,
                    borderColor: '#00E5FF',
                    pointBackgroundColor: '#00E676',
                    pointBorderColor: '#B026FF',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#00E5FF',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        titleColor: '#00E5FF',
                        titleFont: { family: 'Inter', size: 14, weight: 'bold' },
                        bodyColor: '#F8FAFC',
                        bodyFont: { family: 'Inter', size: 13 },
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 4,
                        usePointStyle: true
                    }
                },
                scales: {
                    r: {
                        min: 0,
                        max: 6,
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        pointLabels: {
                            color: '#94A3B8',
                            font: { family: 'Inter', size: 11 }
                        },
                        ticks: {
                            display: false,
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
}
