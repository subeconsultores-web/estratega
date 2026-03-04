import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Target, Eye, Code, Cpu, ChevronRight, Linkedin } from 'lucide-angular';
import { CmsService } from '../../../core/services/cms';
import { LanguageService } from '../../../core/services/language';
import { LandingConfig, TeamMember } from '../../../core/models/cms.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-landing-about',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './landing-about.html',
  styleUrl: './landing-about.scss',
})
export class LandingAbout implements OnInit {
  cmsService = inject(CmsService);
  languageService = inject(LanguageService);

  config = signal<LandingConfig | undefined>(undefined);
  team = signal<TeamMember[]>([]);
  isLoading = signal(true);

  readonly icons = { Target, Eye, Code, Cpu, ChevronRight, Linkedin };

  async ngOnInit() {
    try {
      const conf = await firstValueFrom(this.cmsService.getLandingConfig());
      if (conf) {
        this.config.set(conf);
      }

      this.cmsService.getTeamMembers(true).subscribe(members => {
        this.team.set(members);
      });
    } catch (err) {
      console.error('Error fetching CMS data', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  get translatedAboutTitle() {
    const c = this.config();
    if (!c) return this.languageService.currentLang() === 'es' ? 'Nuestra Historia' : 'Our History';
    return this.languageService.getTranslate(c.aboutTitle);
  }

  get translatedAboutDescription() {
    const c = this.config();
    if (!c || !c.aboutDescription?.es) return this.languageService.currentLang() === 'es'
      ? '<p>Somos un equipo especializado en inteligencia artificial aplicado a organizaciones, dedicado a acompañar procesos de transformación con soluciones innovadoras, efectivas y alineadas a los objetivos estratégicos de cada institución. Combinamos experiencia técnica, visión ética y enfoque humano para fortalecer equipos, optimizar procesos y generar impacto sostenible en empresas y entidades de Chile y Latinoamérica.</p>'
      : '<p>We are a specialized team in artificial intelligence applied to organizations, dedicated to accompanying transformation processes with innovative, effective solutions aligned with the strategic objectives of each institution. We combine technical expertise, ethical vision, and a human approach to strengthen teams, optimize processes, and generate sustainable impact in companies across Chile and Latin America.</p>';
    return this.languageService.getTranslate(c.aboutDescription);
  }

  get translatedMissionText() {
    const c = this.config();
    if (!c || !c.missionText?.es) return this.languageService.currentLang() === 'es'
      ? '<p>Impulsamos la transformación de organizaciones mediante inteligencia artificial aplicada, combinando análisis estratégico, tecnologías avanzadas y un profundo enfoque humano. Desarrollamos soluciones que mejoran la productividad, optimizan procesos y fortalecen equipos de manera ética, responsable y sostenible.</p>'
      : '<p>We drive the transformation of organizations through applied artificial intelligence, combining strategic analysis, advanced technologies, and a profound human approach. We develop solutions that improve productivity, optimize processes, and strengthen teams ethically, responsibly, and sustainably.</p>';
    return this.languageService.getTranslate(c.missionText);
  }

  get translatedVisionText() {
    const c = this.config();
    if (!c || !c.visionText?.es) return this.languageService.currentLang() === 'es'
      ? '<p>Ser referentes en Chile y Latinoamérica en la adopción innovadora de Inteligencia Artificial corporativa, transformando el mundo al potenciar el talento humano con IA, acelerando la transición hacia ecosistemas operativos hiper-eficientes, seguros e inteligentes.</p>'
      : '<p>To be benchmarks in Chile and Latin America in the innovative adoption of corporate Artificial Intelligence, transforming the world by empowering human talent with AI, accelerating the transition to hyper-efficient, secure, and intelligent operational ecosystems.</p>';
    return this.languageService.getTranslate(c.visionText);
  }
}

