/**
 * When the site is opened inside an app (Instagram's link sticker, Facebook,
 * LINE), it asks to move to the phone's own browser
 * (components/heart/OpenInBrowser): an app's browser keeps its own storage and
 * may clear it, so a student's ระบาย chat could be gone when they come back for
 * the answer.
 */
export const browser = {
  title: (name: string) => `เปิดใน ${name} ดีกว่านะ`,
  body: 'จะกลับมาดูคำตอบจากพี่ๆ ได้ง่าย ในแอปนี้แชทอาจหาย',
  open: (name: string) => `เปิดใน ${name}`,
  /** If the button does nothing: the app's own menu (⋯ on iPhone, ⋮ on Android). */
  manual: (dots: string) => `ถ้ากดแล้วไม่เปิด แตะ ${dots} มุมขวาบน แล้วเลือก "เปิดในเบราว์เซอร์ภายนอก"`,
  safari: 'Safari',
  chrome: 'Chrome',
  other: 'เบราว์เซอร์',
} as const;
