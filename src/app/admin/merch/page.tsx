'use client';

import { AdminModal } from '@/components/admin/admin-modal';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import { FormEvent, useEffect, useMemo, useState } from 'react';

type Merch = {
  id: string;
  title: string;
  price: number;
  sizes: string[];
  images: string[];
};

type MerchForm = {
  title: string;
  price: string;
  sizes: string[];
  images: string[];
};

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const defaultForm: MerchForm = {
  title: '',
  price: '',
  sizes: [],
  images: [],
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export default function MerchPage() {
  const [items, setItems] = useState<Merch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [message, setMessage] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [form, setForm] = useState<MerchForm>(defaultForm);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Merch | null>(null);

  const isEditMode = useMemo(() => editingItemId !== null, [editingItemId]);

  const loadItems = async () => {
    try {
      const response = await fetch('/api/admin/merch');
      if (!response.ok) {
        throw new Error('Impossible de charger le merch');
      }

      const data = (await response.json()) as Merch[];
      setItems(data);
    } catch {
      setMessage('Erreur lors du chargement du merch.');
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

  const openEditModal = (item: Merch) => {
    setForm({
      title: item.title,
      price: String(item.price),
      sizes: item.sizes ?? [],
      images: item.images ?? [],
    });
    setEditingItemId(item.id);
    setIsFormModalOpen(true);
    setMessage('');
  };

  const closeFormModal = () => {
    if (isSaving || isUploadingImages) {
      return;
    }

    setIsFormModalOpen(false);
    setEditingItemId(null);
    setForm(defaultForm);
  };

  const openDeleteModal = (item: Merch) => {
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

  const toggleSize = (size: string) => {
    setForm((prev) => {
      const hasSize = prev.sizes.includes(size);
      return {
        ...prev,
        sizes: hasSize
          ? prev.sizes.filter((item) => item !== size)
          : [...prev.sizes, size],
      };
    });
  };

  const uploadImages = async (files: FileList) => {
    setMessage('');
    setIsUploadingImages(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
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
        uploadedUrls.push(payload.url);
      }

      setForm((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    } catch {
      setMessage('Erreur lors de l’upload des images.');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const removeImage = (imageUrl: string) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((url) => url !== imageUrl),
    }));
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const payload = {
        title: form.title,
        price: Number(form.price),
        sizes: form.sizes,
        images: form.images,
      };

      const isEditing = Boolean(editingItemId);
      const response = await fetch(
        isEditing ? `/api/admin/merch/${editingItemId}` : '/api/admin/merch',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error('Save error');
      }

      await loadItems();
      closeFormModal();
      setMessage(isEditing ? 'Article modifié avec succès.' : 'Article ajouté avec succès.');
    } catch {
      setMessage('Erreur lors de l’enregistrement de l’article.');
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
      const response = await fetch(`/api/admin/merch/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete error');
      }

      await loadItems();
      closeDeleteModal();
      setMessage('Article supprimé avec succès.');
    } catch {
      setMessage('Erreur lors de la suppression de l’article.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<Merch>[] = [
    {
      accessorKey: 'title',
      header: 'Titre',
    },
    {
      accessorKey: 'price',
      header: 'Prix',
      cell: ({ row }) => formatPrice(row.original.price),
    },
    {
      accessorKey: 'sizes',
      header: 'Tailles',
      cell: ({ row }) => row.original.sizes.length > 0 ? row.original.sizes.join(', ') : '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openEditModal(row.original)}
          >
            Modifier
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => openDeleteModal(row.original)}
          >
            Supprimer
          </Button>
        </div>
      ),
    },
  ];

    return (
        <div className="container mx-auto py-10">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold">Merch</h1>
                <Button onClick={openCreateModal}>Ajouter un article</Button>
            </div>

            {message && <p className="mb-4 text-sm text-slate-600">{message}</p>}

            {isLoading ? (
            <p>Chargement...</p>
            ) : (
            <DataTable columns={columns} data={items} emptyMessage="Aucun article enregistré." />
            )}

            <AdminModal
                open={isFormModalOpen}
                title={isEditMode ? 'Modifier l’article' : 'Ajouter un article'}
                onClose={closeFormModal}
                maxWidthClass="max-w-2xl"
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="title">Titre</Label>
                            <Input
                                id="title"
                                value={form.title}
                                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                                placeholder="Nom de l’article"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">Prix</Label>
                            <Input
                                id="price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.price}
                                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tailles disponibles</Label>
                        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                            {AVAILABLE_SIZES.map((size) => (
                                <label
                                    key={size}
                                    className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <input
                                        type="checkbox"
                                        checked={form.sizes.includes(size)}
                                        onChange={() => toggleSize(size)}
                                    />
                                    <span>{size}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="images">Images</Label>
                        <Input
                            id="images"
                            type="file"
                            multiple
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                uploadImages(e.target.files);
                                }
                            }}
                        />
                        {isUploadingImages && <p className="text-sm text-slate-600">Upload en cours...</p>}

                        {form.images.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                {form.images.map((imageUrl) => (
                                    <div key={imageUrl} className="space-y-2">
                                        <Image
                                            src={imageUrl}
                                            alt="Image article"
                                            width={160}
                                            height={160}
                                            className="h-28 w-full rounded-md border border-slate-200 object-cover"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => removeImage(imageUrl)}
                                        >
                                            Retirer
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeFormModal}
                            disabled={isSaving || isUploadingImages}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isSaving || isUploadingImages}>
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
                Voulez-vous vraiment supprimer l’article {itemToDelete?.title ?? ''} ?
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
