import { create } from 'zustand';
import type { Shipment, ShipmentStatus, Platform, Origin, OrderItem } from '../types';
import { api, ApiError } from '../lib/apiClient';
import { useNotificationStore } from './notificationStore';

export interface NewShipmentInput {
  customerId?: string;
  customer?: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
  };
  platform: Platform;
  origin: Origin;
  items: OrderItem[];
  weight: number;
  dimensions?: string;
  declaredValue: number;
  trackingNumber?: string;
  estimatedDelivery: string;
}

interface ShipmentStore {
  shipments: Shipment[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetchShipments: () => Promise<void>;
  addShipment: (input: NewShipmentInput) => Promise<Shipment | null>;
  updateShipmentStatus: (
    id: string,
    status: ShipmentStatus,
    note?: string,
    location?: string
  ) => Promise<Shipment | null>;
  addNote: (id: string, text: string) => Promise<Shipment | null>;
  getShipment: (id: string) => Shipment | undefined;
  getShipmentByOrderId: (orderId: string) => Shipment | undefined;
  getShipmentsByCustomer: (customerId: string) => Shipment[];
  getShipmentsByStatus: (status: ShipmentStatus) => Shipment[];
}

export const useShipmentStore = create<ShipmentStore>((set, get) => ({
  shipments: [],
  loading: false,
  loaded: false,
  error: null,

  fetchShipments: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ shipments: Shipment[] }>('/api/shipments', {
        pageSize: 100,
      });
      set({ shipments: data.shipments, loading: false, loaded: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load shipments.';
      set({ loading: false, error: message });
    }
  },

  addShipment: async (input) => {
    try {
      const data = await api.post<{ shipment: Shipment }>('/api/shipments', input);
      set((state) => ({ shipments: [data.shipment, ...state.shipments] }));
      return data.shipment;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not create shipment.';
      set({ error: message });
      return null;
    }
  },

  updateShipmentStatus: async (id, status, note, location) => {
    try {
      const data = await api.patch<{ shipment: Shipment }>(
        `/api/shipments/${id}/status`,
        { status, note, location }
      );
      set((state) => ({
        shipments: state.shipments.map((s) => (s.id === id ? data.shipment : s)),
      }));

      // The backend fanned a notification out to every admin inside the
      // same status-change transaction. Refresh our local list so the
      // bell badge reflects it without waiting for the next mount.
      useNotificationStore.getState().fetchNotifications();

      return data.shipment;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not update status.';
      set({ error: message });
      return null;
    }
  },

  addNote: async (id, text) => {
    try {
      const data = await api.post<{ shipment: Shipment }>(
        `/api/shipments/${id}/notes`,
        { text }
      );
      set((state) => ({
        shipments: state.shipments.map((s) => (s.id === id ? data.shipment : s)),
      }));
      return data.shipment;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not add note.';
      set({ error: message });
      return null;
    }
  },

  getShipment: (id) => get().shipments.find((s) => s.id === id),
  getShipmentByOrderId: (orderId) =>
    get().shipments.find((s) => s.orderId.toLowerCase() === orderId.toLowerCase()),
  getShipmentsByCustomer: (customerId) =>
    get().shipments.filter((s) => s.customerId === customerId),
  getShipmentsByStatus: (status) =>
    get().shipments.filter((s) => s.status === status),
}));