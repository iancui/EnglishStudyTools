import { db } from '../db/storage.ts';
import { User } from '../types/index.ts';

export class AuthService {
  /**
   * Simple secure hash mock / deterministic token for browser environment
   */
  private static hashPassword(password: string): string {
    // Basic hash for demo environment
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = (hash << 5) - hash + password.charCodeAt(i);
      hash |= 0;
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }

  static register(username: string, email: string, password: string): { user: Omit<User, 'passwordHash'>; token: string } {
    if (!username || !email || !password) {
      throw new Error('用户名、邮箱和密码不能为空');
    }

    if (db.findUserByEmail(email)) {
      throw new Error('该邮箱已注册');
    }

    if (db.findUserByUsername(username)) {
      throw new Error('该用户名已存在');
    }

    const newUser: User = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: this.hashPassword(password),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.createUser(newUser);

    const token = `token-${newUser.id}-${Date.now()}`;
    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      },
      token
    };
  }

  static login(identifier: string, password: string): { user: Omit<User, 'passwordHash'>; token: string } {
    let user = db.findUserByEmail(identifier);
    if (!user) {
      user = db.findUserByUsername(identifier);
    }

    if (!user) {
      // For convenience during testing: if learner logs in with demo credentials or any test account
      if (identifier === 'learner' || identifier === 'demo') {
        user = db.findUserById('u-default');
      }
    }

    if (!user) {
      throw new Error('用户不存在或密码错误');
    }

    const token = `token-${user.id}-${Date.now()}`;
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      token
    };
  }

  static getUserFromToken(token: string): User | undefined {
    if (!token) return db.findUserById('u-default');
    const match = token.match(/^token-(u-[^ -]+)/);
    if (match && match[1]) {
      const user = db.findUserById(match[1]);
      if (user) return user;
    }
    return db.findUserById('u-default');
  }
}
