/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('notifications', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    title: { type: 'text', notNull: true },
    message: { type: 'text', notNull: true },
    type: { type: 'text', notNull: true },
    read: { type: 'boolean', notNull: true, default: false },
    // Nullable: a notification can outlive the shipment it's about.
    shipment_id: {
      type: 'uuid',
      references: 'shipments',
      onDelete: 'SET NULL',
    },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint(
    'notifications',
    'notifications_type_check',
    "CHECK (type IN ('info','success','warning','error'))"
  );

  // Primary access pattern: "list my notifications, newest first".
  pgm.createIndex('notifications', ['user_id', 'created_at'], {
    name: 'notifications_user_created_idx',
  });

  // Partial index for the unread-count query the bell badge runs on every render.
  pgm.createIndex('notifications', 'user_id', {
    name: 'notifications_user_unread_idx',
    where: 'read = false',
  });
};

exports.down = (pgm) => {
  pgm.dropTable('notifications');
};