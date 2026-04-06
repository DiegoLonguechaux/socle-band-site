import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import MerchModel from '@/models/Merch';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

type MerchPayload = {
  title?: string;
  price?: number;
  sizes?: string[];
  images?: string[];
};

function normalizePayload(payload: MerchPayload) {
  return {
    title: (payload.title ?? '').trim(),
    price: Number(payload.price ?? 0),
    sizes: (payload.sizes ?? []).map((size) => size.trim()).filter(Boolean),
    images: (payload.images ?? []).map((url) => url.trim()).filter(Boolean),
  };
}

function serializeMerch(merch: {
  _id: { toString: () => string };
  title: string;
  price: number;
  sizes?: string[];
  images?: string[];
}) {
  return {
    id: merch._id.toString(),
    title: merch.title,
    price: merch.price,
    sizes: merch.sizes ?? [],
    images: merch.images ?? [],
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

  const body = (await request.json()) as MerchPayload;
  const payload = normalizePayload(body);

  if (!payload.title) {
    return NextResponse.json(
      { error: 'Le titre est obligatoire.' },
      { status: 400 }
    );
  }

  if (Number.isNaN(payload.price) || payload.price < 0) {
    return NextResponse.json(
      { error: 'Le prix doit être un nombre positif.' },
      { status: 400 }
    );
  }

  await dbConnect();
  const updated = await MerchModel.findByIdAndUpdate(id, payload, { new: true }).lean();

  if (!updated) {
    return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
  }

  return NextResponse.json(serializeMerch(updated));
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
  const deleted = await MerchModel.findByIdAndDelete(id).lean();

  if (!deleted) {
    return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
