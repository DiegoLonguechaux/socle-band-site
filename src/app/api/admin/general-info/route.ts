import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import GroupInfoModel from '@/models/GroupInfo';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

type LinksPayload = {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  spotify?: string;
  deezer?: string;
  appleMusic?: string;
  amazonMusic?: string;
  youtubeMusic?: string;
  bandcamp?: string;
  soundcloud?: string;
};

type GroupInfoPayload = {
  bandName?: string;
  bio?: string;
  groupPhotoUrl?: string;
  logoUrl?: string;
  contactEmail?: string;
  links?: LinksPayload;
};

function emptyLinks() {
  return {
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
  };
}

function normalizeDoc(doc: GroupInfoPayload | null | undefined) {
  return {
    bandName: doc?.bandName ?? '',
    bio: doc?.bio ?? '',
    groupPhotoUrl: doc?.groupPhotoUrl ?? '',
    logoUrl: doc?.logoUrl ?? '',
    contactEmail: doc?.contactEmail ?? '',
    links: {
      ...emptyLinks(),
      ...(doc?.links ?? {}),
    },
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  await dbConnect();

  const existing = await GroupInfoModel.findOne({}).lean();

  if (!existing) {
    return NextResponse.json(normalizeDoc(null));
  }

  return NextResponse.json(normalizeDoc(existing));
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = (await request.json()) as GroupInfoPayload;
  await dbConnect();

  const payload = normalizeDoc(body);

  const saved = await GroupInfoModel.findOneAndUpdate(
    {},
    payload,
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  return NextResponse.json(normalizeDoc(saved));
}
