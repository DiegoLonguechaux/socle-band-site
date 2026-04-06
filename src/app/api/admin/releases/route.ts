import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import ReleaseModel from '@/models/Release';
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

function normalizePayload(payload: ReleasePayload) {
  return {
    type: payload.type,
    name: (payload.name ?? '').trim(),
    coverUrl: (payload.coverUrl ?? '').trim(),
    links: {
      ...emptyLinks(),
      ...(payload.links ?? {}),
    },
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

export async function GET() {
  const unauthorized = await ensureAuth();
  if (unauthorized) {
    return unauthorized;
  }

  await dbConnect();
  const releases = await ReleaseModel.find({}).sort({ createdAt: -1 }).lean();

  return NextResponse.json(releases.map((release) => serializeRelease(release)));
}

export async function POST(request: Request) {
  const unauthorized = await ensureAuth();
  if (unauthorized) {
    return unauthorized;
  }

  const body = (await request.json()) as ReleasePayload;
  const payload = normalizePayload(body);

  if (!payload.type || !payload.name) {
    return NextResponse.json(
      { error: 'Le type et le nom sont obligatoires.' },
      { status: 400 }
    );
  }

  await dbConnect();
  const created = await ReleaseModel.create(payload);

  return NextResponse.json(serializeRelease(created), { status: 201 });
}
