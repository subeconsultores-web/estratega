import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CmsService } from '../../../../core/services/cms';
import { TeamMember } from '../../../../core/models/cms.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-team-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './team-manager.html',
  styleUrl: './team-manager.scss'
})
export class TeamManagerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cmsService = inject(CmsService);
  private toastr = inject(ToastrService);

  teamMembers: TeamMember[] = [];
  memberForm!: FormGroup;

  isLoading = true;
  isSaving = false;
  isModalOpen = false;
  editingId: string | null = null;

  ngOnInit() {
    this.initForm();
    this.loadMembers();
  }

  private initForm() {
    this.memberForm = this.fb.group({
      name: ['', Validators.required],
      role: this.fb.group({
        es: ['', Validators.required],
        en: [''],
        pt: ['']
      }),
      description: this.fb.group({
        es: ['', Validators.required],
        en: [''],
        pt: ['']
      }),
      imageUrl: ['', Validators.required],
      linkedinUrl: [''],
      order: [0, Validators.required],
      isActive: [true]
    });
  }

  private loadMembers() {
    this.cmsService.getTeamMembers().subscribe(members => {
      this.teamMembers = members;
      this.isLoading = false;
    });
  }

  openModal(member?: TeamMember) {
    this.isModalOpen = true;
    if (member && member.id) {
      this.editingId = member.id;
      this.memberForm.patchValue(member);
    } else {
      this.editingId = null;
      this.memberForm.reset({ order: this.teamMembers.length, isActive: true });
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingId = null;
  }

  async saveMember() {
    if (this.memberForm.invalid) {
      this.toastr.warning('Completa los campos requeridos', 'Formulario inválido');
      return;
    }

    this.isSaving = true;
    try {
      const formValue = this.memberForm.value as TeamMember;

      if (this.editingId) {
        await this.cmsService.updateTeamMember(this.editingId, formValue);
        this.toastr.success('Miembro actualizado');
      } else {
        await this.cmsService.addTeamMember(formValue);
        this.toastr.success('Miembro creado');
      }
      this.closeModal();
    } catch (error) {
      console.error(error);
      this.toastr.error('Error al guardar');
    } finally {
      this.isSaving = false;
    }
  }

  async deleteMember(id: string) {
    if (confirm('¿Estás seguro de eliminar este miembro del equipo?')) {
      try {
        await this.cmsService.deleteTeamMember(id);
        this.toastr.success('Miembro eliminado');
      } catch (error) {
        console.error(error);
        this.toastr.error('Error al eliminar');
      }
    }
  }

  async toggleActive(member: TeamMember) {
    if (!member.id) return;
    try {
      await this.cmsService.updateTeamMember(member.id, { isActive: !member.isActive });
      this.toastr.success('Estado actualizado');
    } catch (error) {
      this.toastr.error('Error al actualizar estado');
    }
  }
}
