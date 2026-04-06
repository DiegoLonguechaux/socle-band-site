import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import GalleryItemModel from '@/models/GalleryItem';
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

export async function GET() {
  const unauthorized = await ensureAuth();
  if (unauthorized) {
    return unauthorized;
  }

  await dbConnect();
  const items = await GalleryItemModel.find({}).sort({ createdAt: -1 }).lean();

  return NextResponse.json(items.map((item) => serializeItem(item)));
}

export async function POST(request: Request) {
  const unauthorized = await ensureAuth();
  if (unauthorized) {
    return unauthorized;
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
  const created = await GalleryItemModel.create(payload);

  return NextResponse.json(serializeItem(created), { status: 201 });
}
