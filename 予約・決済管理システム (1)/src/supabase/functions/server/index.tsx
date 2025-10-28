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
// 初期データセットアップ
// ========================================

// 初期データを設定（初回のみ）
app.post('/make-server-7a759794/setup', async (c) => {
  try {
    // 既にデータが存在するかチェック
    const existingReservations = await kv.getByPrefix('reservation:');
    if (existingReservations.length > 0) {
      return c.json({ success: true, message: 'Data already exists', skipped: true });
    }

    // サンプル拠点
    const locations = [
      { id: '1', name: '東京本店' },
      { id: '2', name: '横浜店' },
      { id: '3', name: '大阪店' },
    ];

    // サンプルスタッフ
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
        moldCount: 2,
        paymentStatus: 'paid',
        location: '東京本店',
        staff: '佐藤',
        notes: '手形・足形セット希望',
      },
      {
        id: '2',
        date: '2025-10-27',
        time: '14:00',
        duration: 30,
        parentName: '田中美咲',
        childName: 'さくら',
        moldCount: 1,
        paymentStatus: 'unpaid',
        location: '横浜店',
        staff: '鈴木',
        notes: '',
      },
      {
        id: '3',
        date: '2025-10-28',
        time: '11:00',
        duration: 45,
        parentName: '佐々木健太',
        childName: 'はると',
        moldCount: 4,
        paymentStatus: 'paid',
        location: '東京本店',
        staff: '高橋',
        notes: '家族全員分',
      },
      {
        id: '4',
        date: '2025-10-29',
        time: '15:30',
        duration: 30,
        parentName: '鈴木真理',
        childName: 'ゆい',
        moldCount: 2,
        paymentStatus: 'unpaid',
        location: '大阪店',
        staff: '佐藤',
        notes: '',
      },
      {
        id: '5',
        date: '2025-10-30',
        time: '10:30',
        duration: 60,
        parentName: '伊藤愛',
        childName: 'りく',
        moldCount: 2,
        paymentStatus: 'paid',
        location: '横浜店',
        staff: '田中',
        notes: '赤ちゃん初めての型取り',
      },
    ];

    // データを保存
    for (const location of locations) {
      await kv.set(`location:${location.id}`, location);
    }

    for (const s of staff) {
      await kv.set(`staff:${s.id}`, s);
    }

    for (const reservation of reservations) {
      await kv.set(`reservation:${reservation.id}`, reservation);
    }

    return c.json({ 
      success: true, 
      message: 'Initial data setup completed',
      counts: {
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
