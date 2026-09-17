export type Role = 'admin' | 'staff';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: Date;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at.toISOString(),
  };
}
