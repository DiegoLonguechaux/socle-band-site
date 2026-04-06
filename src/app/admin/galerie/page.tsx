'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Image from 'next/image';
import { FormEvent, useEffect, useMemo, useState } from 'react';

type GalleryItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
};

type GalleryForm = {
  title: string;
  description: string;
  imageUrl: string;
};

const defaultForm: GalleryForm = {
  title: '',
  description: '',
  imageUrl: '',
};

export default function GaleriePage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [message, setMessage] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [form, setForm] = useState<GalleryForm>(defaultForm);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<GalleryItem | null>(null);

  const isEditMode = useMemo(() => editingItemId !== null, [editingItemId]);

  const loadItems = async () => {
    try {
      const response = await fetch('/api/admin/gallery');
      if (!response.ok) {
        throw new Error('Impossible de charger la galerie');
      }

      const data = (await response.json()) as GalleryItem[];
      setItems(data);
    } catch {
      setMessage('Erreur lors du chargement de la galerie.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openCreateModal = () => {
    setForm(defaultForm);
    setEditingItemId(null);
    setIsFormModalOpen(true);
    setMessage('');
  };

  const openEditModal = (item: GalleryItem) => {
    setForm({
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
    });
    setEditingItemId(item.id);
    setIsFormModalOpen(true);
    setMessage('');
  };

  const closeFormModal = () => {
    if (isSaving || isUploadingImage) {
      return;
    }
    setIsFormModalOpen(false);
    setEditingItemId(null);
    setForm(defaultForm);
  };

  const openDeleteModal = (item: GalleryItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const uploadImage = async (file: File) => {
    setMessage('');
    setIsUploadingImage(true);

    try {
      const data = new FormData();
      data.append('file', file);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: data,
      });

      if (!response.ok) {
        throw new Error('Upload impossible');
      }

      const payload = (await response.json()) as { url: string };
      setForm((prev) => ({ ...prev, imageUrl: payload.url }));
    } catch {
      setMessage('Erreur lors de l’upload de la photo.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const isEditing = Boolean(editingItemId);

      const response = await fetch(
        isEditing ? `/api/admin/gallery/${editingItemId}` : '/api/admin/gallery',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        }
      );

      if (!response.ok) {
        throw new Error('Save error');
      }

      await loadItems();
      closeFormModal();
      setMessage(isEditing ? 'Photo modifiée avec succès.' : 'Photo ajoutée avec succès.');
    } catch {
      setMessage('Erreur lors de l’enregistrement de la photo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) {
      return;
    }

    setIsDeleting(true);
    setMessage('');

    try {
      const response = await fetch(`/api/admin/gallery/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete error');
      }

      await loadItems();
      closeDeleteModal();
      setMessage('Photo supprimée avec succès.');
    } catch {
      setMessage('Erreur lors de la suppression de la photo.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Galerie</h1>
        <Button onClick={openCreateModal}>Ajouter une photo</Button>
      </div>

      {message && <p className="mb-4 text-sm text-slate-600">{message}</p>}

      <Card className="p-6">
        {isLoading ? (
          <p>Chargement...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center text-slate-500">
                    Aucune photo enregistrée.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        width={72}
                        height={72}
                        className="h-14 w-14 rounded-md border border-slate-200 object-cover"
                      />
                    </TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(item)}
                        >
                          Modifier
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteModal(item)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">
              {isEditMode ? 'Modifier la photo' : 'Ajouter une photo'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre de la photo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Description de la photo"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="image">Photo</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      uploadImage(file);
                    }
                  }}
                />
                {isUploadingImage && <p className="text-sm text-slate-600">Upload en cours...</p>}

                {form.imageUrl && (
                  <Image
                    src={form.imageUrl}
                    alt="Aperçu photo"
                    width={220}
                    height={220}
                    className="rounded-md border border-slate-200 object-cover"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeFormModal}
                  disabled={isSaving || isUploadingImage}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSaving || isUploadingImage}>
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-semibold">Confirmer la suppression</h2>
            <p className="mb-6 text-sm text-slate-600">
              Voulez-vous vraiment supprimer la photo {itemToDelete?.title ?? ''} ?
            </p>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDeleteModal} disabled={isDeleting}>
                Annuler
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
