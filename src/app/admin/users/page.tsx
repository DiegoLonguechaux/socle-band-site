import dbConnect from "@/lib/db";
import UserModel from "@/models/User";
import { columns, User } from "./columns";
import { DataTable } from "./data-table";

async function getData(): Promise<User[]> {
  await dbConnect();
  
  // Use .lean() to get JS objects, and map to ensure serializable data
  const users = await UserModel.find({}).sort({ createdAt: -1 }).lean();

  return users.map((user: any) => ({
    id: user._id.toString(),
    firstName: user.firstName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }));
}

export default async function UsersPage() {
  const data = await getData()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Utilisateurs</h1>
      <DataTable columns={columns} data={data} />
    </div>
  )
}
