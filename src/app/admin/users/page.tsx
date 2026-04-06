'use client';

import { AdminModal } from '@/components/admin/admin-modal';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColumnDef } from '@tanstack/react-table';
import { FormEvent, useEffect, useMemo, useState } from 'react';

type UserRole = 'admin' | 'super-admin';

type UserRow = {
  id: string;
  firstName: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

type UserForm = {
  firstName: string;
  email: string;
  role: UserRole;
  password: string;
};

const defaultForm: UserForm = {
  firstName: '',
  email: '',
  role: 'admin',
  password: '',
};

function formatDate(dateValue: string) {
  const date = new Date(dateValue);
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
  }).format(date);
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(defaultForm);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserRow | null>(null);

  const isEditMode = useMemo(() => editingUserId !== null, [editingUserId]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Impossible de charger les utilisateurs');
      }

      const data = (await response.json()) as UserRow[];
      setUsers(data);
    } catch {
      setMessage('Erreur lors du chargement des utilisateurs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setForm(defaultForm);
    setEditingUserId(null);
    setIsFormModalOpen(true);
    setMessage('');
  };

  const openEditModal = (user: UserRow) => {
    setForm({
      firstName: user.firstName,
      email: user.email,
      role: user.role,
      password: '',
    });
    setEditingUserId(user.id);
    setIsFormModalOpen(true);
    setMessage('');
  };

  const closeFormModal = () => {
    if (isSaving) {
      return;
    }
    setIsFormModalOpen(false);
    setEditingUserId(null);
    setForm(defaultForm);
  };

  const openDeleteModal = (user: UserRow) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const payload = {
        firstName: form.firstName,
        email: form.email,
        role: form.role,
        password: form.password,
      };

      const isEditing = Boolean(editingUserId);
      const response = await fetch(
        isEditing ? `/api/admin/users/${editingUserId}` : '/api/admin/users',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error || 'Save error');
      }

      await loadUsers();
      closeFormModal();
      setMessage(isEditing ? 'Utilisateur modifié avec succès.' : 'Utilisateur ajouté avec succès.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur lors de l’enregistrement.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) {
      return;
    }

    setIsDeleting(true);
    setMessage('');

    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error || 'Delete error');
      }

      await loadUsers();
      closeDeleteModal();
      setMessage('Utilisateur supprimé avec succès.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur lors de la suppression.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<UserRow>[] = [
    {
      accessorKey: 'firstName',
      header: 'Prénom',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="lowercase">{row.original.email}</span>,
    },
    {
      accessorKey: 'role',
      header: 'Rôle',
      cell: ({ row }) => (
        <span className={`font-medium ${row.original.role === 'super-admin' ? 'text-purple-600' : 'text-blue-600'}`}>
          {row.original.role}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date de création',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(row.original)}>
            Modifier
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={() => openDeleteModal(row.original)}>
            Supprimer
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Utilisateurs</h1>
        <Button onClick={openCreateModal}>Ajouter un utilisateur</Button>
      </div>

      {message && <p className="mb-4 text-sm text-slate-600">{message}</p>}

        {isLoading ? (
          <p>Chargement...</p>
        ) : (
          <DataTable columns={columns} data={users} emptyMessage="Aucun utilisateur." />
        )}

      <AdminModal
        open={isFormModalOpen}
        title={isEditMode ? 'Modifier l’utilisateur' : 'Ajouter un utilisateur'}
        onClose={closeFormModal}
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <select
              id="role"
              className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
            >
              <option value="admin">admin</option>
              <option value="super-admin">super-admin</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {isEditMode ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
            </Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder={isEditMode ? 'Laisser vide pour ne pas changer' : ''}
              required={!isEditMode}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeFormModal} disabled={isSaving}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={isDeleteModalOpen}
        title="Confirmer la suppression"
        onClose={closeDeleteModal}
        maxWidthClass="max-w-md"
      >
        <p className="mb-6 text-sm text-slate-600">
          Voulez-vous vraiment supprimer l’utilisateur {userToDelete?.firstName ?? ''} ?
        </p>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={closeDeleteModal} disabled={isDeleting}>
            Annuler
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </AdminModal>
    </div>
  );
}
