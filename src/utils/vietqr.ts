/**
 * VietQR and Vietnamese Banking Utilities
 */

export interface BankInfo {
  code: string;
  name: string;
  shortName: string;
}

export const POPULAR_BANKS: BankInfo[] = [
  { code: 'MB', name: 'Ngân hàng Quân Đội', shortName: 'MB Bank' },
  { code: 'VCB', name: 'Ngân hàng Ngoại Thương Việt Nam', shortName: 'Vietcombank' },
  { code: 'TCB', name: 'Ngân hàng Kỹ Thương', shortName: 'Techcombank' },
  { code: 'BIDV', name: 'Ngân hàng Đầu tư và Phát triển', shortName: 'BIDV' },
  { code: 'CTG', name: 'Ngân hàng Công Thương Việt Nam', shortName: 'VietinBank' },
  { code: 'ACB', name: 'Ngân hàng Á Châu', shortName: 'ACB' },
  { code: 'VPB', name: 'Ngân hàng Việt Nam Thịnh Vượng', shortName: 'VPBank' },
  { code: 'TPB', name: 'Ngân hàng Tiên Phong', shortName: 'TPBank' },
];

/**
 * Generate standard VietQR image link
 */
export function getVietQRUrl(params: {
  bankCode?: string;
  accountNo: string;
  accountName: string;
  amount?: number;
  memo?: string;
}): string {
  const bank = params.bankCode || 'MB';
  const cleanAccount = params.accountNo.replace(/\s+/g, '');
  const cleanName = params.accountName.trim();
  const amt = params.amount && params.amount > 0 ? params.amount : 0;
  const memoText = (params.memo || 'HOC PHI').trim();

  return `https://img.vietqr.io/image/${bank}-${cleanAccount}-compact2.png?amount=${amt}&addInfo=${encodeURIComponent(
    memoText
  )}&accountName=${encodeURIComponent(cleanName)}`;
}
