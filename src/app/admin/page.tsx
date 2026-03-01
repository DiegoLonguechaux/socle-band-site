'use client';

import { useSession } from "next-auth/react";

export default function AdminDashboard() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col p-8 bg-slate-50 h-full">
      <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>
      <p className="mb-4 text-lg text-slate-600">Bienvenue, <span className="font-bold text-slate-900">{session?.user?.name}</span> !</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder cards to match structure */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="font-semibold text-lg mb-2">Gérer les utilisateurs</h3>
          <p className="text-slate-500 text-sm">Gérer les accès et les rôles des membres.</p>
        </div>
      </div>
    </div>
  );
}
