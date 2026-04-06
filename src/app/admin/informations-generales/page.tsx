'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Editor } from '@tiptap/core';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    Bold,
    Code,
    Heading,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Redo2,
    RemoveFormatting,
    Strikethrough,
    Underline as UnderlineIcon,
    Undo2,
} from 'lucide-react';
import Image from 'next/image';
import { FormEvent, useEffect, useRef, useState } from 'react';

type GroupInfoForm = {
  bandName: string;
  bio: string;
  groupPhotoUrl: string;
  logoUrl: string;
  contactEmail: string;
  links: {
    instagram: string;
    facebook: string;
    tiktok: string;
    youtube: string;
    spotify: string;
    deezer: string;
    appleMusic: string;
    amazonMusic: string;
    youtubeMusic: string;
    bandcamp: string;
    soundcloud: string;
  };
};

const defaultForm: GroupInfoForm = {
  bandName: '',
  bio: '',
  groupPhotoUrl: '',
  logoUrl: '',
  contactEmail: '',
  links: {
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
    spotify: '',
    deezer: '',
    appleMusic: '',
    amazonMusic: '',
    youtubeMusic: '',
    bandcamp: '',
    soundcloud: '',
  },
};

function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return null;
  }

  const setHeadingLevel = (value: string) => {
    if (value === 'paragraph') {
      editor.chain().focus().setParagraph().run();
      return;
    }

    const level = Number(value) as 1 | 2 | 3;
    editor.chain().focus().toggleHeading({ level }).run();
  };

  const currentHeading = editor.isActive('heading', { level: 1 })
    ? '1'
    : editor.isActive('heading', { level: 2 })
      ? '2'
      : editor.isActive('heading', { level: 3 })
        ? '3'
        : 'paragraph';

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL du lien', previousUrl || '');

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().setLink({ href: url }).run();
  };

  const ToolbarIconButton = ({
    active,
    onClick,
    disabled,
    title,
    children,
  }: {
    active?: boolean;
    onClick: () => void;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={`h-8 w-8 rounded-md border border-transparent p-0 ${
        active ? 'bg-slate-700 text-white hover:bg-slate-700' : 'text-slate-200 hover:bg-slate-700 hover:text-white'
      }`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 border border-slate-700 border-b-0 rounded-t-md p-2 bg-slate-900">
      <div className="flex items-center gap-2 rounded-md border border-slate-700 px-2 py-1 bg-slate-800">
        <Heading className="h-4 w-4 text-slate-200" />
        <select
          className="bg-transparent text-sm text-slate-100 outline-none"
          value={currentHeading}
          onChange={(e) => setHeadingLevel(e.target.value)}
        >
          <option value="paragraph">Paragraphe</option>
          <option value="1">Titre 1</option>
          <option value="2">Titre 2</option>
          <option value="3">Titre 3</option>
        </select>
      </div>

      <div className="h-6 w-px bg-slate-700" />

      <ToolbarIconButton
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Gras"
      >
        <Bold className="h-4 w-4" />
      </ToolbarIconButton>
      <ToolbarIconButton
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italique"
      >
        <Italic className="h-4 w-4" />
      </ToolbarIconButton>
      <ToolbarIconButton
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Souligné"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarIconButton>
      <ToolbarIconButton
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Barré"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarIconButton>

      <div className="h-6 w-px bg-slate-700" />

      <ToolbarIconButton
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Liste à puces"
      >
        <List className="h-4 w-4" />
      </ToolbarIconButton>
      <ToolbarIconButton
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Liste numérotée"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarIconButton>
      <ToolbarIconButton
        active={editor.isActive('link')}
        onClick={addLink}
        title="Lien"
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarIconButton>
      <ToolbarIconButton
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Bloc de code"
      >
        <Code className="h-4 w-4" />
      </ToolbarIconButton>

      <div className="h-6 w-px bg-slate-700" />

      <ToolbarIconButton
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        title="Effacer le formatage"
      >
        <RemoveFormatting className="h-4 w-4" />
      </ToolbarIconButton>
      <ToolbarIconButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        title="Annuler"
      >
        <Undo2 className="h-4 w-4" />
      </ToolbarIconButton>
      <ToolbarIconButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        title="Rétablir"
      >
        <Redo2 className="h-4 w-4" />
      </ToolbarIconButton>
    </div>
  );
}

export default function InformationsGeneralesPage() {
  const [form, setForm] = useState<GroupInfoForm>(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [groupPhotoPreview, setGroupPhotoPreview] = useState<string>('');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const hasInitializedEditor = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class:
          'min-h-48 rounded-b-md border border-slate-200 bg-white p-3 focus:outline-none',
      },
    },
    onUpdate({ editor: currentEditor }) {
      const html = currentEditor.getHTML();
      setForm((prev) => ({ ...prev, bio: html }));
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/admin/general-info');

        if (!response.ok) {
          throw new Error('Impossible de charger les informations.');
        }

        const data = await response.json();
        setForm({
          ...defaultForm,
          ...data,
          links: {
            ...defaultForm.links,
            ...(data.links ?? {}),
          },
        });
      } catch {
        setMessage('Erreur lors du chargement des informations.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!editor || isLoading || hasInitializedEditor.current) {
      return;
    }

    editor.commands.setContent(form.bio || '');
    hasInitializedEditor.current = true;
  }, [editor, form.bio, isLoading]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/general-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error('Impossible d’enregistrer les informations.');
      }

      setMessage('Informations enregistrées avec succès.');
    } catch {
      setMessage('Erreur lors de l’enregistrement.');
    } finally {
      setIsSaving(false);
    }
  };

  const uploadImage = async (file: File, imageType: 'group' | 'logo') => {
    setMessage('');
    const objectUrl = URL.createObjectURL(file);

    if (imageType === 'group') {
      setGroupPhotoPreview(objectUrl);
      setIsUploadingPhoto(true);
    } else {
      setLogoPreview(objectUrl);
      setIsUploadingLogo(true);
    }

    try {
      const data = new FormData();
      data.append('file', file);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: data,
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error || 'Upload impossible');
      }

      const payload = await response.json();
      if (imageType === 'group') {
        setForm((prev) => ({ ...prev, groupPhotoUrl: payload.url }));
        setGroupPhotoPreview('');
      } else {
        setForm((prev) => ({ ...prev, logoUrl: payload.url }));
        setLogoPreview('');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur lors de l’upload de l’image.');
    } finally {
      if (imageType === 'group') {
        setIsUploadingPhoto(false);
      } else {
        setIsUploadingLogo(false);
      }
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-10">Chargement...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Informations générales</h1>

      <Card className="p-6">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="space-y-2">
            <Label htmlFor="bandName">Nom du groupe</Label>
            <Input
              id="bandName"
              value={form.bandName}
              onChange={(e) => setForm((prev) => ({ ...prev, bandName: e.target.value }))}
              placeholder="Nom du groupe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Adresse mail</Label>
            <Input
              id="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
              placeholder="contact@legroupe.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Bio (TipTap)</Label>
            <EditorToolbar editor={editor} />
            <EditorContent editor={editor} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="groupPhoto">Photo du groupe</Label>
              <Input
                id="groupPhoto"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    uploadImage(file, 'group');
                  }
                }}
              />
              {isUploadingPhoto && <p className="text-sm text-slate-600">Upload en cours...</p>}
              {(groupPhotoPreview || form.groupPhotoUrl) && (
                <Image
                  src={groupPhotoPreview || form.groupPhotoUrl}
                  alt="Photo du groupe"
                  width={220}
                  height={220}
                  className="rounded-md border border-slate-200 object-cover"
                />
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="logo">Logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    uploadImage(file, 'logo');
                  }
                }}
              />
              {isUploadingLogo && <p className="text-sm text-slate-600">Upload en cours...</p>}
              {(logoPreview || form.logoUrl) && (
                <Image
                  src={logoPreview || form.logoUrl}
                  alt="Logo du groupe"
                  width={220}
                  height={220}
                  className="rounded-md border border-slate-200 object-contain bg-white"
                />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Réseaux sociaux</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={form.links.instagram}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      links: { ...prev.links, instagram: e.target.value },
                    }))
                  }
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={form.links.facebook}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      links: { ...prev.links, facebook: e.target.value },
                    }))
                  }
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktok">TikTok</Label>
                <Input
                  id="tiktok"
                  value={form.links.tiktok}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      links: { ...prev.links, tiktok: e.target.value },
                    }))
                  }
                  placeholder="https://tiktok.com/@..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  value={form.links.youtube}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      links: { ...prev.links, youtube: e.target.value },
                    }))
                  }
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Plateformes de streaming</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            {message && <p className="text-sm text-slate-600">{message}</p>}
          </div>
        </form>
      </Card>
    </div>
  );
}
