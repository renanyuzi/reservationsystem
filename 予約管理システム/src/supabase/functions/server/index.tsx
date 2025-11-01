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
    const users = usersData.map((user) => ({
      name: user.name,
      staffId: user.staffId,
      role: user.role
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

// 予約一覧取得（顧客情報を結合）
app.get('/make-server-6f5ce90a/reservations', async (c) => {
  try {
    const reservationsData = await kv.getByPrefix('reservations:');
    
    // 各予約に顧客情報を結合
    const reservations = await Promise.all(
      reservationsData.map(async (reservation) => {
        if (reservation.customerId) {
          const customer = await kv.get(`customers:${reservation.customerId}`);
          return {
            ...reservation,
            customer: customer || null
          };
        }
        return reservation;
      })
    );
    
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
    
    // 顧客情報の処理
    let customerId = data.customerId;
    
    // 顧客IDがない場合は生成
    if (!customerId || customerId.trim() === '') {
      customerId = `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }
    
    // 顧客マスターの作成または更新（個人情報が渡された場合）
    if (data.parentName || data.childName) {
      const existingCustomer = await kv.get(`customers:${customerId}`);
      
      const customerData = {
        customerId,
        parentName: data.parentName || existingCustomer?.parentName || '',
        childName: data.childName || existingCustomer?.childName || '',
        age: data.age !== undefined ? data.age : existingCustomer?.age || 0,
        ageMonths: data.ageMonths !== undefined ? data.ageMonths : existingCustomer?.ageMonths || 0,
        phoneNumber: data.phoneNumber || existingCustomer?.phoneNumber || '',
        address: data.address || existingCustomer?.address || '',
        lineUrl: data.lineUrl || existingCustomer?.lineUrl || '',
        note: data.note || existingCustomer?.note || '',
        paymentStatus: data.paymentStatus || existingCustomer?.paymentStatus || 'unpaid',
        reservationStatus: data.reservationStatus || existingCustomer?.reservationStatus || 'none',
        createdAt: existingCustomer?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await kv.set(`customers:${customerId}`, customerData);
    }
    
    // 予約データの保存（個人情報は含めない）
    const reservation = {
      id,
      date: data.date,
      timeSlot: data.timeSlot,
      duration: data.duration,
      customerId,
      moldCount: data.moldCount,
      paymentStatus: data.paymentStatus || 'unpaid',
      reservationStatus: data.reservationStatus || 'standby',
      location: data.location,
      staffInCharge: data.staffInCharge,
      note: data.reservationNote || data.note || '',
      engravingName: data.engravingName,
      engravingDate: data.engravingDate,
      fontStyle: data.fontStyle,
      deliveryStatus: data.deliveryStatus,
      deliveryMethod: data.deliveryMethod,
      shippingAddress: data.shippingAddress,
      scheduledDeliveryDate: data.scheduledDeliveryDate,
      actualDeliveryDate: data.actualDeliveryDate,
      createdBy: data.createdBy,
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`reservations:${id}`, reservation);
    
    // インセンティブの計上（予約件数 x ¥1,000）
    if (data.staffInCharge && data.date) {
      const incentiveKey = `incentive:${data.staffInCharge}:${data.date}`;
      const existingIncentive = await kv.get(incentiveKey) || { staff: data.staffInCharge, date: data.date, count: 0, amount: 0 };
      
      existingIncentive.count += 1;
      existingIncentive.amount += 1000;
      
      await kv.set(incentiveKey, existingIncentive);
    }
    
    // 顧客情報を結合して返す
    const customer = await kv.get(`customers:${customerId}`);
    const reservationWithCustomer = {
      ...reservation,
      customer
    };
    
    return c.json({ success: true, reservation: reservationWithCustomer });
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
    
    // 顧客マスターの更新（個人情報が渡された場合）
    const customerId = data.customerId || existing.customerId;
    if (customerId && (data.parentName || data.childName || data.phoneNumber || data.address)) {
      const existingCustomer = await kv.get(`customers:${customerId}`);
      
      if (existingCustomer) {
        const updatedCustomer = {
          ...existingCustomer,
          parentName: data.parentName !== undefined ? data.parentName : existingCustomer.parentName,
          childName: data.childName !== undefined ? data.childName : existingCustomer.childName,
          age: data.age !== undefined ? data.age : existingCustomer.age,
          ageMonths: data.ageMonths !== undefined ? data.ageMonths : existingCustomer.ageMonths,
          phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : existingCustomer.phoneNumber,
          address: data.address !== undefined ? data.address : existingCustomer.address,
          lineUrl: data.lineUrl !== undefined ? data.lineUrl : existingCustomer.lineUrl,
          paymentStatus: data.paymentStatus !== undefined ? data.paymentStatus : existingCustomer.paymentStatus,
          reservationStatus: data.reservationStatus !== undefined ? data.reservationStatus : existingCustomer.reservationStatus,
          updatedAt: new Date().toISOString()
        };
        
        await kv.set(`customers:${customerId}`, updatedCustomer);
      }
    }
    
    // インセンティブの再計算（担当者や日付が変更された場合）
    const oldStaff = existing.staffInCharge;
    const oldDate = existing.date;
    const newStaff = data.staffInCharge || oldStaff;
    const newDate = data.date || oldDate;
    
    // 担当者または日付が変更された場合のみインセンティブを再計算
    if (oldStaff !== newStaff || oldDate !== newDate) {
      // 古いインセンティブを減算
      if (oldStaff && oldDate) {
        const oldIncentiveKey = `incentive:${oldStaff}:${oldDate}`;
        const oldIncentive = await kv.get(oldIncentiveKey);
        if (oldIncentive) {
          oldIncentive.count -= 1;
          oldIncentive.amount -= 1000;
          if (oldIncentive.count <= 0) {
            await kv.del(oldIncentiveKey);
          } else {
            await kv.set(oldIncentiveKey, oldIncentive);
          }
        }
      }
      
      // 新しいインセンティブを加算
      if (newStaff && newDate) {
        const newIncentiveKey = `incentive:${newStaff}:${newDate}`;
        const newIncentive = await kv.get(newIncentiveKey) || { staff: newStaff, date: newDate, count: 0, amount: 0 };
        
        newIncentive.count += 1;
        newIncentive.amount += 1000;
        
        await kv.set(newIncentiveKey, newIncentive);
      }
    }
    
    // 予約データの更新（個人情報フィールドを除外）
    const reservation = {
      ...existing,
      date: data.date !== undefined ? data.date : existing.date,
      timeSlot: data.timeSlot !== undefined ? data.timeSlot : existing.timeSlot,
      duration: data.duration !== undefined ? data.duration : existing.duration,
      customerId: customerId,
      moldCount: data.moldCount !== undefined ? data.moldCount : existing.moldCount,
      paymentStatus: data.paymentStatus !== undefined ? data.paymentStatus : existing.paymentStatus,
      reservationStatus: data.reservationStatus !== undefined ? data.reservationStatus : existing.reservationStatus,
      location: data.location !== undefined ? data.location : existing.location,
      staffInCharge: data.staffInCharge !== undefined ? data.staffInCharge : existing.staffInCharge,
      note: data.note !== undefined ? data.note : existing.note,
      engravingName: data.engravingName !== undefined ? data.engravingName : existing.engravingName,
      engravingDate: data.engravingDate !== undefined ? data.engravingDate : existing.engravingDate,
      fontStyle: data.fontStyle !== undefined ? data.fontStyle : existing.fontStyle,
      deliveryStatus: data.deliveryStatus !== undefined ? data.deliveryStatus : existing.deliveryStatus,
      deliveryMethod: data.deliveryMethod !== undefined ? data.deliveryMethod : existing.deliveryMethod,
      shippingAddress: data.shippingAddress !== undefined ? data.shippingAddress : existing.shippingAddress,
      scheduledDeliveryDate: data.scheduledDeliveryDate !== undefined ? data.scheduledDeliveryDate : existing.scheduledDeliveryDate,
      actualDeliveryDate: data.actualDeliveryDate !== undefined ? data.actualDeliveryDate : existing.actualDeliveryDate,
      id,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`reservations:${id}`, reservation);
    
    // 顧客情報を結合して返す
    const customer = await kv.get(`customers:${customerId}`);
    const reservationWithCustomer = {
      ...reservation,
      customer
    };
    
    return c.json({ success: true, reservation: reservationWithCustomer });
  } catch (error) {
    console.log(`Error updating reservation: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 予約削除
app.delete('/make-server-6f5ce90a/reservations/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const existing = await kv.get(`reservations:${id}`);
    
    // インセンティブを減算（予約件数 x ¥1,000）
    if (existing && existing.staffInCharge && existing.date) {
      const incentiveKey = `incentive:${existing.staffInCharge}:${existing.date}`;
      const incentive = await kv.get(incentiveKey);
      if (incentive) {
        incentive.count -= 1;
        incentive.amount -= 1000;
        if (incentive.count <= 0) {
          await kv.del(incentiveKey);
        } else {
          await kv.set(incentiveKey, incentive);
        }
      }
    }
    
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
    const customers = customersData;
    
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
    let id = data.customerId;
    
    // 顧客IDが空の場合は自動生成
    if (!id || id.trim() === '') {
      id = `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }
    
    // 既存チェック
    const existing = await kv.get(`customers:${id}`);
    if (existing) {
      return c.json({ success: false, error: 'この顧客IDは既に使用されています' }, 400);
    }
    
    const customer = {
      customerId: id,
      parentName: data.parentName || '',
      childName: data.childName || '',
      age: data.age || 0,
      ageMonths: data.ageMonths || 0,
      phoneNumber: data.phoneNumber || '',
      address: data.address || '',
      lineUrl: data.lineUrl || '',
      note: data.note || '',
      paymentStatus: data.paymentStatus || 'unpaid',
      reservationStatus: data.reservationStatus || 'none',
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
      parentName: data.parentName !== undefined ? data.parentName : existing.parentName,
      childName: data.childName !== undefined ? data.childName : existing.childName,
      age: data.age !== undefined ? data.age : existing.age,
      ageMonths: data.ageMonths !== undefined ? data.ageMonths : existing.ageMonths,
      phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : existing.phoneNumber,
      address: data.address !== undefined ? data.address : existing.address,
      lineUrl: data.lineUrl !== undefined ? data.lineUrl : existing.lineUrl,
      note: data.note !== undefined ? data.note : existing.note,
      paymentStatus: data.paymentStatus !== undefined ? data.paymentStatus : existing.paymentStatus,
      reservationStatus: data.reservationStatus !== undefined ? data.reservationStatus : existing.reservationStatus,
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

// データマイグレーション: 予約から顧客マスターを生成
app.post('/make-server-6f5ce90a/migrate/reservations-to-customers', async (c) => {
  try {
    const reservationsData = await kv.getByPrefix('reservations:');
    
    let migratedCount = 0;
    let updatedReservations = 0;
    const errors: string[] = [];
    
    for (const reservation of reservationsData) {
      try {
        // 個人情報が含まれている旧形式の予約をチェック
        if (reservation.parentName || reservation.childName) {
          const customerId = reservation.customerId || `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
          
          // 顧客マスターが存在しない場合のみ作成
          const existingCustomer = await kv.get(`customers:${customerId}`);
          if (!existingCustomer) {
            const customerData = {
              customerId,
              parentName: reservation.parentName || '',
              childName: reservation.childName || '',
              age: reservation.age || 0,
              ageMonths: reservation.ageMonths || 0,
              phoneNumber: reservation.phoneNumber || '',
              address: reservation.address || '',
              lineUrl: reservation.lineUrl || '',
              note: reservation.customerNote || '',
              paymentStatus: reservation.paymentStatus || 'unpaid',
              reservationStatus: reservation.reservationStatus || 'none',
              createdAt: reservation.createdAt || new Date().toISOString()
            };
            
            await kv.set(`customers:${customerId}`, customerData);
            migratedCount++;
          }
          
          // 予約から個人情報フィールドを削除
          const cleanedReservation = {
            id: reservation.id,
            date: reservation.date,
            timeSlot: reservation.timeSlot,
            duration: reservation.duration,
            customerId,
            moldCount: reservation.moldCount,
            paymentStatus: reservation.paymentStatus,
            reservationStatus: reservation.reservationStatus,
            location: reservation.location,
            staffInCharge: reservation.staffInCharge,
            note: reservation.note,
            engravingName: reservation.engravingName,
            engravingDate: reservation.engravingDate,
            fontStyle: reservation.fontStyle,
            deliveryStatus: reservation.deliveryStatus,
            deliveryMethod: reservation.deliveryMethod,
            shippingAddress: reservation.shippingAddress,
            scheduledDeliveryDate: reservation.scheduledDeliveryDate,
            actualDeliveryDate: reservation.actualDeliveryDate,
            createdBy: reservation.createdBy,
            createdAt: reservation.createdAt,
            updatedAt: new Date().toISOString()
          };
          
          await kv.set(`reservations:${reservation.id}`, cleanedReservation);
          updatedReservations++;
        }
      } catch (error) {
        errors.push(`予約 ${reservation.id} の処理中にエラー: ${error}`);
      }
    }
    
    return c.json({
      success: true,
      migratedCustomers: migratedCount,
      updatedReservations,
      errors
    });
  } catch (error) {
    console.log(`Error during migration: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
