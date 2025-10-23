import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function initializeDatabase(): Database.Database {
  const dbPath = process.env.DATABASE_PATH || './database/rental_listings.db';
  const dbDir = path.dirname(dbPath);

  // Create database directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Create tables
  createTables();

  return db;
}

function createTables(): void {
  if (!db) throw new Error('Database not initialized');

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);

  // Listings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      address VARCHAR(500) NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      bedrooms INTEGER,
      bathrooms INTEGER,
      area_sqft INTEGER,
      property_type VARCHAR(50),
      status VARCHAR(20) DEFAULT 'available',
      floor INTEGER,
      contact_phone VARCHAR(20),
      management_fee DECIMAL(10, 2),
      amenities TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_listings_coordinates ON listings(latitude, longitude);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
  `);

  // Favorites table
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
      UNIQUE(user_id, listing_id)
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON favorites(listing_id);
  `);

  // Ratings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
      UNIQUE(user_id, listing_id)
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ratings_listing_id ON ratings(listing_id);
  `);

  console.log('Database tables created successfully');
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Export db instance for scripts
export { db };

