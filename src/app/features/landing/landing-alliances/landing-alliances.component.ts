import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language';
import { LucideAngularModule, Network, Globe2, Lightbulb, Handshake } from 'lucide-angular';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-landing-alliances',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './landing-alliances.component.html',
    animations: [
        trigger('fadeUp', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(20px)' }),
                animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ])
    ]
})
export class LandingAlliancesComponent implements OnInit {
    languageService = inject(LanguageService);

    get title() {
        const lang = this.languageService.currentLang() as 'es' | 'en' | 'pt';
        return {
            es: 'Redes y Alianzas Estratégicas',
            en: 'Strategic Networks & Alliances',
            pt: 'Redes e Alianças Estratégicas'
        }[lang];
    }

    get description() {
        const lang = this.languageService.currentLang() as 'es' | 'en' | 'pt';
        return {
            es: 'Impulsamos resultados con una red activa de aliados estratégicos en Chile y Latinoamérica. Articulamos empresas, academia, sector público y ecosistemas de innovación para acelerar adopción de inteligencia artificial, co-crear soluciones y escalar proyectos con impacto medible.',
            en: 'We drive results with an active network of strategic partners in Chile and Latin America. We articulate companies, academia, the public sector, and innovation ecosystems to accelerate AI adoption, co-create solutions, and scale projects with measurable impact.',
            pt: 'Impulsionamos resultados com uma rede ativa de parceiros estratégicos no Chile e na América Latina. Articulamos empresas, academia, setor público e ecossistemas de inovação para acelerar a adoção de IA, co-criar soluções e escalar projetos com impacto mensurável.'
        }[lang];
    }

    get ctaText() {
        const lang = this.languageService.currentLang() as 'es' | 'en' | 'pt';
        return {
            es: 'Socio o Aliado? Conversemos',
            en: 'Partner or Ally? Let\'s Talk',
            pt: 'Parceiro ou Aliado? Vamos Conversar'
        }[lang];
    }

    features = [
        { icon: Network, bg: 'bg-blue-500/10', color: 'text-blue-500', title: { es: 'Conexión', en: 'Connection', pt: 'Conexão' }, text: { es: 'Conectamos capacidades y recursos.', en: 'We connect capabilities and resources.', pt: 'Conectamos capacidades e recursos.' } },
        { icon: Globe2, bg: 'bg-indigo-500/10', color: 'text-indigo-500', title: { es: 'Ecosistema', en: 'Ecosystem', pt: 'Ecossistema' }, text: { es: 'Alcance en Chile y Latinoamérica.', en: 'Reach in Chile and Latin America.', pt: 'Alcance no Chile e na América Latina.' } },
        { icon: Lightbulb, bg: 'bg-emerald-500/10', color: 'text-emerald-500', title: { es: 'Co-creación', en: 'Co-creation', pt: 'Co-criação' }, text: { es: 'Diseñamos soluciones en conjunto.', en: 'We design solutions together.', pt: 'Desenhamos soluções em conjunto.' } },
        { icon: Handshake, bg: 'bg-purple-500/10', color: 'text-purple-500', title: { es: 'Impacto', en: 'Impact', pt: 'Impacto' }, text: { es: 'Escalamos proyectos con valor.', en: 'We scale projects with value.', pt: 'Escalamos projetos com valor.' } }
    ];

    ngOnInit(): void { }
}
