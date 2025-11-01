import { Reservation } from '../types';

/**
 * 予約から顧客情報を取得する
 * 顧客マスターと結合されている場合はそちらを優先、
 * 後方互換性のため予約に直接含まれている場合もサポート
 */
export function getCustomerInfo(reservation: Reservation) {
  const customer = reservation.customer;
  
  return {
    parentName: customer?.parentName || reservation.parentName || '',
    childName: customer?.childName || reservation.childName || '',
    age: customer?.age ?? reservation.age ?? 0,
    ageMonths: customer?.ageMonths ?? reservation.ageMonths ?? 0,
    phoneNumber: customer?.phoneNumber || reservation.phoneNumber || '',
    address: customer?.address || reservation.address || '',
    lineUrl: customer?.lineUrl || reservation.lineUrl || '',
    customerId: reservation.customerId || '',
  };
}

/**
 * 予約データから顧客情報を含むフル情報を取得
 */
export function getFullReservationInfo(reservation: Reservation) {
  const customerInfo = getCustomerInfo(reservation);
  
  return {
    ...reservation,
    ...customerInfo,
  };
}

/**
 * 検索用のテキストを生成
 */
export function getSearchableText(reservation: Reservation): string {
  const customerInfo = getCustomerInfo(reservation);
  
  return [
    customerInfo.parentName,
    customerInfo.childName,
    customerInfo.customerId,
    reservation.location,
    reservation.staffInCharge,
    reservation.note,
    reservation.id,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}
