import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ========================================
// 予約管理エンドポイント
// ========================================

// 全予約を取得
app.get('/make-server-7a759794/reservations', async (c) => {
  try {
    const reservations = await kv.getByPrefix('reservation:');
    return c.json({ success: true, data: reservations });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 予約を追加
app.post('/make-server-7a759794/reservations', async (c) => {
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
app.put('/make-server-7a759794/reservations/:id', async (c) => {
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
app.delete('/make-server-7a759794/reservations/:id', async (c) => {
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
app.patch('/make-server-7a759794/reservations/:id/payment', async (c) => {
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
// 拠点管理エンドポイント
// ========================================

// 全拠点を取得
app.get('/make-server-7a759794/locations', async (c) => {
  try {
    const locations = await kv.getByPrefix('location:');
    return c.json({ success: true, data: locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 拠点を追加
app.post('/make-server-7a759794/locations', async (c) => {
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

// 拠点を削除
app.delete('/make-server-7a759794/locations/:id', async (c) => {
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
// スタッフ管理エンドポイント
// ========================================

// 全スタッフを取得
app.get('/make-server-7a759794/staff', async (c) => {
  try {
    const staff = await kv.getByPrefix('staff:');
    return c.json({ success: true, data: staff });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// スタッフを追加
app.post('/make-server-7a759794/staff', async (c) => {
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

// スタッフを削除
app.delete('/make-server-7a759794/staff/:id', async (c) => {
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
// ユーザー認証・管理エンドポイント
// ========================================

// ログイン
app.post('/make-server-7a759794/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Username:', username);
    console.log('Password provided:', password ? 'yes' : 'no');

    if (!username || !password) {
      console.log('ERROR: Missing credentials');
      return c.json({ error: 'Username and password are required' }, 400);
    }

    // デバッグ: すべてのユーザーキーを確認
    const allUsers = await kv.getByPrefix('user:');
    console.log('All users in database:', allUsers.length);
    console.log('User keys:', allUsers.map((u: any) => u.username));

    // ユーザーを取得
    const userKey = `user:${username}`;
    console.log('Looking for key:', userKey);
    const user = await kv.get<any>(userKey);
    
    if (!user) {
      console.log('ERROR: User not found for key:', userKey);
      console.log('Available users:', allUsers.map((u: any) => ({ key: `user:${u.username}`, name: u.name })));
      return c.json({ 
        error: 'Invalid credentials',
        debug: {
          attemptedKey: userKey,
          availableUsers: allUsers.length,
          usernames: allUsers.map((u: any) => u.username)
        }
      }, 401);
    }

    console.log('User found:', { username: user.username, name: user.name, role: user.role });

    if (user.password !== password) {
      console.log('ERROR: Password mismatch');
      console.log('Expected:', user.password);
      console.log('Received:', password);
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // パスワードを除外して返す
    const { password: _, ...userWithoutPassword } = user;
    console.log('=== LOGIN SUCCESSFUL ===');
    console.log('User:', userWithoutPassword);
    return c.json(userWithoutPassword);
  } catch (error) {
    console.error('Login exception:', error);
    return c.json({ error: String(error), stack: (error as Error).stack }, 500);
  }
});

// 全ユーザーを取得（管理職専用）
app.get('/make-server-7a759794/api/users', async (c) => {
  try {
    const users = await kv.getByPrefix('user:');
    // パスワードを除外
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    return c.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ユーザーを追加（管理職専用）
app.post('/make-server-7a759794/api/users', async (c) => {
  try {
    const body = await c.req.json();
    const { username, password, name, role, incentiveRate } = body;

    if (!username || !password || !name || !role) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // ユーザーIDが既に存在するかチェック
    const existing = await kv.get(`user:${username}`);
    if (existing) {
      return c.json({ error: 'Username already exists' }, 409);
    }

    const user = {
      id: username,
      username,
      password,
      name,
      role,
      incentiveRate: role === 'staff' ? incentiveRate : undefined,
    };

    await kv.set(`user:${username}`, user);
    
    const { password: _, ...userWithoutPassword } = user;
    return c.json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ユーザーを更新
app.put('/make-server-7a759794/api/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { password, currentPassword, newPassword, name, role, incentiveRate } = body;

    const existing = await kv.get<any>(`user:${id}`);
    if (!existing) {
      return c.json({ error: 'User not found' }, 404);
    }

    // パスワード変更リクエストの場合
    if (newPassword) {
      if (!currentPassword) {
        return c.json({ error: '現在のパスワードが必要です' }, 400);
      }
      
      // 現在のパスワードを検証
      if (existing.password !== currentPassword) {
        return c.json({ error: '現在のパスワードが正しくありません' }, 401);
      }
      
      // 新しいパスワードでバリデーション
      if (newPassword.length < 8) {
        return c.json({ error: '新しいパスワードは8文字以上で入力してください' }, 400);
      }
    }

    const updated = {
      ...existing,
      name: name || existing.name,
      role: role || existing.role,
      incentiveRate: role === 'staff' ? incentiveRate : undefined,
      // パスワード更新の優先順位: newPassword > password > 既存
      password: newPassword || password || existing.password,
    };

    await kv.set(`user:${id}`, updated);
    
    const { password: _, ...userWithoutPassword } = updated;
    return c.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ユーザーを削除（管理職専用）
app.delete('/make-server-7a759794/api/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`user:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ========================================
// 初期データセットアップ
// ========================================

// 管理職のみセットアップ（最初のセットアップ）
app.post('/make-server-7a759794/setup-manager', async (c) => {
  try {
    console.log('=== MANAGER SETUP STARTED ===');
    
    // 管理職が既に存在するかチェック
    const existingManager = await kv.get('user:manager');
    
    if (existingManager) {
      console.log('Manager already exists:', existingManager);
      return c.json({ 
        success: true, 
        message: 'Manager already exists', 
        skipped: true,
        manager: { username: 'manager', name: '管理者' }
      });
    }

    // 管理職アカウントを作成
    // セキュリティを考慮したより強力なパスワード
    const manager = {
      id: 'manager',
      username: 'manager',
      password: 'Manager@2024!Secure',
      name: '管理者',
      role: 'manager'
    };

    console.log('Creating manager account with data:', { ...manager, password: '***' });
    await kv.set('user:manager', manager);
    console.log('Manager kv.set completed');

    // 書き込みを確認
    const verification = await kv.get('user:manager');
    console.log('Verification read:', verification ? 'SUCCESS' : 'FAILED');
    if (verification) {
      console.log('Verified data:', { ...verification, password: '***' });
    }

    // 基本的な拠点も作成
    const locations = [
      { id: '1', name: '東京本店' },
      { id: '2', name: '横浜店' },
      { id: '3', name: '大阪店' },
    ];

    console.log('Creating default locations...');
    for (const location of locations) {
      await kv.set(`location:${location.id}`, location);
      console.log(`Created location: ${location.name}`);
    }

    console.log('=== MANAGER SETUP COMPLETED ===');

    return c.json({
      success: true,
      message: 'Manager account created successfully',
      data: {
        username: 'manager',
        password: 'manager123',
        name: '管理者',
        role: 'manager'
      },
      locations: locations.length,
      verified: !!verification
    });
  } catch (error) {
    console.error('Manager setup error:', error);
    console.error('Error stack:', (error as Error).stack);
    return c.json({ success: false, error: String(error), stack: (error as Error).stack }, 500);
  }
});

// 初期データを設定（初回のみ）
app.post('/make-server-7a759794/setup', async (c) => {
  try {
    console.log('Setup endpoint called');
    
    // 既にデータが存在するかチェック
    const existingUsers = await kv.getByPrefix('user:');
    console.log('Existing users count:', existingUsers.length);
    
    if (existingUsers.length > 0) {
      console.log('Data already exists, skipping setup');
      return c.json({ success: true, message: 'Data already exists', skipped: true });
    }

    // サンプル拠点
    const locations = [
      { id: '1', name: '東京本店' },
      { id: '2', name: '横浜店' },
      { id: '3', name: '大阪店' },
    ];

    // サンプルユーザー
    const users = [
      { id: 'manager', username: 'manager', password: 'Manager@2024!Secure', name: '管理者', role: 'manager' },
      { id: 'staff001', username: 'staff001', password: 'Staff001@Secure', name: '佐藤', role: 'staff', incentiveRate: 5 },
      { id: 'staff002', username: 'staff002', password: 'Staff002@Secure', name: '鈴木', role: 'staff', incentiveRate: 5 },
      { id: 'staff003', username: 'staff003', password: 'Staff003@Secure', name: '高橋', role: 'staff', incentiveRate: 5 },
    ];

    // サンプルスタッフ（後方互換性のため）
    const staff = [
      { id: '1', name: '佐藤' },
      { id: '2', name: '鈴木' },
      { id: '3', name: '高橋' },
      { id: '4', name: '田中' },
    ];

    // サンプル予約
    const reservations = [
      {
        id: '1',
        date: '2025-10-27',
        time: '10:00',
        duration: 60,
        parentName: '山田花子',
        childName: '太郎',
        childAge: 6,
        customerNumber: 'C20251027001',
        moldCount: 2,
        paymentStatus: 'paid',
        status: 'confirmed',
        location: '東京本店',
        staff: '佐藤',
        createdBy: 'staff001',
        notes: '手形・足形セット希望',
      },
      {
        id: '2',
        date: '2025-10-27',
        time: '14:00',
        duration: 30,
        parentName: '田中美咲',
        childName: 'さくら',
        childAge: 3,
        customerNumber: 'C20251027002',
        moldCount: 1,
        paymentStatus: 'unpaid',
        status: 'confirmed',
        location: '横浜店',
        staff: '鈴木',
        createdBy: 'staff002',
        notes: '',
      },
      {
        id: '3',
        date: '2025-10-28',
        time: '11:00',
        duration: 45,
        parentName: '佐々木健太',
        childName: 'はると',
        childAge: 12,
        customerNumber: 'C20251028001',
        moldCount: 4,
        paymentStatus: 'paid',
        status: 'confirmed',
        location: '東京本店',
        staff: '高橋',
        createdBy: 'staff003',
        notes: '家族全員分',
      },
      {
        id: '4',
        date: '2025-10-29',
        time: '15:30',
        duration: 30,
        parentName: '鈴木真理',
        childName: 'ゆい',
        childAge: 18,
        customerNumber: 'C20251029001',
        moldCount: 2,
        paymentStatus: 'unpaid',
        status: 'standby',
        location: '大阪店',
        staff: '佐藤',
        createdBy: 'staff001',
        notes: '',
      },
      {
        id: '5',
        date: '2025-10-30',
        time: '10:30',
        duration: 60,
        parentName: '伊藤愛',
        childName: 'りく',
        childAge: 4,
        customerNumber: 'C20251030001',
        moldCount: 2,
        paymentStatus: 'paid',
        status: 'confirmed',
        location: '横浜店',
        staff: '田中',
        createdBy: 'staff002',
        notes: '赤ちゃん初めての型取り',
      },
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
    }

    console.log('Saving staff...');
    for (const s of staff) {
      await kv.set(`staff:${s.id}`, s);
    }

    console.log('Saving reservations...');
    for (const reservation of reservations) {
      await kv.set(`reservation:${reservation.id}`, reservation);
    }

    console.log('Setup completed successfully');
    return c.json({ 
      success: true, 
      message: 'Initial data setup completed',
      counts: {
        users: users.length,
        locations: locations.length,
        staff: staff.length,
        reservations: reservations.length,
      }
    });
  } catch (error) {
    console.error('Error setting up initial data:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ヘルスチェック
app.get('/make-server-7a759794/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);
