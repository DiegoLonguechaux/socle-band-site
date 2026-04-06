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
import { FormEvent, useEffect, useMemo, useState } from 'react';

type Concert = {
  id: string;
  date: string;
  venue: string;
  description: string;
  link: string;
};

type ConcertForm = {
  date: string;
  venue: string;
  description: string;
  link: string;
};

const defaultForm: ConcertForm = {
  date: '',
  venue: '',
  description: '',
  link: '',
};

function toInputDateTime(isoDate: string) {
  if (!isoDate) {
    return '';
  }
  const date = new Date(isoDate);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toIsoDate(inputDate: string) {
  if (!inputDate) {
    return '';
  }
  return new Date(inputDate).toISOString();
}

function formatDisplayDate(dateValue: string) {
  if (!dateValue) {
    return '-';
  }

  const date = new Date(dateValue);
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function ConcertsPage() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingConcertId, setEditingConcertId] = useState<string | null>(null);
  const [form, setForm] = useState<ConcertForm>(defaultForm);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [concertToDelete, setConcertToDelete] = useState<Concert | null>(null);

  const isEditMode = useMemo(() => editingConcertId !== null, [editingConcertId]);

  const loadConcerts = async () => {
    try {
      const response = await fetch('/api/admin/concerts');
      if (!response.ok) {
        throw new Error('Impossible de charger les concerts');
      }

      const data = (await response.json()) as Concert[];
      setConcerts(data);
    } catch {
      setMessage('Erreur lors du chargement des concerts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConcerts();
  }, []);

  const openCreateModal = () => {
    setForm(defaultForm);
    setEditingConcertId(null);
    setIsFormModalOpen(true);
    setMessage('');
  };

  const openEditModal = (concert: Concert) => {
    setForm({
      date: toInputDateTime(concert.date),
      venue: concert.venue,
      description: concert.description,
      link: concert.link,
    });
    setEditingConcertId(concert.id);
    setIsFormModalOpen(true);
    setMessage('');
  };

  const closeFormModal = () => {
    if (isSaving) {
      return;
    }
    setIsFormModalOpen(false);
    setEditingConcertId(null);
    setForm(defaultForm);
  };

  const openDeleteModal = (concert: Concert) => {
    setConcertToDelete(concert);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }
    setIsDeleteModalOpen(false);
    setConcertToDelete(null);
  };

  const handleSaveConcert = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const payload = {
        ...form,
        date: toIsoDate(form.date),
      };

      const isEditing = Boolean(editingConcertId);
      const response = await fetch(
        isEditing ? `/api/admin/concerts/${editingConcertId}` : '/api/admin/concerts',
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

      await loadConcerts();
      closeFormModal();
      setMessage(isEditing ? 'Concert modifié avec succès.' : 'Concert ajouté avec succès.');
    } catch {
      setMessage('Erreur lors de l’enregistrement du concert.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConcert = async () => {
    if (!concertToDelete) {
      return;
    }

    setIsDeleting(true);
    setMessage('');

    try {
      const response = await fetch(`/api/admin/concerts/${concertToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete error');
      }

      await loadConcerts();
      closeDeleteModal();
      setMessage('Concert supprimé avec succès.');
    } catch {
      setMessage('Erreur lors de la suppression du concert.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Concerts</h1>
        <Button onClick={openCreateModal}>Ajouter un concert</Button>
      </div>

      {message && <p className="mb-4 text-sm text-slate-600">{message}</p>}

      <Card className="p-6">
        {isLoading ? (
          <p>Chargement...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {concerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-20 text-center text-slate-500">
                    Aucun concert enregistré.
                  </TableCell>
                </TableRow>
              ) : (
                concerts.map((concert) => (
                  <TableRow key={concert.id}>
                    <TableCell>{formatDisplayDate(concert.date)}</TableCell>
                    <TableCell>{concert.venue}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(concert)}
                        >
                          Modifier
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteModal(concert)}
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
          <div className="w-full max-w-xl rounded-xl border bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">
              {isEditMode ? 'Modifier le concert' : 'Ajouter un concert'}
            </h2>

            <form onSubmit={handleSaveConcert} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Lieu</Label>
                <Input
                  id="venue"
                  value={form.venue}
                  onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))}
                  placeholder="Nom de la salle, ville..."
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
                  placeholder="Infos sur le concert"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Lien (billetterie ou autre)</Label>
                <Input
                  id="link"
                  value={form.link}
                  onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))}
                  placeholder="https://..."
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
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-semibold">Confirmer la suppression</h2>
            <p className="mb-6 text-sm text-slate-600">
              Voulez-vous vraiment supprimer ce concert du {formatDisplayDate(concertToDelete?.date ?? '')} ?
            </p>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDeleteModal} disabled={isDeleting}>
                Annuler
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteConcert} disabled={isDeleting}>
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
