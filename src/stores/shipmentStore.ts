import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Shipment, ShipmentStatus } from '../types';
import { mockShipments } from '../data/mockData';

interface ShipmentStore {
  shipments: Shipment[];
  addShipment: (shipment: Shipment) => void;
  updateShipmentStatus: (id: string, status: ShipmentStatus, note?: string, location?: string) => void;
  addNote: (id: string, text: string, author: string) => void;
  getShipment: (id: string) => Shipment | undefined;
  getShipmentByOrderId: (orderId: string) => Shipment | undefined;
  getShipmentsByCustomer: (customerId: string) => Shipment[];
  getShipmentsByStatus: (status: ShipmentStatus) => Shipment[];
}

export const useShipmentStore = create<ShipmentStore>()(
  persist(
    (set, get) => ({
      shipments: mockShipments,
      addShipment: (shipment) =>
        set((state) => ({ shipments: [shipment, ...state.shipments] })),
      updateShipmentStatus: (id, status, note, location) =>
        set((state) => ({
          shipments: state.shipments.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status,
                  updatedAt: new Date().toISOString(),
                  actualDelivery: status === 'delivered' ? new Date().toISOString() : s.actualDelivery,
                  statusHistory: [
                    ...s.statusHistory,
                    { status, timestamp: new Date().toISOString(), note, location },
                  ],
                }
              : s
          ),
        })),
      addNote: (id, text, author) =>
        set((state) => ({
          shipments: state.shipments.map((s) =>
            s.id === id
              ? {
                  ...s,
                  notes: [...s.notes, { id: crypto.randomUUID(), text, author, createdAt: new Date().toISOString() }],
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        })),
      getShipment: (id) => get().shipments.find((s) => s.id === id),
      getShipmentByOrderId: (orderId) => get().shipments.find((s) => s.orderId.toLowerCase() === orderId.toLowerCase()),
      getShipmentsByCustomer: (customerId) => get().shipments.filter((s) => s.customerId === customerId),
      getShipmentsByStatus: (status) => get().shipments.filter((s) => s.status === status),
    }),
    { name: 'transfex-shipments' }
  )
);
