import { Button } from "@/components/ui/button";
import dbConnect from "@/lib/db";

export default async function Home() {
  await dbConnect();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50">
      <h1 className="text-4xl font-bold text-slate-900">
        Next.js + Tailwind + Shadcn/ui + MongoDB
      </h1>
      <p className="text-slate-600">
        Votre projet est prêt ! La base de données est connectée (si .env.local est configuré).
      </p>
      <div className="flex gap-4">
        <Button>Démarrer</Button>
        <Button variant="outline">Documentation</Button>
      </div>
    </div>
  );
}
