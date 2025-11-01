import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.tsx';
import * as bcrypt from 'npm:bcryptjs';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

// 初期データセットアップ
app.get('/make-server-6f5ce90a/init', async (c) => {
  try {
    const initDone = await kv.get('init:done');
    
    if (!initDone) {
      // 初期管理者アカウント作成
      const hashedPassword = await bcrypt.hash('ChangeMe123!', 10);
      await kv.set('users:manager', {
        name: '管理者',
        staffId: 'manager',
        password: hashedPassword,
        role: 'admin'
      });
      
      // 初期拠点データ
      await kv.set('locations:list', ['本店', '支店A', '支店B']);
      
      // 初期担当スタッフデータ
      await kv.set('staff:list', ['田中', '佐藤', '鈴木']);
      
      // セットアップ完了フラグ
      await kv.set('init:done', true);
    }
    
    return c.json({ success: true, initialized: true });
  } catch (error) {
    console.log(`Error during initialization: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ログイン
app.post('/make-server-6f5ce90a/login', async (c) => {
  try {
    const { staffId, password } = await c.req.json();
    
    const user = await kv.get(`users:${staffId}`);
    
    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 401);
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return c.json({ success: false, error: 'パスワードが正しくありません' }, 401);
    }
    
    return c.json({
      success: true,
      user: {
        name: user.name,
        staffId: user.staffId,
        role: user.role
      }
    });
  } catch (error) {
    console.log(`Error during login: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// スタッフ一覧取得
app.get('/make-server-6f5ce90a/users', async (c) => {
  try {
    const usersData = await kv.getByPrefix('users:');
    const users = usersData.map(({ value }) => ({
      name: value.name,
      staffId: value.staffId,
      role: value.role
    }));
    
    return c.json({ success: true, users });
  } catch (error) {
    console.log(`Error fetching users: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// スタッフ作成
app.post('/make-server-6f5ce90a/users', async (c) => {
  try {
    const { name, staffId, password, role } = await c.req.json();
    
    const existingUser = await kv.get(`users:${staffId}`);
    if (existingUser) {
      return c.json({ success: false, error: 'このスタッフIDは既に使用されています' }, 400);
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await kv.set(`users:${staffId}`, {
      name,
      staffId,
      password: hashedPassword,
      role
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error creating user: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// スタッフ更新
app.put('/make-server-6f5ce90a/users/:id', async (c) => {
  try {
    const oldStaffId = c.req.param('id');
    const { name, staffId, password, role } = await c.req.json();
    
    const existingUser = await kv.get(`users:${oldStaffId}`);
    if (!existingUser) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404);
    }
    
    // スタッフIDが変更された場合、新しいIDで既存チェック
    if (oldStaffId !== staffId) {
      const newIdExists = await kv.get(`users:${staffId}`);
      if (newIdExists) {
        return c.json({ success: false, error: 'この新しいスタッフIDは既に使用されています' }, 400);
      }
    }
    
    let hashedPassword = existingUser.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    const updatedUser = {
      name,
      staffId,
      password: hashedPassword,
      role
    };
    
    // スタッフIDが変更された場合、古いキーを削除
    if (oldStaffId !== staffId) {
      await kv.del(`users:${oldStaffId}`);
    }
    
    await kv.set(`users:${staffId}`, updatedUser);
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error updating user: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// スタッフ削除
app.delete('/make-server-6f5ce90a/users/:id', async (c) => {
  try {
    const staffId = c.req.param('id');
    await kv.del(`users:${staffId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting user: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// プロフィール更新
app.put('/make-server-6f5ce90a/profile', async (c) => {
  try {
    const { staffId, name, currentPassword, newPassword } = await c.req.json();
    
    const user = await kv.get(`users:${staffId}`);
    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404);
    }
    
    // 現在のパスワードチェック
    if (currentPassword) {
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        return c.json({ success: false, error: '現在のパスワードが正しくありません' }, 401);
      }
    }
    
    let hashedPassword = user.password;
    if (newPassword) {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }
    
    await kv.set(`users:${staffId}`, {
      ...user,
      name,
      password: hashedPassword
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error updating profile: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 予約一覧取得
app.get('/make-server-6f5ce90a/reservations', async (c) => {
  try {
    const reservationsData = await kv.getByPrefix('reservations:');
    const reservations = reservationsData.map(({ value }) => value);
    
    return c.json({ success: true, reservations });
  } catch (error) {
    console.log(`Error fetching reservations: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 予約作成
app.post('/make-server-6f5ce90a/reservations', async (c) => {
  try {
    const data = await c.req.json();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const reservation = {
      id,
      ...data,
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`reservations:${id}`, reservation);
    
    return c.json({ success: true, reservation });
  } catch (error) {
    console.log(`Error creating reservation: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 予約更新
app.put('/make-server-6f5ce90a/reservations/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const existing = await kv.get(`reservations:${id}`);
    if (!existing) {
      return c.json({ success: false, error: '予約が見つかりません' }, 404);
    }
    
    const reservation = {
      ...existing,
      ...data,
      id
    };
    
    await kv.set(`reservations:${id}`, reservation);
    
    return c.json({ success: true, reservation });
  } catch (error) {
    console.log(`Error updating reservation: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 予約削除
app.delete('/make-server-6f5ce90a/reservations/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`reservations:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting reservation: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 拠点一覧取得
app.get('/make-server-6f5ce90a/locations', async (c) => {
  try {
    const locations = await kv.get('locations:list') || [];
    return c.json({ success: true, locations });
  } catch (error) {
    console.log(`Error fetching locations: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 拠点追加
app.post('/make-server-6f5ce90a/locations', async (c) => {
  try {
    const { name } = await c.req.json();
    const locations = await kv.get('locations:list') || [];
    
    if (locations.includes(name)) {
      return c.json({ success: false, error: 'この拠点は既に存在します' }, 400);
    }
    
    locations.push(name);
    await kv.set('locations:list', locations);
    
    return c.json({ success: true, locations });
  } catch (error) {
    console.log(`Error adding location: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 拠点削除
app.delete('/make-server-6f5ce90a/locations/:name', async (c) => {
  try {
    const name = decodeURIComponent(c.req.param('name'));
    const locations = await kv.get('locations:list') || [];
    
    const filtered = locations.filter((loc: string) => loc !== name);
    await kv.set('locations:list', filtered);
    
    return c.json({ success: true, locations: filtered });
  } catch (error) {
    console.log(`Error deleting location: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// スタッフマスター一覧取得
app.get('/make-server-6f5ce90a/staff', async (c) => {
  try {
    const staff = await kv.get('staff:list') || [];
    return c.json({ success: true, staff });
  } catch (error) {
    console.log(`Error fetching staff: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// スタッフマスター追加
app.post('/make-server-6f5ce90a/staff', async (c) => {
  try {
    const { name } = await c.req.json();
    const staff = await kv.get('staff:list') || [];
    
    if (staff.includes(name)) {
      return c.json({ success: false, error: 'このスタッフは既に存在します' }, 400);
    }
    
    staff.push(name);
    await kv.set('staff:list', staff);
    
    return c.json({ success: true, staff });
  } catch (error) {
    console.log(`Error adding staff: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// スタッフマスター削除
app.delete('/make-server-6f5ce90a/staff/:name', async (c) => {
  try {
    const name = decodeURIComponent(c.req.param('name'));
    const staff = await kv.get('staff:list') || [];
    
    const filtered = staff.filter((s: string) => s !== name);
    await kv.set('staff:list', filtered);
    
    return c.json({ success: true, staff: filtered });
  } catch (error) {
    console.log(`Error deleting staff: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 顧客一覧取得
app.get('/make-server-6f5ce90a/customers', async (c) => {
  try {
    const customersData = await kv.getByPrefix('customers:');
    const customers = customersData.map(({ value }) => value);
    
    return c.json({ success: true, customers });
  } catch (error) {
    console.log(`Error fetching customers: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 顧客作成
app.post('/make-server-6f5ce90a/customers', async (c) => {
  try {
    const data = await c.req.json();
    const id = data.customerId;
    
    // 既存チェック
    const existing = await kv.get(`customers:${id}`);
    if (existing) {
      return c.json({ success: false, error: 'この顧客IDは既に使用されています' }, 400);
    }
    
    const customer = {
      customerId: id,
      ...data,
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`customers:${id}`, customer);
    
    return c.json({ success: true, customer });
  } catch (error) {
    console.log(`Error creating customer: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 顧客更新
app.put('/make-server-6f5ce90a/customers/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const existing = await kv.get(`customers:${id}`);
    if (!existing) {
      return c.json({ success: false, error: '顧客が見つかりません' }, 404);
    }
    
    const customer = {
      ...existing,
      ...data,
      customerId: id,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`customers:${id}`, customer);
    
    return c.json({ success: true, customer });
  } catch (error) {
    console.log(`Error updating customer: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 顧客削除
app.delete('/make-server-6f5ce90a/customers/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`customers:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting customer: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
