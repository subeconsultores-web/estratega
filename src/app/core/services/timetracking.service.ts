import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { TareasService } from './tareas.service';
import { Tarea } from '../models/proyectos.model';

export interface ActiveTracker {
    tareaId: string;
    tareaTitulo: string;
    startTime: number; // Unix timestamp
    elapsedSeconds: number; // Accumulated prior to this run
    isActive: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class TimetrackingService {
    private tareasService = inject(TareasService);

    private activeSession = new BehaviorSubject<ActiveTracker | null>(null);
    public activeSession$ = this.activeSession.asObservable();

    private timerSub: Subscription | null = null;

    // An observable that updates every second if running
    private currentElapsed = new BehaviorSubject<number>(0);
    public currentElapsed$ = this.currentElapsed.asObservable();

    startTracking(tarea: Tarea) {
        // If there's an active one, stop it first
        if (this.activeSession.value?.isActive) {
            this.stopTracking();
        }

        const initialElapsed = (tarea.tiempoConsumido || 0) * 3600; // Convert hours from DB to seconds

        const sessionTracker: ActiveTracker = {
            tareaId: tarea.id!,
            tareaTitulo: tarea.titulo,
            startTime: Date.now(),
            elapsedSeconds: initialElapsed,
            isActive: true
        };

        this.activeSession.next(sessionTracker);
        this.currentElapsed.next(initialElapsed);

        this.timerSub = timer(0, 1000).subscribe(() => {
            const current = this.activeSession.value;
            if (current && current.isActive) {
                const now = Date.now();
                const diffSeconds = Math.floor((now - current.startTime) / 1000);
                this.currentElapsed.next(current.elapsedSeconds + diffSeconds);
            }
        });
    }

    pauseTracking() {
        const current = this.activeSession.value;
        if (current && current.isActive) {
            if (this.timerSub) this.timerSub.unsubscribe();

            const now = Date.now();
            const sessionTimeSeconds = Math.floor((now - current.startTime) / 1000);

            this.activeSession.next({
                ...current,
                elapsedSeconds: current.elapsedSeconds + sessionTimeSeconds,
                isActive: false
            });
        }
    }

    resumeTracking() {
        const current = this.activeSession.value;
        if (current && !current.isActive) {
            this.activeSession.next({
                ...current,
                startTime: Date.now(),
                isActive: true
            });

            this.timerSub = timer(0, 1000).subscribe(() => {
                const updatedCurrent = this.activeSession.value!;
                const now = Date.now();
                const diffSeconds = Math.floor((now - updatedCurrent.startTime) / 1000);
                this.currentElapsed.next(updatedCurrent.elapsedSeconds + diffSeconds);
            });
        }
    }

    async stopTracking() {
        const current = this.activeSession.value;
        if (!current) return;

        let totalSeconds = current.elapsedSeconds;
        if (current.isActive) {
            const now = Date.now();
            totalSeconds += Math.floor((now - current.startTime) / 1000);
        }

        if (this.timerSub) {
            this.timerSub.unsubscribe();
            this.timerSub = null;
        }

        // Clean UI visual state
        this.activeSession.next(null);
        this.currentElapsed.next(0);

        // Convert back to fractional hours
        const fractionalHours = totalSeconds / 3600;

        try {
            await this.tareasService.updateTarea(current.tareaId, {
                tiempoConsumido: parseFloat(fractionalHours.toFixed(2))
            });
            console.log(`[Timetrack Record] Tracked ${fractionalHours.toFixed(2)}h for Task ${current.tareaId}`);
        } catch (error) {
            console.error('Failed to commit tracking session offline.', error);
        }
    }
}
