/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Server-generated TFX-#### order IDs. Starts at 1001 to match the mock
  // data range the frontend was built against.
  pgm.createSequence('shipments_order_seq', { start: 1001 });

  pgm.createTable('shipments', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    order_id: { type: 'text', notNull: true, unique: true },
    customer_id: {
      type: 'uuid',
      notNull: true,
      references: 'customers',
      onDelete: 'RESTRICT',
    },
    // Snapshot of customers.name at creation time. Kept denormalized on
    // purpose - the frontend list view renders it without a join. If the
    // customer's name is later edited, existing shipments keep the original.
    customer_name: { type: 'text', notNull: true },
    platform: { type: 'text', notNull: true },
    origin: { type: 'text', notNull: true },
    status: { type: 'text', notNull: true, default: 'pending' },
    weight: { type: 'numeric(10,2)', notNull: true },
    dimensions: { type: 'text' },
    declared_value: { type: 'numeric(10,2)', notNull: true },
    tracking_number: { type: 'text' },
    estimated_delivery: { type: 'date', notNull: true },
    actual_delivery: { type: 'date' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint(
    'shipments',
    'shipments_platform_check',
    "CHECK (platform IN ('trendyol','shein','aliexpress','alibaba','other'))"
  );
  pgm.addConstraint(
    'shipments',
    'shipments_origin_check',
    "CHECK (origin IN ('china','dubai'))"
  );
  pgm.addConstraint(
    'shipments',
    'shipments_status_check',
    "CHECK (status IN ('pending','picked_up','in_transit','customs','out_for_delivery','delivered','flagged'))"
  );

  pgm.createIndex('shipments', 'customer_id');
  pgm.createIndex('shipments', 'status');
  pgm.createIndex('shipments', 'platform');
  pgm.createIndex('shipments', 'tracking_number');
  // Supports the case-insensitive order_id search the frontend does.
  pgm.createIndex('shipments', 'lower(order_id)', {
    name: 'shipments_order_id_lower_idx',
  });

  pgm.createTable('order_items', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    shipment_id: {
      type: 'uuid',
      notNull: true,
      references: 'shipments',
      onDelete: 'CASCADE',
    },
    name: { type: 'text', notNull: true },
    quantity: { type: 'integer', notNull: true },
    price: { type: 'numeric(10,2)', notNull: true },
    url: { type: 'text' },
  });
  pgm.addConstraint('order_items', 'order_items_quantity_check', 'CHECK (quantity > 0)');
  pgm.createIndex('order_items', 'shipment_id');

  pgm.createTable('notes', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    shipment_id: {
      type: 'uuid',
      notNull: true,
      references: 'shipments',
      onDelete: 'CASCADE',
    },
    text: { type: 'text', notNull: true },
    // Snapshot of users.name at write time, resolved server-side from
    // req.user.sub. Never trusted from the request body.
    author: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('notes', 'shipment_id');

  pgm.createTable('status_history', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    shipment_id: {
      type: 'uuid',
      notNull: true,
      references: 'shipments',
      onDelete: 'CASCADE',
    },
    status: { type: 'text', notNull: true },
    note: { type: 'text' },
    location: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('status_history', 'shipment_id');
};

exports.down = (pgm) => {
  pgm.dropTable('status_history');
  pgm.dropTable('notes');
  pgm.dropTable('order_items');
  pgm.dropTable('shipments');
  pgm.dropSequence('shipments_order_seq');
};