import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LanguageService } from '../../../core/services/language';
import { LucideAngularModule, Mail, Phone, MapPin, Send } from 'lucide-angular';

@Component({
  selector: 'app-landing-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './landing-contact.html',
  styleUrl: './landing-contact.scss',
})
export class LandingContact {
  languageService = inject(LanguageService);
  fb = inject(FormBuilder);

  contactForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    company: [''],
    message: ['', Validators.required]
  });

  icons = { Mail, Phone, MapPin, Send };

  isSubmitting = false;
  submitSuccess = false;

  get title() {
    const lang = this.languageService.currentLang() as 'es' | 'en' | 'pt';
    return {
      es: 'Contáctanos',
      en: 'Contact Us',
      pt: 'Contate-nos'
    }[lang];
  }

  get subtitle() {
    const lang = this.languageService.currentLang() as 'es' | 'en' | 'pt';
    return {
      es: 'Hablemos de tu próximo gran proyecto con Inteligencia Artificial.',
      en: 'Let\'s talk about your next big Artificial Intelligence project.',
      pt: 'Vamos conversar sobre o seu próximo grande projeto de Inteligência Artificial.'
    }[lang];
  }

  get formLabels() {
    const lang = this.languageService.currentLang() as 'es' | 'en' | 'pt';
    return {
      es: { name: 'Nombre', email: 'Correo Electrónico', company: 'Empresa', message: 'Mensaje', send: 'Enviar Mensaje', sending: 'Enviando...', success: '¡Mensaje enviado con éxito!' },
      en: { name: 'Name', email: 'Email Address', company: 'Company', message: 'Message', send: 'Send Message', sending: 'Sending...', success: 'Message sent successfully!' },
      pt: { name: 'Nome', email: 'Endereço de E-mail', company: 'Empresa', message: 'Mensagem', send: 'Enviar Mensagem', sending: 'Enviando...', success: 'Mensagem enviada com sucesso!' }
    }[lang];
  }

  get contactInfo() {
    const lang = this.languageService.currentLang() as 'es' | 'en' | 'pt';
    return [
      { icon: Mail, title: { es: 'Correo', en: 'Email', pt: 'E-mail' }[lang], value: 'contacto@subeia.tech', href: 'mailto:contacto@subeia.tech' },
      { icon: Phone, title: { es: 'Teléfono', en: 'Phone', pt: 'Telefone' }[lang], value: '+56 9 1234 5678', href: 'tel:+56912345678' },
      { icon: MapPin, title: { es: 'Ubicación', en: 'Location', pt: 'Localização' }[lang], value: 'Santiago, Chile', href: '#' }
    ];
  }

  onSubmit() {
    if (this.contactForm.valid) {
      this.isSubmitting = true;
      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.contactForm.reset();
        setTimeout(() => this.submitSuccess = false, 5000);
      }, 1500);
    } else {
      Object.values(this.contactForm.controls).forEach(control => {
        control.markAsTouched();
      });
    }
  }
}
