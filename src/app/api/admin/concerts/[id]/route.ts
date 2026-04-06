import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import ConcertModel from '@/models/Concert';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

type ConcertPayload = {
  date?: string;
  venue?: string;
  description?: string;
  link?: string;
};

function serializeConcert(concert: {
  _id: { toString: () => string };
  date: Date;
  venue: string;
  description?: string;
  link?: string;
}) {
  return {
    id: concert._id.toString(),
    date: concert.date.toISOString(),
    venue: concert.venue,
    description: concert.description ?? '',
    link: concert.link ?? '',
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

  const body = (await request.json()) as ConcertPayload;
  const date = body.date ?? '';
  const venue = (body.venue ?? '').trim();

  if (!date || !venue) {
    return NextResponse.json(
      { error: 'La date et le lieu sont obligatoires.' },
      { status: 400 }
    );
  }

  await dbConnect();

  const updated = await ConcertModel.findByIdAndUpdate(
    id,
    {
      date: new Date(date),
      venue,
      description: (body.description ?? '').trim(),
      link: (body.link ?? '').trim(),
    },
    { new: true }
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: 'Concert introuvable' }, { status: 404 });
  }

  return NextResponse.json(serializeConcert(updated));
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
  const deleted = await ConcertModel.findByIdAndDelete(id).lean();

  if (!deleted) {
    return NextResponse.json({ error: 'Concert introuvable' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
