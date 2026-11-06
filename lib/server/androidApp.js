// Digital Asset Links for the Android (Play Store) app: tells Android this website owns the app, so the
// app opens full screen without a browser address bar. Served at /.well-known/assetlinks.json.
//
// After the first upload, Play Console → Test and release → App integrity → App signing shows the
// "App signing key certificate" SHA-256. Add it in Vercel as ANDROID_APP_SHA256 (comma-separate several)
// and redeploy; until then only the upload key below is trusted (fine for testing the .apk locally).
export const ANDROID_PACKAGE = 'com.jinshasanam.app';
const UPLOAD_KEY_SHA256 = '77:3E:34:8B:CB:8D:51:59:95:61:06:C0:44:8D:0F:30:D7:46:CF:51:6B:2C:AD:C6:7C:B6:05:1E:8B:67:EB:41';

export function assetLinks() {
  const extra = String(process.env.ANDROID_APP_SHA256 || '').split(/[\s,]+/).map((s) => s.trim().toUpperCase()).filter(Boolean);
  const fingerprints = [...new Set([UPLOAD_KEY_SHA256, ...extra])];
  return [{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: { namespace: 'android_app', package_name: process.env.ANDROID_PACKAGE_NAME || ANDROID_PACKAGE, sha256_cert_fingerprints: fingerprints },
  }];
}

export const getAssetLinks = async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json(assetLinks());
};
