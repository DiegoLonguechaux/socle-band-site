import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import ConcertModel from '@/models/Concert';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

type ConcertPayload = {
  date?: string;
  venue?: string;
  description?: string;
  link?: string;
};

function normalizeConcert(input: ConcertPayload) {
  return {
    date: input.date ?? '',
    venue: (input.venue ?? '').trim(),
    description: (input.description ?? '').trim(),
    link: (input.link ?? '').trim(),
  };
}

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

export async function GET() {
  const unauthorized = await ensureAuth();
  if (unauthorized) {
    return unauthorized;
  }

  await dbConnect();
  const concerts = await ConcertModel.find({}).sort({ date: 1 }).lean();

  return NextResponse.json(concerts.map((concert) => serializeConcert(concert)));
}

export async function POST(request: Request) {
  const unauthorized = await ensureAuth();
  if (unauthorized) {
    return unauthorized;
  }

  const body = (await request.json()) as ConcertPayload;
  const payload = normalizeConcert(body);

  if (!payload.date || !payload.venue) {
    return NextResponse.json(
      { error: 'La date et le lieu sont obligatoires.' },
      { status: 400 }
    );
  }

  await dbConnect();

  const created = await ConcertModel.create({
    date: new Date(payload.date),
    venue: payload.venue,
    description: payload.description,
    link: payload.link,
  });

  return NextResponse.json(serializeConcert(created), { status: 201 });
}
