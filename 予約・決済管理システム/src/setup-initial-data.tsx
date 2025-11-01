/**
 * 初期データセットアップスクリプト
 * このファイルはブラウザのコンソールで実行するか、デバッグパネルから実行します
 */

import { projectId, publicAnonKey } from './utils/supabase/info';

export async function setupInitialData() {
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7a759794`;
  
  console.log('🚀 初期データセットアップを開始します...');
  console.log('📍 Endpoint:', baseUrl);
  
  try {
    // 1. ヘルスチェック
    console.log('\n1️⃣ サーバーヘルスチェック...');
    const healthResponse = await fetch(`${baseUrl}/health`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    });
    const healthData = await healthResponse.json();
    console.log('✅ サーバー稼働中:', healthData);

    // 2. 初期データセットアップ
    console.log('\n2️⃣ 初期データをセットアップ中...');
    const setupResponse = await fetch(`${baseUrl}/setup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const setupData = await setupResponse.json();
    
    if (!setupResponse.ok) {
      console.error('❌ セットアップ失敗:', setupData);
      return { success: false, error: setupData };
    }
    
    console.log('✅ セットアップ完了:', setupData);

    // 3. ユーザー確認（ログイン後のトークンが必要なのでスキップ）
    console.log('\n3️⃣ ユーザー確認をスキップ（認証が必要なため）');

    // 4. ログインテスト
    console.log('\n4️⃣ ログインテスト中...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: 'manager', password: 'ChangeMe123!' })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ ログインテスト失敗:', loginData);
      return { success: false, error: loginData };
    }
    
    console.log('✅ ログインテスト成功:', loginData);

    // 5. 完了
    console.log('\n✨ すべてのセットアップが完了しました！');
    console.log('\n📋 ログイン情報:');
    console.log('─────────────────────────────');
    console.log('管理職:');
    console.log('  ID: manager');
    console.log('  パスワード: ChangeMe123!');
    console.log('  ⚠️ 初回ログイン後、必ずパスワードを変更してください');
    console.log('─────────────────────────────');

    return { 
      success: true, 
      data: { 
        health: healthData,
        setup: setupData,
        login: loginData
      }
    };

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    return { success: false, error: String(error) };
  }
}

// ブラウザコンソールで直接実行可能
if (typeof window !== 'undefined') {
  (window as any).setupInitialData = setupInitialData;
  console.log('💡 ブラウザコンソールで setupInitialData() を実行してください');
}
