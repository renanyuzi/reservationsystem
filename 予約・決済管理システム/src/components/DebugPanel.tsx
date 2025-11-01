import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function DebugPanel() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '📌';
    setLogs(prev => [...prev, `${icon} [${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const checkHealth = async () => {
    try {
      addLog('Checking server health...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7a759794/health`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );
      const data = await response.json();
      addLog(`Health check: ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`Health check error: ${error}`);
    }
  };

  const runSetup = async () => {
    setIsLoading(true);
    try {
      addLog('Running setup...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7a759794/setup`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      addLog(`Setup result: ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`Setup error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    try {
      addLog('Testing login with manager/manager123...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7a759794/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: 'manager', password: 'manager123' }),
        }
      );
      const data = await response.json();
      addLog(`Login response [${response.status}]: ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`Login error: ${error}`);
    }
  };

  const checkUsers = async () => {
    try {
      addLog('ユーザーリストを取得中...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7a759794/api/users`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );
      const data = await response.json();
      addLog(`登録済みユーザー数: ${data.length}`, 'success');
      data.forEach((user: any) => {
        addLog(`  - ${user.username} (${user.name}) [${user.role}]`, 'info');
      });
    } catch (error) {
      addLog(`ユーザー取得エラー: ${error}`, 'error');
    }
  };

  const setupManagerOnly = async () => {
    setIsLoading(true);
    setStatus('idle');
    setLogs([]);

    try {
      // 1. Health Check
      addLog('🏥 サーバーヘルスチェック...');
      const healthRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7a759794/health`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      const healthData = await healthRes.json();
      addLog(`サーバー稼働確認: ${healthData.status}`, 'success');

      // 2. Setup Manager
      addLog('👔 管理職アカウントを作成中...');
      const setupRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7a759794/setup-manager`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const setupData = await setupRes.json();
      
      if (!setupRes.ok) {
        addLog(`セットアップエラー: ${JSON.stringify(setupData)}`, 'error');
        setStatus('error');
        return;
      }

      if (setupData.skipped) {
        addLog('管理職アカウントは既に存在しています', 'info');
      } else {
        addLog(`✅ 管理職アカウント作成完了`, 'success');
        addLog(`  • ユーザー名: ${setupData.data.username}`, 'info');
        addLog(`  • パスワード: ${setupData.data.password}`, 'info');
        addLog(`  • 名前: ${setupData.data.name}`, 'info');
        addLog(`  • 検証: ${setupData.verified ? '成功' : '失敗'}`, setupData.verified ? 'success' : 'error');
      }

      // 3. KVストアの書き込み完了を待つ
      addLog('⏳ データベース書き込み完了を待機中... (2秒)', 'info');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 4. Verify Manager
      addLog('👥 管理職アカウントを確認中...');
      const usersRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7a759794/api/users`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      const users = await usersRes.json();
      
      addLog(`データベース内のユーザー数: ${users.length}`, 'info');
      users.forEach((u: any) => {
        addLog(`  - ${u.username} (${u.name})`, 'info');
      });

      const manager = users.find((u: any) => u.username === 'manager');
      if (!manager) {
        addLog('⚠️ 管理職アカウントが見つかりません！', 'error');
        addLog('利用可能なユーザー: ' + users.map((u: any) => u.username).join(', '), 'error');
        setStatus('error');
        return;
      }

      addLog(`✅ 管理職アカウント確認完了: ${manager.name}`, 'success');

      // 5. Test Login
      addLog('🔐 ログインテスト (manager/Manager@2024!Secure)...');
      const loginRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7a759794/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: 'manager', password: 'Manager@2024!Secure' }),
        }
      );
      
      const loginData = await loginRes.json();
      
      if (!loginRes.ok) {
        addLog(`ログインテスト失敗 [${loginRes.status}]`, 'error');
        addLog(`エラー内容: ${JSON.stringify(loginData)}`, 'error');
        if (loginData.debug) {
          addLog(`デバッグ情報:`, 'info');
          addLog(`  - 試行キー: ${loginData.debug.attemptedKey}`, 'info');
          addLog(`  - 利用可能ユーザー: ${loginData.debug.usernames?.join(', ')}`, 'info');
        }
        setStatus('error');
        return;
      }

      addLog(`ログインテスト成功: ${loginData.name}さん`, 'success');

      // 5. Success
      addLog('', 'info');
      addLog('═══════════════════════════════', 'success');
      addLog('✨ 管理職セットアップ完了！', 'success');
      addLog('═══════════════════════════════', 'success');
      addLog('', 'info');
      addLog('📋 ログイン情報:', 'info');
      addLog('ID: manager', 'info');
      addLog('パスワード: Manager@2024!Secure', 'info');
      addLog('', 'info');
      addLog('💡 スタッフアカウントはログイン後、', 'info');
      addLog('   「スタッフ管理」画面から追加できます', 'info');
      
      setStatus('success');

    } catch (error) {
      addLog(`エラー発生: ${error}`, 'error');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const runFullSetup = async () => {
    setIsLoading(true);
    setStatus('idle');
    setLogs([]);

    try {
      // 1. Health Check
      addLog('🏥 サーバーヘルスチェック...');
      const healthRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7a759794/health`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      const healthData = await healthRes.json();
      addLog(`サーバー稼働確認: ${healthData.status}`, 'success');

      // 2. Setup
      addLog('📦 全データをセットアップ中...');
      const setupRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7a759794/setup`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const setupData = await setupRes.json();
      
      if (setupData.skipped) {
        addLog('データは既に存在しています', 'info');
      } else {
        addLog(`セットアップ完了: ${JSON.stringify(setupData.counts)}`, 'success');
      }

      // 3. Verify Users
      await new Promise(resolve => setTimeout(resolve, 500)); // KV書き込み待機
      addLog('👥 ユーザー情報を確認中...');
      const usersRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7a759794/api/users`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      const users = await usersRes.json();
      
      if (users.length === 0) {
        addLog('⚠️ ユーザーが見つかりません！', 'error');
        setStatus('error');
        return;
      }

      addLog(`✅ ${users.length}人のユーザーを確認`, 'success');
      users.forEach((user: any) => {
        addLog(`  • ${user.username} (${user.name}) - ${user.role}`, 'info');
      });

      // 4. Test Login
      addLog('🔐 ログインテスト (manager/manager123)...');
      const loginRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7a759794/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: 'manager', password: 'manager123' }),
        }
      );
      
      if (!loginRes.ok) {
        const error = await loginRes.json();
        addLog(`ログインテスト失敗: ${error.error}`, 'error');
        setStatus('error');
        return;
      }

      const loginData = await loginRes.json();
      addLog(`ログインテスト成功: ${loginData.name}さん`, 'success');

      // 5. Success
      addLog('', 'info');
      addLog('═══════════════════════════════', 'success');
      addLog('✨ セットアップ完了！', 'success');
      addLog('═══════════════════════════════', 'success');
      addLog('', 'info');
      addLog('📋 ログイン情報:', 'info');
      addLog('管理職: manager / manager123', 'info');
      addLog('スタッフ: staff001 / staff001', 'info');
      addLog('スタッフ: staff002 / staff002', 'info');
      addLog('スタッフ: staff003 / staff003', 'info');
      
      setStatus('success');

    } catch (error) {
      addLog(`エラー発生: ${error}`, 'error');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>デバッグパネル</CardTitle>
          {status === 'success' && (
            <CheckCircle className="w-6 h-6 text-green-500" />
          )}
          {status === 'error' && (
            <XCircle className="w-6 h-6 text-red-500" />
          )}
          {isLoading && (
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={setupManagerOnly} 
              size="sm" 
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  作成中...
                </>
              ) : (
                '👔 管理職のみセットアップ'
              )}
            </Button>
            <Button 
              onClick={runFullSetup} 
              size="sm" 
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  セットアップ中...
                </>
              ) : (
                '🚀 全データセットアップ'
              )}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={checkHealth} size="sm" variant="outline">Health Check</Button>
            <Button onClick={runSetup} size="sm" variant="outline" disabled={isLoading}>
              Run Setup
            </Button>
            <Button onClick={testLogin} size="sm" variant="outline">Test Login</Button>
            <Button onClick={checkUsers} size="sm" variant="outline">Check Users</Button>
            <Button onClick={() => setLogs([])} variant="ghost" size="sm">Clear</Button>
            <Button 
              onClick={() => {
                if (confirm('LocalStorageをクリアしてアプリをリセットしますか？')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }} 
              variant="destructive" 
              size="sm"
            >
              Reset All
            </Button>
          </div>
        </div>
        
        <div className="bg-black text-green-400 p-4 rounded font-mono text-xs h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">ログがありません。ボタンをクリックしてテストしてください。</p>
          ) : (
            logs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Project ID:</strong> {projectId}</p>
          <p><strong>Endpoint:</strong> https://{projectId}.supabase.co/functions/v1/make-server-7a759794/</p>
        </div>
      </CardContent>
    </Card>
  );
}
