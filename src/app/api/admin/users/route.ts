import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

type UserRole = 'admin' | 'super-admin' | 'super-admin';

type CreateUserPayload = {
  firstName?: string;
  email?: string;
  password?: string;
  role?: UserRole;
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
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  return null;
}

export async function GET() {
  const unauthorized = await ensureSuperAdmin();
  if (unauthorized) {
    return unauthorized;
  }

  await dbConnect();
  const users = await UserModel.find({}).sort({ createdAt: -1 }).lean();

  return NextResponse.json(users.map((user) => serializeUser(user)));
}

export async function POST(request: Request) {
  const unauthorized = await ensureSuperAdmin();
  if (unauthorized) {
    return unauthorized;
  }

  const body = (await request.json()) as CreateUserPayload;
  const firstName = (body.firstName ?? '').trim();
  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';
  const role = normalizeRole(body.role);

  if (!firstName || !email || !password) {
    return NextResponse.json(
      { error: 'Prénom, email et mot de passe sont obligatoires.' },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Le mot de passe doit contenir au moins 6 caractères.' },
      { status: 400 }
    );
  }

  await dbConnect();

  const existingUser = await UserModel.findOne({ email }).lean();
  if (existingUser) {
    return NextResponse.json({ error: 'Cet email existe déjà.' }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const created = await UserModel.create({
    firstName,
    email,
    password: hashedPassword,
    role,
  });

  return NextResponse.json(serializeUser(created), { status: 201 });
}
