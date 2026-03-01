import { Component, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Play, Pause, RotateCcw, ShieldCheck, Clock, Activity, AlertTriangle } from 'lucide-angular';

interface ReplayEvent {
    timestamp: string;
    action: 'START' | 'FOCUS_OUT' | 'ANSWER_START' | 'ANSWER_SUBMIT' | 'CODE_RUN' | 'FINISH';
    questionId?: string;
    details?: string;
    riskScore: number; // 0-100 indicating fraud risk
}

@Component({
    selector: 'app-proof-of-competence-replay',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './proof-of-competence-replay.component.html',
    styleUrls: ['./proof-of-competence-replay.component.scss']
})
export class ProofOfCompetenceReplayComponent implements OnDestroy {
    // Configuración de Iconos
    readonly PlayIcon = Play;
    readonly PauseIcon = Pause;
    readonly ResetIcon = RotateCcw;
    readonly ShieldIcon = ShieldCheck;
    readonly ClockIcon = Clock;
    readonly ActivityIcon = Activity;
    readonly AlertIcon = AlertTriangle;

    // Datos simulados del Replay (Normalmente vendrían de un Firestore Document)
    events: ReplayEvent[] = [
        { timestamp: '00:00:00', action: 'START', details: 'Evaluación Iniciada', riskScore: 0 },
        { timestamp: '00:02:15', action: 'ANSWER_START', questionId: 'Q1', details: 'Escribiendo respuesta', riskScore: 0 },
        { timestamp: '00:03:40', action: 'ANSWER_SUBMIT', questionId: 'Q1', details: 'Respuesta guardada', riskScore: 0 },
        { timestamp: '00:04:10', action: 'FOCUS_OUT', details: 'Pérdida de foco del navegador', riskScore: 65 }, // Alerta de riesgo (Copypaste / buscar info)
        { timestamp: '00:05:30', action: 'CODE_RUN', questionId: 'Q2', details: 'Ejecución de código Fallida', riskScore: 10 },
        { timestamp: '00:07:45', action: 'CODE_RUN', questionId: 'Q2', details: 'Ejecución de código Exitosa', riskScore: 0 },
        { timestamp: '00:08:00', action: 'ANSWER_SUBMIT', questionId: 'Q2', details: 'Código enviado', riskScore: 0 },
        { timestamp: '00:15:20', action: 'FINISH', details: 'Evaluación Completada', riskScore: 0 }
    ];

    // Estado del Replay
    isPlaying = signal<boolean>(false);
    currentTimeIndex = signal<number>(0);
    playbackSpeed = signal<number>(1);

    private timer: any;

    constructor() {
        // Reaccionar a cambios en reproducción
        effect(() => {
            if (this.isPlaying()) {
                this.startTimer();
            } else {
                this.stopTimer();
            }
        });
    }

    ngOnDestroy() {
        this.stopTimer();
    }

    togglePlay() {
        if (this.currentTimeIndex() >= this.events.length - 1) {
            // Si ya terminó, reiniciar
            this.currentTimeIndex.set(0);
        }
        this.isPlaying.set(!this.isPlaying());
    }

    reset() {
        this.isPlaying.set(false);
        this.currentTimeIndex.set(0);
    }

    setSpeed(speed: number) {
        this.playbackSpeed.set(speed);
        if (this.isPlaying()) {
            this.stopTimer();
            this.startTimer();
        }
    }

    seekTo(index: number) {
        this.currentTimeIndex.set(index);
    }

    get currentEvent(): ReplayEvent | undefined {
        return this.events[this.currentTimeIndex()];
    }

    get maxRiskScore(): number {
        return Math.max(...this.events.map(e => e.riskScore));
    }

    private startTimer() {
        const baseInterval = 1000; // 1 segundo real por evento para demo visual
        const actualInterval = baseInterval / this.playbackSpeed();

        this.timer = setInterval(() => {
            if (this.currentTimeIndex() < this.events.length - 1) {
                this.currentTimeIndex.update(i => i + 1);
            } else {
                this.isPlaying.set(false);
                this.stopTimer();
            }
        }, actualInterval);
    }

    private stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    // Helpers UI
    getEventColor(action: string): string {
        switch (action) {
            case 'START': case 'FINISH': return 'text-cyan-400';
            case 'FOCUS_OUT': return 'text-rose-500';
            case 'CODE_RUN': return 'text-amber-400';
            default: return 'text-emerald-400';
        }
    }

    getRiskColor(score: number): string {
        if (score > 50) return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
        if (score > 20) return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    }
}
