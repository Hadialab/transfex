/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true }); // gen_random_uuid()

  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'text', notNull: true },
    email: { type: 'text', notNull: true },
    password_hash: { type: 'text', notNull: true },
    role: { type: 'text', notNull: true, default: 'staff' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // Case-insensitive uniqueness — "a@b.com" and "A@b.com" are the same account.
  pgm.createIndex('users', 'lower(email)', { unique: true, name: 'users_email_unique_idx' });
  pgm.addConstraint('users', 'users_role_check', "CHECK (role IN ('admin', 'staff'))");

  pgm.createTable('refresh_tokens', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    token_hash: { type: 'text', notNull: true },
    expires_at: { type: 'timestamptz', notNull: true },
    revoked_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('refresh_tokens', 'token_hash', { unique: true });
  pgm.createIndex('refresh_tokens', 'user_id');
};

exports.down = (pgm) => {
  pgm.dropTable('refresh_tokens');
  pgm.dropTable('users');
};
