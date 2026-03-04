import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Code, Cpu, GraduationCap, ArrowRight, CheckCircle2, Bot, Layers } from 'lucide-angular';
import { LanguageService } from '../../../core/services/language';

@Component({
  selector: 'app-landing-services',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './landing-services.html',
  styleUrl: './landing-services.scss',
})
export class LandingServices {
  languageService = inject(LanguageService);

  readonly icons = { Code, Cpu, GraduationCap, ArrowRight, CheckCircle2, Bot, Layers };

  services = [
    {
      id: 'academia',
      icon: GraduationCap,
      color: 'blue',
      title: {
        es: 'Academia de formación en Inteligencia Artificial',
        en: 'Artificial Intelligence Training Academy',
        pt: 'Academia de Formação em Inteligência Artificial'
      },
      description: {
        es: 'Plataforma especializada en capacitación ejecutiva y técnica en inteligencia artificial, orientada a desarrollar competencias prácticas y estratégicas en profesionales, equipos y organizaciones que buscan adoptar IA de manera responsable, ética y sostenible.',
        en: 'Specialized platform in executive and technical training in artificial intelligence, aimed at developing practical and strategic skills in professionals, teams, and organizations seeking to adopt AI responsibly, ethically, and sustainably.',
        pt: 'Plataforma especializada em capacitação executiva e técnica em inteligência artificial, orientada a desenvolver competências práticas e estratégicas em profissionais, equipes e organizações que buscam adotar IA de maneira responsável, ética e sustentável.'
      },
      features: {
        es: ['Capacitación Ejecutiva', 'Competencias Prácticas', 'Adopción Ética y Sostenible'],
        en: ['Executive Training', 'Practical Skills', 'Ethical and Sustainable Adoption'],
        pt: ['Capacitação Executiva', 'Competências Práticas', 'Adoção Ética e Sustentável']
      }
    },
    {
      id: 'consultoria',
      icon: Bot,
      color: 'purple',
      title: {
        es: 'Consultoría Estratégica en Inteligencia Artificial',
        en: 'Strategic Consulting in Artificial Intelligence',
        pt: 'Consultoria Estratégica em Inteligência Artificial'
      },
      description: {
        es: 'Servicio experto para diseñar estrategias de adopción de IA alineadas a objetivos institucionales, identificando oportunidades, capacidades, riesgos y rutas de implementación que maximicen impacto, eficiencia y creación de valor sostenible.',
        en: 'Expert service to design AI adoption strategies aligned to institutional objectives, identifying opportunities, capabilities, risks, and implementation routes that maximize impact, efficiency, and sustainable value creation.',
        pt: 'Serviço especialista para focar estratégias de adoção de IA alinhadas a objetivos institucionais, identificando oportunidades, capacidades, riscos e rotas de implementação que maximizem impacto, eficiência e criação de valor sustentável.'
      },
      features: {
        es: ['Estrategias de Adopción', 'Identificación de Oportunidades', 'Maximización de Impacto'],
        en: ['Adoption Strategies', 'Opportunity Identification', 'Focus on Impact'],
        pt: ['Estratégias de Adoção', 'Identificação de Oportunidades', 'Maximização de Impacto']
      }
    },
    {
      id: 'desarrollo',
      icon: Code,
      color: 'emerald',
      title: {
        es: 'Desarrollo e Implementación de Soluciones con IA',
        en: 'Development and Implementation of AI Solutions',
        pt: 'Desenvolvimento e Implementação de Soluções com IA'
      },
      description: {
        es: 'Creación de soluciones basadas en IA adaptadas a necesidades específicas, incluyendo modelos, automatizaciones y plataformas inteligentes que optimizan procesos, mejoran decisiones y fortalecen la competitividad mediante tecnologías avanzadas.',
        en: 'Creation of AI-based solutions adapted to specific needs, including models, automations, and intelligent platforms that optimize processes, improve decision-making, and strengthen competitiveness through advanced techniques.',
        pt: 'Criação de soluções baseadas em IA adaptadas a necessidades específicas, incluindo modelos, automações e plataformas inteligentes que otimizam processos, melhoram decisões e fortalecem a competitividade mediante tecnologias avançadas.'
      },
      features: {
        es: ['Modelos Personalizados', 'Automatización de Procesos', 'Plataformas Inteligentes'],
        en: ['Custom Models', 'Process Automation', 'Intelligent Platforms'],
        pt: ['Modelos Personalizados', 'Automação de Processos', 'Plataformas Inteligentes']
      }
    },
    {
      id: 'institucional',
      icon: Layers,
      color: 'indigo',
      title: {
        es: 'Desarrollo de Proyectos Institucionales en IA',
        en: 'Development of Institutional AI Projects',
        pt: 'Desenvolvimento de Projetos Institucionais em IA'
      },
      description: {
        es: 'Acompañamiento integral para instituciones que buscan incorporar IA en proyectos estratégicos y de vinculación con el medio, diseñando iniciativas de transformación y triple impacto (social, económico y medioambiental).',
        en: 'Comprehensive support for institutions seeking to incorporate AI in strategic and community engagement projects, designing transformation initiatives with triple impact (social, economic, and environmental).',
        pt: 'Acompanhamento integral para instituições que buscam incorporar IA em projetos estratégicos e de engajamento comunitário, criando iniciativas de transformação e impacto triplo (social, económico e ambiental).'
      },
      features: {
        es: ['Proyectos Estratégicos', 'Vinculación con el Medio', 'Triple Impacto'],
        en: ['Strategic Projects', 'Community Engagement', 'Triple Impact'],
        pt: ['Projetos Estratégicos', 'Engajamento Comunitário', 'Impacto Triplo']
      }
    }
  ];

  getColorClasses(color: string): string {
    const map: any = {
      'blue': 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white',
      'purple': 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white',
      'emerald': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white',
      'indigo': 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white',
    };
    return map[color] || map['blue'];
  }
}

