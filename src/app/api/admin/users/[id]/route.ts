import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

type UserRole = 'admin' | 'super-admin' | 'super-admin';

type UpdateUserPayload = {
  firstName?: string;
  email?: string;
  role?: UserRole;
  password?: string;
};

function normalizeRole(role: UserRole | undefined) {
  return role === 'super-admin' ? 'super-admin' : (role ?? 'admin');
}

function serializeUser(user: {
  _id: { toString: () => string };
  firstName: string;
  email: string;
  role: string;
  createdAt: Date;
}) {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    email: user.email,
    role: user.role === 'super-admin' ? 'super-admin' : user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

async function ensureSuperAdmin() {
  const session = await getServerSession(authOptions);
  const role = session?.user && 'role' in session.user ? (session.user.role as string) : '';

  if (!session?.user || (role !== 'super-admin' && role !== 'super-admin')) {
    return {
      response: NextResponse.json({ error: 'Non autorisé' }, { status: 403 }),
      session: null,
    };
  }

  return { response: null, session };
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { response, session } = await ensureSuperAdmin();
  if (response || !session?.user) {
    return response;
  }

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
  }

  const body = (await request.json()) as UpdateUserPayload;
  const firstName = (body.firstName ?? '').trim();
  const email = (body.email ?? '').trim().toLowerCase();
  const role = normalizeRole(body.role);
  const password = body.password ?? '';

  if (!firstName || !email) {
    return NextResponse.json(
      { error: 'Prénom et email sont obligatoires.' },
      { status: 400 }
    );
  }

  if (password && password.length < 6) {
    return NextResponse.json(
      { error: 'Le mot de passe doit contenir au moins 6 caractères.' },
      { status: 400 }
    );
  }

  await dbConnect();

  const duplicate = await UserModel.findOne({ email, _id: { $ne: id } }).lean();
  if (duplicate) {
    return NextResponse.json({ error: 'Cet email existe déjà.' }, { status: 409 });
  }

  const updatePayload: {
    firstName: string;
    email: string;
    role: string;
    password?: string;
  } = {
    firstName,
    email,
    role,
  };

  if (password) {
    updatePayload.password = await bcrypt.hash(password, 10);
  }

  const updated = await UserModel.findByIdAndUpdate(id, updatePayload, { new: true }).lean();

  if (!updated) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }

  return NextResponse.json(serializeUser(updated));
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { response, session } = await ensureSuperAdmin();
  if (response || !session?.user) {
    return response;
  }

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
  }

  const currentUserId = 'id' in session.user ? String(session.user.id) : '';
  if (currentUserId === id) {
    return NextResponse.json(
      { error: 'Vous ne pouvez pas supprimer votre propre compte.' },
      { status: 400 }
    );
  }

  await dbConnect();
  const deleted = await UserModel.findByIdAndDelete(id).lean();

  if (!deleted) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
