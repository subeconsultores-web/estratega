import { Injectable } from '@angular/core';
import { ScoreIA } from '../models/cliente.model';

@Injectable({
    providedIn: 'root'
})
export class ScoringService {

    constructor() { }

    getScoreColor(score: number | undefined): string {
        if (score === undefined || score === null) return 'var(--text-secondary)';
        if (score < 40) return '#ef4444'; // Rojo (Baja probabilidad)
        if (score < 70) return '#eab308'; // Amarillo (Media probabilidad)
        return '#22c55e'; // Verde (Alta probabilidad)
    }

    getScoreLabel(score: number | undefined): string {
        if (score === undefined || score === null) return 'Sin Evaluar';
        if (score < 40) return 'Bajo';
        if (score < 70) return 'Medio';
        return 'Alto';
    }

    getConfidenceIcon(confianza: ScoreIA['confianza'] | undefined): string {
        if (!confianza) return 'help_outline';
        switch (confianza) {
            case 'alta': return 'verified';
            case 'media': return 'check_circle_outline';
            case 'baja': return 'error_outline';
            default: return 'help_outline';
        }
    }
}
