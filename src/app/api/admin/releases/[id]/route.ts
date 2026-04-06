import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import ReleaseModel from '@/models/Release';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

type ReleaseType = 'single' | 'ep' | 'album';

type ReleaseLinksPayload = {
  spotify?: string;
  deezer?: string;
  appleMusic?: string;
  amazonMusic?: string;
  youtubeMusic?: string;
  bandcamp?: string;
  soundcloud?: string;
};

type ReleasePayload = {
  type?: ReleaseType;
  name?: string;
  coverUrl?: string;
  links?: ReleaseLinksPayload;
};

function emptyLinks() {
  return {
    spotify: '',
    deezer: '',
    appleMusic: '',
    amazonMusic: '',
    youtubeMusic: '',
    bandcamp: '',
    soundcloud: '',
  };
}

function serializeRelease(release: {
  _id: { toString: () => string };
  type: ReleaseType;
  name: string;
  coverUrl?: string;
  links?: ReleaseLinksPayload;
}) {
  return {
    id: release._id.toString(),
    type: release.type,
    name: release.name,
    coverUrl: release.coverUrl ?? '',
    links: {
      ...emptyLinks(),
      ...(release.links ?? {}),
    },
  };
}

async function ensureAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  return null;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const unauthorized = await ensureAuth();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
  }

  const body = (await request.json()) as ReleasePayload;
  const name = (body.name ?? '').trim();

  if (!body.type || !name) {
    return NextResponse.json(
      { error: 'Le type et le nom sont obligatoires.' },
      { status: 400 }
    );
  }

  await dbConnect();

  const updated = await ReleaseModel.findByIdAndUpdate(
    id,
    {
      type: body.type,
      name,
      coverUrl: (body.coverUrl ?? '').trim(),
      links: {
        ...emptyLinks(),
        ...(body.links ?? {}),
      },
    },
    { new: true }
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: 'Sortie introuvable' }, { status: 404 });
  }

  return NextResponse.json(serializeRelease(updated));
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const unauthorized = await ensureAuth();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
  }

  await dbConnect();
  const deleted = await ReleaseModel.findByIdAndDelete(id).lean();

  if (!deleted) {
    return NextResponse.json({ error: 'Sortie introuvable' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
