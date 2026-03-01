import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-churn-radar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './churn-radar.component.html',
    styleUrls: ['./churn-radar.component.scss']
})
export class ChurnRadarComponent implements OnInit {
    @Input() churnRiskScore: number = 25; // Default score 0-100
    @Input() trend: 'up' | 'down' | 'stable' = 'stable';

    public riskLevel: 'low' | 'medium' | 'high' = 'low';
    public displayScore: number = 0;

    ngOnInit() {
        this.calculateRiskLevel();
        // Animate the score up to the actual value
        this.animateScore();
    }

    private calculateRiskLevel() {
        if (this.churnRiskScore < 30) {
            this.riskLevel = 'low';
        } else if (this.churnRiskScore < 70) {
            this.riskLevel = 'medium';
        } else {
            this.riskLevel = 'high';
        }
    }

    private animateScore() {
        const duration = 1500; // ms
        const steps = 60;
        const stepTime = duration / steps;
        const increment = this.churnRiskScore / steps;
        let currentStep = 0;

        const interval = setInterval(() => {
            currentStep++;
            this.displayScore = Math.min(Math.round(increment * currentStep), this.churnRiskScore);

            if (currentStep >= steps) {
                clearInterval(interval);
            }
        }, stepTime);
    }

    getNeonColor(): string {
        switch (this.riskLevel) {
            case 'low': return 'text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.3)]';
            case 'medium': return 'text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
            case 'high': return 'text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
            default: return 'text-cyan-400';
        }
    }

    getBgGradient(): string {
        switch (this.riskLevel) {
            case 'low': return 'from-emerald-950/40 to-slate-900';
            case 'medium': return 'from-amber-950/40 to-slate-900';
            case 'high': return 'from-rose-950/40 to-slate-900';
            default: return '';
        }
    }
}
