# データ一元化マイグレーションガイド

## 概要

このシステムは、予約データと顧客データの一元管理を実現するため、データ構造を改善しました。

### 変更前の課題
- 予約レコード（`Reservation`）と顧客レコード（`Customer`）の両方に個人情報（氏名、連絡先など）が重複して保存されていた
- どちらかを更新してももう一方に同期されず、データ不整合のリスクが高かった
- サーバー側でも `reservations:*` と `customers:*` という別キーで同じ情報を保存していた

### 変更後の改善点
- 個人情報は顧客マスター（`customers:*`）に一元化
- 予約レコードは `customerId` のみを保持し、顧客情報を参照
- サーバーAPIは予約取得時に自動的に顧客情報を結合して返す
- データの整合性が保たれ、メンテナンスが容易になった

## 新しいデータ構造

### Reservation（予約）
```typescript
interface Reservation {
  id: string;
  date: string;
  timeSlot: string;
  duration: number;
  customerId: string;  // 顧客IDのみ保持
  moldCount: number;
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  reservationStatus: 'standby' | 'confirmed';
  location: string;
  staffInCharge: string;
  note: string;
  // ... 予約固有の情報のみ
  
  // API取得時に自動結合される
  customer?: Customer;
}
```

### Customer（顧客マスター）
```typescript
interface Customer {
  customerId: string;
  parentName: string;
  childName: string;
  age: number;
  ageMonths: number;
  phoneNumber: string;
  address: string;
  lineUrl: string;
  note: string;
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  reservationStatus: 'standby' | 'confirmed' | 'none';
  createdAt: string;
  updatedAt?: string;
}
```

## マイグレーション手順

### 1. 管理者としてログイン
まず、管理者権限を持つアカウントでシステムにログインしてください。

### 2. 設定画面を開く
サイドバーから「設定」メニューを選択します。

### 3. データ移行タブを選択
設定画面の上部にあるタブから「データ移行」を選択します。

### 4. マイグレーションを実行
「データ移行を実行」ボタンをクリックします。確認ダイアログが表示されるので、内容を確認の上、実行してください。

### 5. 結果を確認
マイグレーション完了後、以下の情報が表示されます：
- 作成された顧客数
- 更新された予約数
- エラーがあった場合はその詳細

## マイグレーションの動作

### 自動処理内容
1. すべての既存予約レコードをスキャン
2. 予約に含まれる個人情報（氏名、連絡先など）を抽出
3. 顧客マスターに統合（既存顧客がいない場合のみ作成）
4. 予約レコードから個人情報フィールドを削除
5. 予約と顧客を`customerId`で紐付け

### データの安全性
- マイグレーション前のデータは削除されません（個人情報フィールドのみクリーンアップ）
- 既存の顧客IDがある場合は重複作成を防ぎます
- エラーが発生した予約は個別にログに記録されます

## 新規予約作成時の動作

### 自動顧客管理
新規予約を作成する際：
1. 顧客IDが指定されていない場合、自動生成されます
2. 個人情報（氏名、連絡先など）が入力された場合、顧客マスターに自動的に保存されます
3. 既存の顧客IDを使用する場合、その顧客情報が自動的にロードされます

### 予約更新時
予約を更新する際：
1. 個人情報を変更すると、顧客マスターも自動的に更新されます
2. 予約固有の情報（日時、拠点など）のみ予約レコードに保存されます

## フロントエンドでの使用方法

### ヘルパー関数の使用
顧客情報を取得する際は、提供されているヘルパー関数を使用してください：

```typescript
import { getCustomerInfo } from '../utils/reservationHelpers';

// 予約から顧客情報を取得
const customerInfo = getCustomerInfo(reservation);
console.log(customerInfo.parentName);  // 親名
console.log(customerInfo.childName);   // 子名
console.log(customerInfo.phoneNumber); // 電話番号
```

### 検索機能
検索時も同様にヘルパー関数を使用：

```typescript
import { getSearchableText } from '../utils/reservationHelpers';

const searchableText = getSearchableText(reservation);
if (searchableText.includes(searchQuery)) {
  // マッチした予約
}
```

## 後方互換性

一定期間、後方互換性のために以下のフィールドが保持されます（非推奨）：
- `reservation.parentName`
- `reservation.childName`
- `reservation.age`
- `reservation.ageMonths`
- `reservation.phoneNumber`
- `reservation.address`
- `reservation.lineUrl`

これらは将来のバージョンで削除される予定です。必ず `getCustomerInfo()` を使用してください。

## トラブルシューティング

### マイグレーションが失敗する
- ブラウザのコンソールでエラーログを確認してください
- ネットワーク接続を確認してください
- 管理者権限があることを確認してください

### 顧客情報が表示されない
- マイグレーションが正常に完了しているか確認してください
- ブラウザをリロードして、最新のデータを取得してください

### データの不整合
- マイグレーションを再実行することで修正される場合があります
- 既存の顧客レコードとの重複がある場合、手動で統合が必要な場合があります

## サポート

問題が解決しない場合は、システム管理者に連絡してください。エラーログとマイグレーション結果を提供すると、トラブルシューティングがスムーズになります。
