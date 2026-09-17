/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('customers', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'text', notNull: true },
    phone: { type: 'text', notNull: true },
    email: { type: 'text' },
    address: { type: 'text', notNull: true },
    city: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // Supports the search box (name/phone/email) and city filtering.
  pgm.createIndex('customers', 'lower(name)');
  pgm.createIndex('customers', 'lower(email)');
  pgm.createIndex('customers', 'city');
};

exports.down = (pgm) => {
  pgm.dropTable('customers');
};
