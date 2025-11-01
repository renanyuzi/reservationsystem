import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// JWT Secret (本番環境では環境変数から読み込む)
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-super-secret-jwt-key-change-in-production';

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ========================================
// シンプルなパスワードハッシュ関数（SHA-256ベース）
// ========================================

async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + JWT_SECRET);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error('Hash password error:', error);
    throw new Error('Failed to hash password: ' + String(error));
  }
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
  } catch (error) {
    console.error('Verify password error:', error);
    return false;
  }
}

// ========================================
// シンプルなJWT実装
// ========================================

function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

async function createJWT(payload: any): Promise<string> {
  try {
    const header = { alg: 'HS256', typ: 'JWT' };
    
    const encoder = new TextEncoder();
    const encodedHeader = base64UrlEncode(encoder.encode(JSON.stringify(header)));
    const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
    
    const message = `${encodedHeader}.${encodedPayload}`;
    const messageData = encoder.encode(message + JWT_SECRET);
    const hashBuffer = await crypto.subtle.digest('SHA-256', messageData);
    const signature = base64UrlEncode(new Uint8Array(hashBuffer));
    
    return `${message}.${signature}`;
  } catch (error) {
    console.error('Create JWT error:', error);
    throw new Error('Failed to create JWT: ' + String(error));
  }
}

async function verifyJWT(token: string): Promise<any> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;
    
    const encoder = new TextEncoder();
    const messageData = encoder.encode(message + JWT_SECRET);
    const hashBuffer = await crypto.subtle.digest('SHA-256', messageData);
    const expectedSignature = base64UrlEncode(new Uint8Array(hashBuffer));
    
    if (signature !== expectedSignature) {
      console.error('JWT signature mismatch');
      return null;
    }

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson);
    
    // 有効期限チェック
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.error('JWT expired');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

// ========================================
// 認証ミドルウェア
// ========================================

interface AuthContext {
  userId: string;
  username: string;
  role: string;
}

// JWT検証ミドルウェア
async function authMiddleware(c: any, next: () => Promise<void>) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    const payload = await verifyJWT(token);
    
    if (!payload) {
      return c.json({ error: 'Unauthorized - Invalid token' }, 401);
    }

    // ユーザー情報をコンテキストに設定
    c.set('auth', {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    } as AuthContext);

    await next();
  } catch (error) {
    console.error('Authentication error:', error);
    return c.json({ error: 'Unauthorized - Authentication failed' }, 401);
  }
}

// 管理者権限チェックミドルウェア
async function adminOnly(c: any, next: () => Promise<void>) {
  const auth: AuthContext = c.get('auth');
  
  if (auth.role !== 'manager') {
    return c.json({ error: 'Forbidden - Admin access required' }, 403);
  }
  
  await next();
}

// ========================================
// ユーザー認証エンドポイント（認証不要）
// ========================================

// ログイン
app.post('/make-server-7a759794/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400);
    }

    // ユーザーを取得
    const userKey = `user:${username}`;
    const user = await kv.get<any>(userKey);
    
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // パスワード検証
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // JWTトークンを生成（24時間有効）
    const token = await createJWT({
      userId: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24時間
    });

    // パスワードハッシュを除外して返す
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    return c.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error during login: ' + String(error) }, 500);
  }
});

// ========================================
// 予約管理エンドポイント（認証必須）
// ========================================

// 全予約を取得
app.get('/make-server-7a759794/reservations', authMiddleware, async (c) => {
  try {
    const reservations = await kv.getByPrefix('reservation:');
    return c.json({ success: true, data: reservations });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 予約を追加
app.post('/make-server-7a759794/reservations', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { reservation } = body;

    if (!reservation || !reservation.id) {
      return c.json({ success: false, error: 'Invalid reservation data' }, 400);
    }

    await kv.set(`reservation:${reservation.id}`, reservation);
    return c.json({ success: true, data: reservation });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 予約を更新
app.put('/make-server-7a759794/reservations/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { reservation } = body;

    if (!reservation) {
      return c.json({ success: false, error: 'Invalid reservation data' }, 400);
    }

    await kv.set(`reservation:${id}`, { ...reservation, id });
    return c.json({ success: true, data: { ...reservation, id } });
  } catch (error) {
    console.error('Error updating reservation:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 予約を削除
app.delete('/make-server-7a759794/reservations/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`reservation:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 決済ステータスをトグル
app.patch('/make-server-7a759794/reservations/:id/payment', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const existing = await kv.get<any>(`reservation:${id}`);

    if (!existing) {
      return c.json({ success: false, error: 'Reservation not found' }, 404);
    }

    // 支払い済み <-> 未決済 のトグル
    const nextStatus = existing.paymentStatus === 'paid' ? 'unpaid' : 'paid';

    const updated = { ...existing, paymentStatus: nextStatus };
    await kv.set(`reservation:${id}`, updated);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error toggling payment status:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ========================================
// 拠点管理エンドポイント（認証必須）
// ========================================

// 全拠点を取得
app.get('/make-server-7a759794/locations', authMiddleware, async (c) => {
  try {
    const locations = await kv.getByPrefix('location:');
    return c.json({ success: true, data: locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 拠点を追加（管理者のみ）
app.post('/make-server-7a759794/locations', authMiddleware, adminOnly, async (c) => {
  try {
    const body = await c.req.json();
    const { location } = body;

    if (!location || !location.id) {
      return c.json({ success: false, error: 'Invalid location data' }, 400);
    }

    await kv.set(`location:${location.id}`, location);
    return c.json({ success: true, data: location });
  } catch (error) {
    console.error('Error creating location:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 拠点を削除（管理者のみ）
app.delete('/make-server-7a759794/locations/:id', authMiddleware, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`location:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting location:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ========================================
// スタッフ管理エンドポイント（認証必須）
// ========================================

// 全スタッフを取得
app.get('/make-server-7a759794/staff', authMiddleware, async (c) => {
  try {
    const staff = await kv.getByPrefix('staff:');
    return c.json({ success: true, data: staff });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// スタッフを追加（管理者のみ）
app.post('/make-server-7a759794/staff', authMiddleware, adminOnly, async (c) => {
  try {
    const body = await c.req.json();
    const { staff } = body;

    if (!staff || !staff.id) {
      return c.json({ success: false, error: 'Invalid staff data' }, 400);
    }

    await kv.set(`staff:${staff.id}`, staff);
    return c.json({ success: true, data: staff });
  } catch (error) {
    console.error('Error creating staff:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// スタッフを削除（管理者のみ）
app.delete('/make-server-7a759794/staff/:id', authMiddleware, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`staff:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ========================================
// ユーザー管理エンドポイント（認証必須）
// ========================================

// 全ユーザーを取得（管理職専用）
app.get('/make-server-7a759794/api/users', authMiddleware, adminOnly, async (c) => {
  try {
    const users = await kv.getByPrefix('user:');
    // パスワードハッシュを除外
    const usersWithoutPasswords = users.map(({ passwordHash, ...user }) => user);
    return c.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ユーザーを追加（管理職専用）
app.post('/make-server-7a759794/api/users', authMiddleware, adminOnly, async (c) => {
  try {
    const body = await c.req.json();
    const { username, password, name, role, incentiveRate } = body;

    if (!username || !password || !name || !role) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // パスワードの強度チェック
    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    // ユーザーIDが既に存在するかチェック
    const existing = await kv.get(`user:${username}`);
    if (existing) {
      return c.json({ error: 'Username already exists' }, 409);
    }

    // パスワードをハッシュ化
    const passwordHash = await hashPassword(password);

    const user = {
      id: username,
      username,
      passwordHash,
      name,
      role,
      incentiveRate: role === 'staff' ? incentiveRate : undefined,
      requirePasswordChange: true, // 初回ログイン時にパスワード変更を強制
    };

    await kv.set(`user:${username}`, user);
    
    const { passwordHash: _, ...userWithoutPassword } = user;
    return c.json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ユーザーを更新（本人または管理者）
app.put('/make-server-7a759794/api/users/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { currentPassword, newPassword, name, role, incentiveRate } = body;
    const auth: AuthContext = c.get('auth');

    // 本人または管理者のみ更新可能
    if (auth.userId !== id && auth.role !== 'manager') {
      return c.json({ error: 'Forbidden - You can only update your own profile' }, 403);
    }

    const existing = await kv.get<any>(`user:${id}`);
    if (!existing) {
      return c.json({ error: 'User not found' }, 404);
    }

    let updatedPasswordHash = existing.passwordHash;

    // パスワード変更リクエストの場合
    if (newPassword) {
      // 本人の場合は現在のパスワードを検証
      if (auth.userId === id) {
        if (!currentPassword) {
          return c.json({ error: '現在のパスワードが必要です' }, 400);
        }
        
        // 現在のパスワードを検証
        const isCurrentPasswordValid = await verifyPassword(currentPassword, existing.passwordHash);
        if (!isCurrentPasswordValid) {
          return c.json({ error: '現在のパスワードが正しくあり���せん' }, 401);
        }
      }
      
      // 新しいパスワードのバリデーション
      if (newPassword.length < 8) {
        return c.json({ error: '新しいパスワードは8文字以上で入力してください' }, 400);
      }

      // 新しいパスワードをハッシュ化
      updatedPasswordHash = await hashPassword(newPassword);
    }

    const updated = {
      ...existing,
      name: name !== undefined ? name : existing.name,
      role: (auth.role === 'manager' && role) ? role : existing.role,
      incentiveRate: (auth.role === 'manager' && role === 'staff') ? incentiveRate : existing.incentiveRate,
      passwordHash: updatedPasswordHash,
      requirePasswordChange: false, // パスワード変更後はフラグを解除
    };

    await kv.set(`user:${id}`, updated);
    
    const { passwordHash: _, ...userWithoutPassword } = updated;
    return c.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ユーザーを削除（管理職専用）
app.delete('/make-server-7a759794/api/users/:id', authMiddleware, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    
    // 自分自身は削除できない
    const auth: AuthContext = c.get('auth');
    if (auth.userId === id) {
      return c.json({ error: 'Cannot delete your own account' }, 400);
    }
    
    await kv.del(`user:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ========================================
// 初期データセットアップ（認証不要 - 初回のみ）
// ========================================

// 初期データを設定（初回のみ）
app.post('/make-server-7a759794/setup', async (c) => {
  try {
    console.log('=== SETUP API CALLED ===');
    
    // 既にデータが存在するかチェック
    const existingUsers = await kv.getByPrefix('user:');
    console.log('Existing users count:', existingUsers.length);
    
    if (existingUsers.length > 0) {
      console.log('Setup skipped - users already exist');
      return c.json({ success: true, message: 'Data already exists', skipped: true });
    }

    console.log('Starting fresh setup...');

    // デフォルトの管理者パスワード（初回ログイン時に強制変更）
    const defaultPassword = 'ChangeMe123!';
    console.log('Hashing default password...');
    const managerPasswordHash = await hashPassword(defaultPassword);
    console.log('Password hashed successfully. Hash length:', managerPasswordHash.length);

    // サンプル拠点
    const locations = [
      { id: '1', name: '東京本店' },
      { id: '2', name: '横浜店' },
      { id: '3', name: '大阪店' },
    ];

    // サンプルユーザー
    const users = [
      { 
        id: 'manager', 
        username: 'manager', 
        passwordHash: managerPasswordHash, 
        name: '管理者', 
        role: 'manager',
        requirePasswordChange: true, // 初回ログイン時にパスワード変更を強制
      },
    ];

    // サンプルスタッフ
    const staff = [
      { id: '1', name: '佐藤' },
      { id: '2', name: '鈴木' },
      { id: '3', name: '高橋' },
    ];

    // データを保存
    console.log('Saving users...');
    for (const user of users) {
      await kv.set(`user:${user.username}`, user);
      console.log('Saved user:', user.username);
    }

    console.log('Saving locations...');
    for (const location of locations) {
      await kv.set(`location:${location.id}`, location);
      console.log('Saved location:', location.name);
    }

    console.log('Saving staff...');
    for (const s of staff) {
      await kv.set(`staff:${s.id}`, s);
      console.log('Saved staff:', s.name);
    }

    console.log('=== SETUP COMPLETED SUCCESSFULLY ===');

    return c.json({ 
      success: true, 
      message: 'Initial data setup completed. Please login with username: manager and change the default password immediately.',
      counts: {
        users: users.length,
        locations: locations.length,
        staff: staff.length,
      }
    });
  } catch (error) {
    console.error('=== SETUP ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return c.json({ 
      success: false, 
      error: 'Setup failed: ' + (error instanceof Error ? error.message : String(error)),
      details: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

// ヘルスチェック（認証不要）
app.get('/make-server-7a759794/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);
