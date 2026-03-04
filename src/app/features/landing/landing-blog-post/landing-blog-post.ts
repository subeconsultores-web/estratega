import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { LucideAngularModule, Calendar, User, ArrowLeft, Share2 } from 'lucide-angular';
import { CmsService } from '../../../core/services/cms';
import { LanguageService } from '../../../core/services/language';
import { BlogPost } from '../../../core/models/cms.model';

@Component({
  selector: 'app-landing-blog-post',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './landing-blog-post.html',
  styleUrl: './landing-blog-post.scss',
})
export class LandingBlogPost implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  cmsService = inject(CmsService);
  languageService = inject(LanguageService);

  readonly icons = { Calendar, User, ArrowLeft, Share2 };

  post = signal<BlogPost | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadPost(slug);
      } else {
        this.router.navigate(['/noticias']);
      }
    });
  }

  loadPost(slug: string) {
    this.isLoading.set(true);
    // Realistically we need a method to get a post by slug.
    // The service might have getBlogPostBySlug. Let's use getBlogPosts and filter for now as a fallback
    // assuming it returns all and we filter by slug if no explicit method exists.
    this.cmsService.getBlogPosts().subscribe(posts => {
      const found = posts.find(p => p.slug === slug);
      if (found) {
        this.post.set(found);
      } else {
        this.router.navigate(['/noticias']);
      }
      this.isLoading.set(false);
    });
  }

  formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleDateString();
  }
}

