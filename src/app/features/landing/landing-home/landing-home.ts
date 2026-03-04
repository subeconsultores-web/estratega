import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowRight, Zap, Sparkles, Code, Cpu } from 'lucide-angular';
import { CmsService } from '../../../core/services/cms';
import { LanguageService } from '../../../core/services/language';
import { LandingConfig } from '../../../core/models/cms.model';
import { firstValueFrom } from 'rxjs';
import { LandingTrustedByComponent } from '../landing-trusted-by/landing-trusted-by.component';
import { LandingAlliancesComponent } from '../landing-alliances/landing-alliances.component';

@Component({
  selector: 'app-landing-home',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, LandingTrustedByComponent, LandingAlliancesComponent],
  templateUrl: './landing-home.html',
  styleUrl: './landing-home.scss',
})
export class LandingHome implements OnInit {
  cmsService = inject(CmsService);
  languageService = inject(LanguageService);

  config = signal<LandingConfig | undefined>(undefined);
  isLoading = signal(true);

  readonly icons = { ArrowRight, Zap, Sparkles, Code, Cpu };

  async ngOnInit() {
    try {
      const conf = await firstValueFrom(this.cmsService.getLandingConfig());
      if (conf) {
        this.config.set(conf);
      }
    } catch (err) {
      console.error('Error fetching CMS config', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  get translatedHeroTitle() {
    const c = this.config();
    if (!c) return this.languageService.currentLang() === 'es' ? 'Transformamos el mundo con Inteligencia Artificial + Inteligencia Humana' : 'We transform the world with Artificial Intelligence + Human Intelligence';
    return this.languageService.getTranslate(c.heroTitle) || '';
  }

  get translatedHeroSubtitle() {
    const c = this.config();
    if (!c) return this.languageService.currentLang() === 'es' ? 'Expertos en IA para potenciar tu productividad y eficiencia de manera sostenible' : 'AI experts to boost your productivity and efficiency sustainably';
    return this.languageService.getTranslate(c.heroSubtitle) || '';
  }
}

