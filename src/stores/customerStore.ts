import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer } from '../types';
import { mockCustomers } from '../data/mockData';

interface CustomerStore {
  customers: Customer[];
  addCustomer: (customer: Customer) => void;
  getCustomer: (id: string) => Customer | undefined;
  getCustomerByPhone: (phone: string) => Customer | undefined;
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: mockCustomers,
      addCustomer: (customer) =>
        set((state) => ({ customers: [customer, ...state.customers] })),
      getCustomer: (id) => get().customers.find((c) => c.id === id),
      getCustomerByPhone: (phone) =>
        get().customers.find((c) => c.phone.replace(/\s/g, '').includes(phone.replace(/\s/g, ''))),
    }),
    { name: 'transfex-customers' }
  )
);
