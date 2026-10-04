'use client';
export default function CookiePrefsLink() {
  if (!process.env.NEXT_PUBLIC_META_PIXEL_ID) return null;
  return <> · <button type="button" className="linklike" onClick={() => window.dispatchEvent(new Event('ep-cookie-prefs'))}>Cookie preferences</button></>;
}
