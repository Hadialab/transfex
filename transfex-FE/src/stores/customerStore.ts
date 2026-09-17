import { create } from 'zustand';
import type { Customer } from '../types';
import { api, ApiError } from '../lib/apiClient';

interface CustomerStore {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  fetchCustomers: (search?: string) => Promise<void>;
  createCustomer: (input: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
  }) => Promise<Customer | null>;
  updateCustomer: (id: string, patch: Partial<Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'createdAt'>>) => Promise<Customer | null>;
  deleteCustomer: (id: string) => Promise<boolean>;
  getCustomer: (id: string) => Customer | undefined;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  loading: false,
  error: null,
  loaded: false,

  fetchCustomers: async (search) => {
    set({ loading: true, error: null });
    try {
      // pageSize 100 (the backend's max) — the dashboard views assume the
      // full list is in memory; revisit with real pagination if that stops
      // being true.
      const data = await api.get<{ customers: Customer[] }>('/api/customers', {
        search,
        pageSize: 100,
      });
      set({ customers: data.customers, loading: false, loaded: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load customers.';
      set({ loading: false, error: message });
    }
  },

  createCustomer: async (input) => {
    try {
      const data = await api.post<{ customer: Customer }>('/api/customers', input);
      set((state) => ({ customers: [data.customer, ...state.customers] }));
      return data.customer;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not create customer.';
      set({ error: message });
      return null;
    }
  },

  updateCustomer: async (id, patch) => {
    try {
      const data = await api.patch<{ customer: Customer }>(`/api/customers/${id}`, patch);
      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? data.customer : c)),
      }));
      return data.customer;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not update customer.';
      set({ error: message });
      return null;
    }
  },

  deleteCustomer: async (id) => {
    try {
      await api.delete(`/api/customers/${id}`);
      set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));
      return true;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not delete customer.';
      set({ error: message });
      return false;
    }
  },

  getCustomer: (id) => get().customers.find((c) => c.id === id),
}));