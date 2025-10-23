import bcrypt from 'bcrypt';
import { getDatabase } from '../config/database';
import { User, UserDTO } from '../types';

export class UserModel {
  static async hashPassword(password: string): Promise<string> {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
    return await bcrypt.hash(password, rounds);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  static create(email: string, username: string, password: string): UserDTO {
    const db = getDatabase();
    const passwordHash = bcrypt.hashSync(password, parseInt(process.env.BCRYPT_ROUNDS || '10'));

    const stmt = db.prepare(`
      INSERT INTO users (email, username, password_hash)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(email, username, passwordHash);

    return {
      id: result.lastInsertRowid as number,
      email,
      username
    };
  }

  static findById(id: number): User | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id) as User | undefined;
    return user || null;
  }

  static findByEmail(email: string): User | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email) as User | undefined;
    return user || null;
  }

  static findByUsername(username: string): User | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username) as User | undefined;
    return user || null;
  }

  static update(id: number, data: Partial<User>): boolean {
    const db = getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.email) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.username) {
      updates.push('username = ?');
      values.push(data.username);
    }

    if (updates.length === 0) return false;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE users SET ${updates.join(', ')} WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  }

  static delete(id: number): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static toDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email,
      username: user.username
    };
  }
}

