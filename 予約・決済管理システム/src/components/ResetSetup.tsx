import { Button } from './ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function ResetSetup() {
  const handleReset = () => {
    if (confirm('すべてのローカルデータをクリアして、新しいパスワードでセットアップし直しますか？\n\n注意: これによりログイン情報がクリアされます。')) {
      // LocalStorageをクリア
      localStorage.clear();
      
      // ページをリロード
      window.location.reload();
    }
  };

  return (
    <Alert variant="destructive" className="m-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>重要なお知らせ</AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-sm">
          セキュリティ向上のため、管理職アカウントのパスワードが変更されました。
        </p>
        <p className="text-sm">
          <strong>新しいパスワード:</strong> <code className="bg-gray-100 px-2 py-1 rounded">Manager@2024!Secure</code>
        </p>
        <p className="text-sm text-gray-600">
          古いパスワード（manager123）でログインできない場合は、以下のボタンでリセットしてください。
        </p>
        <Button onClick={handleReset} variant="outline" size="sm">
          セットアップをリセット
        </Button>
      </AlertDescription>
    </Alert>
  );
}
