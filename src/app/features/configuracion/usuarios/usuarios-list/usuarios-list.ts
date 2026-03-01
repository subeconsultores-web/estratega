import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, Plus, Users, Search, MoreVertical, Edit2, Trash2 } from 'lucide-angular';
import { UserService } from '../../../../core/services/user.service';
import { UserData } from '../../../../core/models/user.model';
import { ToastrService } from 'ngx-toastr';
import { UsuarioForm } from '../usuario-form/usuario-form';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeleton } from '../../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UsuarioForm, EmptyState, LoadingSkeleton],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Plus, Users, Search, MoreVertical, Edit2, Trash2 }) }
  ],
  templateUrl: './usuarios-list.html',
  styleUrl: './usuarios-list.scss',
})
export class UsuariosList implements OnInit {
  private userService = inject(UserService);
  private toastr = inject(ToastrService);

  usuarios: UserData[] = [];
  isLoading = true;
  showModal = false;
  selectedUser: UserData | null = null;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsersByTenant().subscribe({
      next: (users) => {
        this.usuarios = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.toastr.error('Error al cargar la lista de usuarios');
        this.isLoading = false;
      }
    });
  }

  trackByUid(index: number, user: UserData): string {
    return user.uid;
  }

  openUserForm(user?: UserData) {
    this.selectedUser = user || null;
    this.showModal = true;
  }

  closeUserForm() {
    this.showModal = false;
    this.selectedUser = null;
  }

  onUserSaved() {
    this.loadUsers();
  }
}
