export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  created_at: Date;
}

/** Matches the frontend's `Customer` interface in src/types/index.ts exactly. */
export interface PublicCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

/**
 * totalOrders/totalSpent are always 0 until Phase 3 (shipments) exists.
 * Once the shipments table lands, replace this with a query that joins
 * shipments and aggregates COUNT(*) / SUM(declared_value) per customer —
 * do NOT denormalize these onto the customers row; compute at read time
 * so they can never drift out of sync with the shipments table.
 */
export function toPublicCustomer(row: CustomerRow): PublicCustomer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    address: row.address,
    city: row.city,
    totalOrders: 0,
    totalSpent: 0,
    createdAt: row.created_at.toISOString(),
  };
}
