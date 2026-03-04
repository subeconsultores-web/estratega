import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CmsService } from '../../../../core/services/cms';
import { BlogPost } from '../../../../core/models/cms.model';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-blog-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './blog-manager.html',
  styleUrl: './blog-manager.scss'
})
export class BlogManagerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cmsService = inject(CmsService);
  private toastr = inject(ToastrService);
  private authService = inject(AuthService);

  blogPosts: BlogPost[] = [];
  postForm!: FormGroup;

  isLoading = true;
  isSaving = false;
  isModalOpen = false;
  editingId: string | null = null;

  ngOnInit() {
    this.initForm();
    this.loadPosts();
  }

  private initForm() {
    this.postForm = this.fb.group({
      slug: ['', Validators.required],
      title: this.fb.group({
        es: ['', Validators.required],
        en: [''],
        pt: ['']
      }),
      excerpt: this.fb.group({
        es: ['', Validators.required],
        en: [''],
        pt: ['']
      }),
      content: this.fb.group({
        es: ['', Validators.required],
        en: [''],
        pt: ['']
      }),
      imageUrl: ['', Validators.required],
      authorName: ['', Validators.required],
      status: ['draft', Validators.required],
      tagsStr: [''] // Temporary field for comma-separated tags
    });
  }

  private loadPosts() {
    this.cmsService.getBlogPosts().subscribe(posts => {
      this.blogPosts = posts;
      this.isLoading = false;
    });
  }

  openModal(post?: BlogPost) {
    this.isModalOpen = true;
    if (post && post.id) {
      this.editingId = post.id;
      const tagsStr = post.tags ? post.tags.join(', ') : '';
      this.postForm.patchValue({ ...post, tagsStr });
    } else {
      this.editingId = null;
      // Fetch current admin name assuming authService has currentUser
      let currentAdminName = 'Sube IA';
      this.authService.user$.subscribe(u => {
        if (u && u.displayName) currentAdminName = u.displayName;
      });

      this.postForm.reset({
        status: 'draft',
        authorName: currentAdminName
      });
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingId = null;
  }

  generateSlug() {
    const titleEs = this.postForm.get('title.es')?.value;
    if (titleEs) {
      const slug = titleEs.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      this.postForm.patchValue({ slug });
    }
  }

  async savePost() {
    if (this.postForm.invalid) {
      this.toastr.warning('Completa los campos requeridos', 'Formulario inválido');
      return;
    }

    this.isSaving = true;
    try {
      const formValue = this.postForm.value;
      const tags = formValue.tagsStr ? formValue.tagsStr.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0) : [];

      const postData: Partial<BlogPost> = {
        slug: formValue.slug,
        title: formValue.title,
        excerpt: formValue.excerpt,
        content: formValue.content,
        imageUrl: formValue.imageUrl,
        authorName: formValue.authorName,
        status: formValue.status,
        tags: tags
      };

      if (!this.editingId) {
        // Assume authorId from logged user
        let currentAdminId = 'admin';
        this.authService.user$.subscribe(u => { if (u && u.uid) currentAdminId = u.uid; });
        postData.authorId = currentAdminId;
        await this.cmsService.addBlogPost(postData as BlogPost);
        this.toastr.success('Artículo publicado correctamente');
      } else {
        await this.cmsService.updateBlogPost(this.editingId, postData);
        this.toastr.success('Artículo actualizado');
      }
      this.closeModal();
    } catch (error) {
      console.error(error);
      this.toastr.error('Error al guardar el artículo');
    } finally {
      this.isSaving = false;
    }
  }

  async deletePost(id: string) {
    if (confirm('¿Estás seguro de eliminar este artículo permanentemente?')) {
      try {
        await this.cmsService.deleteBlogPost(id);
        this.toastr.success('Artículo eliminado');
      } catch (error) {
        this.toastr.error('Error al eliminar');
      }
    }
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return 'No publicado';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  }
}
