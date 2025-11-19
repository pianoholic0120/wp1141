/**
 * FAQ 規則式回覆服務
 * 處理常見問題的預設回覆，減少 LLM 負擔
 */

import { Locale, t } from '@/lib/i18n';

export interface FAQResponse {
  text: string;
  hasQuickReply?: boolean;
  faqType?: 'purchase' | 'refund' | 'ticketPickup' | 'memberRegistration';
}

/**
 * 購票流程說明（多語言）
 */
export function getPurchaseGuideResponse(locale: Locale = 'zh-TW'): FAQResponse {
  if (locale === 'en-US') {
    return {
      text: `🎫 Opentix Purchase Guide:

1️⃣ Search Events
   Search for events on Opentix website or through me

2️⃣ Select Showtime
   Choose your preferred date and time

3️⃣ Choose Seats
   Select your seats on the seating chart

4️⃣ Fill Information
   Enter purchaser details (name, phone, email)

5️⃣ Payment & Pickup
   • Credit card payment
   • Convenience store pickup (7-11, FamilyMart, Hi-Life, OK)
   • E-ticket

📱 More info: https://www.opentix.life/`,
    };
  }

  return {
    text: `🎫 Opentix 購票流程：

1️⃣ 搜尋演出
   在 Opentix 官網或透過我搜尋您想看的演出

2️⃣ 選擇場次
   點選您想參加的日期與時間

3️⃣ 選擇座位
   在座位圖上選擇您想要的座位

4️⃣ 填寫資料
   輸入購票人資訊（姓名、電話、Email）

5️⃣ 付款取票
   • 信用卡付款
   • 超商取票（7-11、全家、萊爾富、OK）
   • 電子票券

📱 更多資訊：https://www.opentix.life/`,
  };
}

/**
 * 退票政策說明（多語言）
 */
export function getRefundPolicyResponse(locale: Locale = 'zh-TW'): FAQResponse {
  if (locale === 'en-US') {
    return {
      text: `📋 Opentix Refund Policy:

• Refunds must be requested within a certain time before the show (varies by event)
• Refund fees are charged according to each event's policy
• Some events may not offer refunds
• Detailed refund rules are in each event's "Important Notes"

⚠️ Notes:
• Refunds will be processed within 7-14 business days
• E-ticket refunds must be completed within the specified time

📱 More info: https://www.opentix.life/`,
    };
  }

  return {
    text: `📋 Opentix 退票政策：

• 退票需在演出前一定時間內申請（依各節目規定）
• 退票手續費依各節目規定收取
• 部分節目可能不提供退票服務
• 詳細退票規則請參考各節目頁面的「重要須知」

⚠️ 注意事項：
• 退票申請後，款項將於 7-14 個工作天內退回
• 電子票券退票需在指定時間內完成

📱 詳細資訊：https://www.opentix.life/`,
  };
}

/**
 * 取票方式說明（多語言）
 */
export function getTicketPickupResponse(locale: Locale = 'zh-TW'): FAQResponse {
  if (locale === 'en-US') {
    return {
      text: `🎟️ Opentix Ticket Pickup:

1. E-ticket
   • Tickets will be sent to your email after purchase
   • Show the QR code on the day of the event

2. Convenience Store Pickup
   • 7-11, FamilyMart, Hi-Life, OK stores
   • Pick up with your ticket number at the store kiosk
   • Service fee applies

3. On-site Pickup
   • Some venues support on-site pickup
   • Bring ID and purchase confirmation

📱 More info: https://www.opentix.life/`,
    };
  }

  return {
    text: `🎟️ Opentix 取票方式：

1. 電子票券
   • 購票完成後，票券會寄到您的 Email
   • 演出當天出示電子票券 QR Code 即可入場

2. 超商取票
   • 7-11、全家、萊爾富、OK 便利商店
   • 購票完成後，憑取票序號到超商機台取票
   • 需支付手續費

3. 現場取票
   • 部分場館支援現場取票
   • 請攜帶身分證件與購票證明

📱 更多資訊：https://www.opentix.life/`,
  };
}

/**
 * 會員註冊說明（多語言）
 */
export function getMemberRegistrationResponse(locale: Locale = 'zh-TW'): FAQResponse {
  if (locale === 'en-US') {
    return {
      text: `👤 Opentix Member Registration:

1. Go to Opentix website
2. Click "Member Login" → "Register"
3. Fill in basic info (email, password, name, etc.)
4. Complete email verification
5. Start purchasing!

✨ Member Benefits:
• Priority ticket access
• Member-exclusive discounts
• Purchase history

📱 Register now: https://www.opentix.life/login`,
    };
  }

  return {
    text: `👤 Opentix 會員註冊：

1. 前往 Opentix 官網
2. 點選「會員登入」→「註冊」
3. 填寫基本資料（Email、密碼、姓名等）
4. 完成 Email 驗證
5. 開始購票！

✨ 會員優惠：
• 優先購票權
• 會員專屬折扣
• 購票記錄查詢

📱 立即註冊：https://www.opentix.life/login`,
  };
}

/**
 * 檢查是否為常見問題並返回對應回覆（多語言）
 */
export function checkFAQ(message: string, locale: Locale = 'zh-TW'): FAQResponse | null {
  // 移除 emoji 和特殊字符，只保留文字內容
  const cleaned = message
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // 移除 emoji
    .replace(/[🎵📅💳📋🌐❓🔍]/g, '') // 移除特定 emoji
    .trim();
  const q = cleaned.toLowerCase();

  // 購票流程相關
  if (
    q.includes('如何購票') ||
    q.includes('購票流程') ||
    q.includes('怎麼買票') ||
    q.includes('購票步驟') ||
    q.includes('如何買票') ||
    q.includes('how to buy') ||
    q.includes('purchase guide') ||
    q.includes('buy tickets')
  ) {
    const response = getPurchaseGuideResponse(locale);
    return { ...response, faqType: 'purchase' };
  }

  // 退票相關
  if (
    q.includes('退票') ||
    q.includes('退款') ||
    q.includes('退費') ||
    (q.includes('取消') && q.includes('票')) ||
    q.includes('refund') ||
    q.includes('refund policy')
  ) {
    const response = getRefundPolicyResponse(locale);
    return { ...response, faqType: 'refund' };
  }

  // 取票相關
  if (
    q.includes('取票') ||
    q.includes('拿票') ||
    q.includes('領票') ||
    q.includes('電子票') ||
    q.includes('超商取票') ||
    q.includes('ticket pickup') ||
    q.includes('pickup') ||
    q.includes('e-ticket')
  ) {
    const response = getTicketPickupResponse(locale);
    return { ...response, faqType: 'ticketPickup' };
  }

  // 會員相關
  if (
    q.includes('註冊') ||
    q.includes('會員') ||
    q.includes('帳號') ||
    q.includes('登入') ||
    q.includes('登錄') ||
    q.includes('register') ||
    q.includes('member') ||
    q.includes('account') ||
    q.includes('login')
  ) {
    const response = getMemberRegistrationResponse(locale);
    return { ...response, faqType: 'memberRegistration' };
  }

  return null;
}
