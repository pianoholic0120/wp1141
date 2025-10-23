import dotenv from 'dotenv';
import { initializeDatabase, closeDatabase } from '../config/database';

// Load environment variables
dotenv.config();

console.log('Initializing database...');

try {
  initializeDatabase();
  console.log('Database initialized successfully!');
  closeDatabase();
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

