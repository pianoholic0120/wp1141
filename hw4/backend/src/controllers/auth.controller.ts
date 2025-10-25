import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth.middleware';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, username, password } = req.body;

    // Check if user already exists
    const existingUserByEmail = UserModel.findByEmail(email);
    if (existingUserByEmail) {
      res.status(400).json({ error: '此電子郵件已被註冊' });
      return;
    }

    const existingUserByUsername = UserModel.findByUsername(username);
    if (existingUserByUsername) {
      res.status(400).json({ error: '此用戶名已被使用' });
      return;
    }

    // Create user
    const user = UserModel.create(email, username, password);

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: '用戶註冊成功',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: '註冊失敗' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = UserModel.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: '電子郵件或密碼錯誤' });
      return;
    }

    // Verify password
    const isValidPassword = await UserModel.comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ error: '電子郵件或密碼錯誤' });
      return;
    }

    // Generate token
    const token = generateToken(user.id);

    res.status(200).json({
      message: '登入成功',
      user: UserModel.toDTO(user),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登入失敗' });
  }
}

export function logout(req: Request, res: Response): void {
  res.status(200).json({ message: '登出成功' });
}

export function getCurrentUser(req: AuthRequest, res: Response): void {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: '未認證' });
      return;
    }

    const user = UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: '用戶不存在' });
      return;
    }

    res.status(200).json({
      user: UserModel.toDTO(user)
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: '獲取用戶資訊失敗' });
  }
}

