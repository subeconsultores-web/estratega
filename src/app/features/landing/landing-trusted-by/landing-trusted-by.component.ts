import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language';
import { LucideAngularModule, Building2, Landmark, GraduationCap, BriefcaseBusiness } from 'lucide-angular';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-landing-trusted-by',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './landing-trusted-by.component.html',
    animations: [
        trigger('fadeUp', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(20px)' }),
                animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ])
    ]
})
export class LandingTrustedByComponent implements OnInit {
    languageService = inject(LanguageService);

    // Translated title
    get title() {
        const lang = this.languageService.currentLang() as 'es' | 'en' | 'pt';
        return {
            es: 'Han confiado en nosotros',
            en: 'Trusted By',
            pt: 'Confiaram em nós'
        }[lang];
    }

    // Translated subtitle
    get subtitle() {
        const lang = this.languageService.currentLang() as 'es' | 'en' | 'pt';
        return {
            es: 'Presentamos una selección de instituciones, empresas y organizaciones de Chile y Latinoamérica que han confiado en SUBE IA para impulsar sus procesos de transformación digital y adopción responsable de inteligencia artificial.',
            en: 'We present a selection of institutions, companies, and organizations from Chile and Latin America that have trusted SUBE IA to drive their digital transformation and responsible AI adoption processes.',
            pt: 'Apresentamos uma seleção de instituições, empresas e organizações do Chile e da América Latina que confiaram na SUBE IA para impulsionar seus processos de transformação digital e adoção responsável de inteligência artificial.'
        }[lang];
    }

    // Placeholder clients categorized by sectors
    clients = [
        { name: 'Empresas Corporativas', icon: BriefcaseBusiness, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { name: 'Sector Público', icon: Landmark, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { name: 'Educación Superior', icon: GraduationCap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { name: 'PYMEs e Innovadores', icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        // Duplicate for marquee effect
        { name: 'Empresas Corporativas', icon: BriefcaseBusiness, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { name: 'Sector Público', icon: Landmark, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { name: 'Educación Superior', icon: GraduationCap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { name: 'PYMEs e Innovadores', icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    ];

    ngOnInit(): void { }
}
