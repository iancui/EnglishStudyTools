import crypto from 'node:crypto';
import { db } from '../db/storage.ts';
import { User, UserRole } from '../types/index.ts';

export class AuthService {
  private static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `scrypt$${salt}$${hash}`;
  }

  private static verifyPassword(password: string, stored: string): boolean {
    if (!stored?.startsWith('scrypt$')) return false;
    const [, salt, expected] = stored.split('$');
    if (!salt || !expected) return false;
    const actual = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
  }

  private static async createToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.createAuthSession(token, userId, expiresAt);
    return token;
  }

  static async register(username: string, email: string, password: string, captchaId: string, captchaCode: string): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    CaptchaService.verify(captchaId, captchaCode);
    username = String(username || '').trim();
    email = String(email || '').trim().toLowerCase();
    if (!username || !email || !password) throw new Error('用户名、邮箱和密码不能为空');
    if (username.length < 3 || username.length > 30) throw new Error('用户名长度应为 3-30 个字符');
    if (password.length < 6) throw new Error('密码至少需要 6 个字符');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('邮箱格式不正确');
    if (await db.findUserByEmail(email)) throw new Error('该邮箱已注册');
    if (await db.findUserByUsername(username)) throw new Error('该用户名已存在');

    const role: UserRole = 'USER';
    const now = new Date().toISOString();
    const newUser: User = {
      id: `u-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      username, email, role,
      passwordHash: this.hashPassword(password),
      createdAt: now, updatedAt: now
    };
    await db.createUser(newUser);
    return { user: await this.publicUser(newUser), token: await this.createToken(newUser.id) };
  }

  static async login(username: string, password: string, captchaId: string, captchaCode: string): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    CaptchaService.verify(captchaId, captchaCode);
    username = String(username || '').trim();
    const user = await db.findUserByUsername(username);
    if (!user || !this.verifyPassword(password || '', user.passwordHash)) throw new Error('账户名或密码错误');
    return { user: await this.publicUser(user), token: await this.createToken(user.id) };
  }

  static async getUserFromToken(token: string): Promise<User | undefined> {
    if (!token) return undefined;
    const session = await db.findAuthSession(token);
    if (!session) return undefined;
    return await db.findUserById(session.userId);
  }

  static async revokeToken(token: string) {
    if (token) await db.revokeAuthSession(token);
  }

  private static async publicUser(user: User): Promise<Omit<User, 'passwordHash'>> {
    const access = await db.getUserAccess(user.id);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'USER',
      roles: access.roles.map((r:any) => r.id),
      permissions: access.permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}

export class CaptchaService {
  private static store = new Map<string, { code: string; expiresAt: number }>();

  static create() {
    const id = crypto.randomBytes(16).toString('hex');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) code += chars[crypto.randomInt(chars.length)];
    this.store.set(id, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
    console.log('[captcha:create]', {
      id,
      codeLength: code.length
    });
    const width = 150, height = 48;
    const noise = Array.from({length: 7}, (_, i) => `<line x1="${10+i*21}" y1="0" x2="${Math.random()*width}" y2="${height}" stroke="#d6d3d1" stroke-width="1"/>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#fafaf9"/>${noise}<text x="75" y="33" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" font-weight="700" letter-spacing="5" fill="#292524">${code}</text></svg>`;
    return { captchaId: id, image: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}` };
  }

  static verify(id: string, input: string) {
    const item = this.store.get(id);
    const normalizedInput = String(input || '').trim().toUpperCase();
    console.log('[captcha:verify]', {
      id,
      exists: !!item,
      expired: item ? item.expiresAt < Date.now() : null,
      inputLength: normalizedInput.length,
      codeLength: item?.code.length ?? null,
      matched: item ? normalizedInput === item.code : false
    });
    this.store.delete(id);
    if (!item || item.expiresAt < Date.now() || normalizedInput !== item.code) throw new Error('图形验证码错误或已过期');
  }
}
