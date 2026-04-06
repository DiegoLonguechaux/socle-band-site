import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import GalleryItemModel from '@/models/GalleryItem';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

type GalleryPayload = {
  title?: string;
  description?: string;
  imageUrl?: string;
};

function normalizePayload(payload: GalleryPayload) {
  return {
    title: (payload.title ?? '').trim(),
    description: (payload.description ?? '').trim(),
    imageUrl: (payload.imageUrl ?? '').trim(),
  };
}

function serializeItem(item: {
  _id: { toString: () => string };
  title: string;
  description?: string;
  imageUrl: string;
}) {
  return {
    id: item._id.toString(),
    title: item.title,
    description: item.description ?? '',
    imageUrl: item.imageUrl,
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

  const body = (await request.json()) as GalleryPayload;
  const payload = normalizePayload(body);

  if (!payload.title || !payload.imageUrl) {
    return NextResponse.json(
      { error: 'Le titre et la photo sont obligatoires.' },
      { status: 400 }
    );
  }

  await dbConnect();
  const updated = await GalleryItemModel.findByIdAndUpdate(id, payload, { new: true }).lean();

  if (!updated) {
    return NextResponse.json({ error: 'Photo introuvable' }, { status: 404 });
  }

  return NextResponse.json(serializeItem(updated));
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
  const deleted = await GalleryItemModel.findByIdAndDelete(id).lean();

  if (!deleted) {
    return NextResponse.json({ error: 'Photo introuvable' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
