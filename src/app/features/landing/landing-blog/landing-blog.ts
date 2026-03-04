import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Calendar, User, ArrowRight, Rss } from 'lucide-angular';
import { CmsService } from '../../../core/services/cms';
import { LanguageService } from '../../../core/services/language';
import { BlogPost } from '../../../core/models/cms.model';

@Component({
  selector: 'app-landing-blog',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './landing-blog.html',
  styleUrl: './landing-blog.scss',
})
export class LandingBlog implements OnInit {
  cmsService = inject(CmsService);
  languageService = inject(LanguageService);

  readonly icons = { Calendar, User, ArrowRight, Rss };

  posts = signal<BlogPost[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.cmsService.getBlogPosts(true).subscribe(data => {
      // Sort by publication date descending
      const sorted = data.sort((a, b) => b.publishedAt - a.publishedAt);
      this.posts.set(sorted);
      this.isLoading.set(false);
    });
  }
}

