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

type ReleaseType = 'single' | 'ep' | 'album';

type Release = {
  id: string;
  type: ReleaseType;
  name: string;
  coverUrl: string;
  links: {
    spotify: string;
    deezer: string;
    appleMusic: string;
    amazonMusic: string;
    youtubeMusic: string;
    bandcamp: string;
    soundcloud: string;
  };
};

type ReleaseForm = {
  type: ReleaseType;
  name: string;
  coverUrl: string;
  links: {
    spotify: string;
    deezer: string;
    appleMusic: string;
    amazonMusic: string;
    youtubeMusic: string;
    bandcamp: string;
    soundcloud: string;
  };
};

const defaultForm: ReleaseForm = {
  type: 'single',
  name: '',
  coverUrl: '',
  links: {
    spotify: '',
    deezer: '',
    appleMusic: '',
    amazonMusic: '',
    youtubeMusic: '',
    bandcamp: '',
    soundcloud: '',
  },
};

const releaseTypeLabel: Record<ReleaseType, string> = {
  single: 'Single',
  ep: 'EP',
  album: 'Album',
};

export default function SortiesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [message, setMessage] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingReleaseId, setEditingReleaseId] = useState<string | null>(null);
  const [form, setForm] = useState<ReleaseForm>(defaultForm);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [releaseToDelete, setReleaseToDelete] = useState<Release | null>(null);

  const isEditMode = useMemo(() => editingReleaseId !== null, [editingReleaseId]);

  const loadReleases = async () => {
    try {
      const response = await fetch('/api/admin/releases');
      if (!response.ok) {
        throw new Error('Impossible de charger les sorties');
      }

      const data = (await response.json()) as Release[];
      setReleases(data);
    } catch {
      setMessage('Erreur lors du chargement des sorties.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReleases();
  }, []);

  const openCreateModal = () => {
    setForm(defaultForm);
    setEditingReleaseId(null);
    setIsFormModalOpen(true);
    setMessage('');
  };

  const openEditModal = (release: Release) => {
    setForm({
      type: release.type,
      name: release.name,
      coverUrl: release.coverUrl,
      links: {
        ...defaultForm.links,
        ...(release.links ?? {}),
      },
    });
    setEditingReleaseId(release.id);
    setIsFormModalOpen(true);
    setMessage('');
  };

  const closeFormModal = () => {
    if (isSaving || isUploadingCover) {
      return;
    }
    setIsFormModalOpen(false);
    setEditingReleaseId(null);
    setForm(defaultForm);
  };

  const openDeleteModal = (release: Release) => {
    setReleaseToDelete(release);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }
    setIsDeleteModalOpen(false);
    setReleaseToDelete(null);
  };

  const uploadCover = async (file: File) => {
    setMessage('');
    setIsUploadingCover(true);

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
      setForm((prev) => ({ ...prev, coverUrl: payload.url }));
    } catch {
      setMessage('Erreur lors de l’upload de la pochette.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSaveRelease = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const isEditing = Boolean(editingReleaseId);

      const response = await fetch(
        isEditing ? `/api/admin/releases/${editingReleaseId}` : '/api/admin/releases',
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

      await loadReleases();
      closeFormModal();
      setMessage(isEditing ? 'Sortie modifiée avec succès.' : 'Sortie ajoutée avec succès.');
    } catch {
      setMessage('Erreur lors de l’enregistrement de la sortie.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRelease = async () => {
    if (!releaseToDelete) {
      return;
    }

    setIsDeleting(true);
    setMessage('');

    try {
      const response = await fetch(`/api/admin/releases/${releaseToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete error');
      }

      await loadReleases();
      closeDeleteModal();
      setMessage('Sortie supprimée avec succès.');
    } catch {
      setMessage('Erreur lors de la suppression de la sortie.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sorties</h1>
        <Button onClick={openCreateModal}>Ajouter une sortie</Button>
      </div>

      {message && <p className="mb-4 text-sm text-slate-600">{message}</p>}

      <Card className="p-6">
        {isLoading ? (
          <p>Chargement...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {releases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-20 text-center text-slate-500">
                    Aucune sortie enregistrée.
                  </TableCell>
                </TableRow>
              ) : (
                releases.map((release) => (
                  <TableRow key={release.id}>
                    <TableCell>{releaseTypeLabel[release.type]}</TableCell>
                    <TableCell>{release.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(release)}
                        >
                          Modifier
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteModal(release)}
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
              {isEditMode ? 'Modifier la sortie' : 'Ajouter une sortie'}
            </h2>

            <form onSubmit={handleSaveRelease} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
                    value={form.type}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, type: e.target.value as ReleaseType }))
                    }
                  >
                    <option value="single">Single</option>
                    <option value="ep">EP</option>
                    <option value="album">Album</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nom de la sortie"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="cover">Pochette</Label>
                <Input
                  id="cover"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      uploadCover(file);
                    }
                  }}
                />
                {isUploadingCover && <p className="text-sm text-slate-600">Upload en cours...</p>}
                {form.coverUrl && (
                  <Image
                    src={form.coverUrl}
                    alt="Pochette"
                    width={180}
                    height={180}
                    className="rounded-md border border-slate-200 object-cover"
                  />
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Liens plateformes</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="spotify">Spotify</Label>
                    <Input
                      id="spotify"
                      value={form.links.spotify}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          links: { ...prev.links, spotify: e.target.value },
                        }))
                      }
                      placeholder="https://open.spotify.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deezer">Deezer</Label>
                    <Input
                      id="deezer"
                      value={form.links.deezer}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          links: { ...prev.links, deezer: e.target.value },
                        }))
                      }
                      placeholder="https://deezer.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appleMusic">Apple Music</Label>
                    <Input
                      id="appleMusic"
                      value={form.links.appleMusic}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          links: { ...prev.links, appleMusic: e.target.value },
                        }))
                      }
                      placeholder="https://music.apple.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amazonMusic">Amazon Music</Label>
                    <Input
                      id="amazonMusic"
                      value={form.links.amazonMusic}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          links: { ...prev.links, amazonMusic: e.target.value },
                        }))
                      }
                      placeholder="https://music.amazon..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtubeMusic">YouTube Music</Label>
                    <Input
                      id="youtubeMusic"
                      value={form.links.youtubeMusic}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          links: { ...prev.links, youtubeMusic: e.target.value },
                        }))
                      }
                      placeholder="https://music.youtube.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bandcamp">Bandcamp</Label>
                    <Input
                      id="bandcamp"
                      value={form.links.bandcamp}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          links: { ...prev.links, bandcamp: e.target.value },
                        }))
                      }
                      placeholder="https://...bandcamp.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="soundcloud">SoundCloud</Label>
                    <Input
                      id="soundcloud"
                      value={form.links.soundcloud}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          links: { ...prev.links, soundcloud: e.target.value },
                        }))
                      }
                      placeholder="https://soundcloud.com/..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeFormModal}
                  disabled={isSaving || isUploadingCover}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSaving || isUploadingCover}>
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
              Voulez-vous vraiment supprimer la sortie {releaseToDelete?.name ?? ''} ?
            </p>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDeleteModal} disabled={isDeleting}>
                Annuler
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteRelease} disabled={isDeleting}>
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
