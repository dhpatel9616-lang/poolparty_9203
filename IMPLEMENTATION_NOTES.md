# Dynamic Open Graph Implementation — PoolParty

## Overview

Implemented dynamic Open Graph (OG) meta tags for three critical viral sharing surfaces:
1. **Pool Share Links** — `/share/[pool-id]`
2. **Template Previews** — `/template/[template-id]`
3. **Group Invites** — `/invite/[invite-code]`

Each route generates dynamic OG images and metadata to maximize clickthrough rates and viral coefficient tracking.

---

## Implementation Details

### 1. Root Layout Update
**File:** `src/app/layout.tsx`
- Added `metadataBase` to root metadata object
- Uses `NEXT_PUBLIC_SITE_URL` environment variable (already set to `https://poolparty3501.builtwithrocket.new`)
- Enables relative URL resolution for all OG tags across the app

### 2. Dynamic Routes

#### Pool Share Route
**File:** `src/app/share/[pool-id]/page.tsx`
- Fetches pool data: title, participant count, pool type
- Generates OG title: `"[Pool Title] — PoolParty"`
- Generates OG description: `"Join [N] players in this [type] pool. Predict outcomes and build your reputation."`
- Calls `/api/og` endpoint for dynamic image generation
- Includes Twitter card metadata for platform-specific rendering

#### Template Preview Route
**File:** `src/app/template/[template-id]/page.tsx`
- Fetches template data: title, subtitle, launch count, participant count, cover image
- Generates OG title: `"[Template Title] — PoolParty Template"`
- Generates OG description: `"[Subtitle] • [N] launches • [M] players"`
- Uses existing cover image if available, falls back to dynamic OG image
- Includes viral coefficient tracking data

#### Group Invite Route
**File:** `src/app/invite/[invite-code]/page.tsx`
- Fetches invite + group data: name, emoji, member count, active pool count
- Generates OG title: `"Join [Group Name] [Emoji] — PoolParty"`
- Generates OG description: `"[Description] • [N] members • [M] active pools"`
- Calls `/api/og` endpoint with group-specific styling
- Optimized for group growth and viral expansion

### 3. Dynamic OG Image Generation
**File:** `src/app/api/og/route.ts`
- Uses Next.js `ImageResponse` API (Vercel OG)
- Generates 1200×630px images for optimal social media display
- Three image templates:
  - **Pool:** Swimmer emoji + pool title + player count
  - **Template:** Template icon + title + launch/player stats
  - **Invite:** Group emoji + group name + member/pool stats
- Dark gradient background (#1a1a2e → #16213e) matches PoolParty brand
- Purple accent color (#7C5CFF) for CTAs and highlights

### 4. Server-Side Supabase Client
**File:** `src/lib/supabase/client.tsx`
- Added `createServerSideClient()` function for use in `generateMetadata`
- Uses `@supabase/supabase-js` for server-side queries
- Disables session persistence (not needed for metadata generation)
- Allows dynamic data fetching at build/request time

---

## SEO & Viral Metrics

### Open Graph Coverage
✅ All three routes include:
- `og:title` (30-40 chars, optimized for social feeds)
- `og:description` (60-80 chars, includes social proof metrics)
- `og:image` (1200×630px, auto-generated or from database)
- `og:url` (canonical URL for each share link)
- `og:type` (website)

### Twitter Card Support
✅ All routes include:
- `twitter:card` (summary_large_image for maximum visibility)
- `twitter:title` (same as OG title)
- `twitter:description` (same as OG description)
- `twitter:image` (same as OG image)

### Viral Coefficient Tracking
- Pool share links include participant count (social proof)
- Template previews include launch count + viral coefficient data
- Group invites include member count (FOMO trigger)
- All metrics dynamically fetched from Supabase at request time

---

## URL Structure

```
https://poolparty3501.builtwithrocket.new/share/[pool-uuid]
https://poolparty3501.builtwithrocket.new/template/[template-uuid]
https://poolparty3501.builtwithrocket.new/invite/[invite-code]
```

Each URL generates unique OG metadata based on the resource ID/code.

---

## Environment Configuration

✅ Already configured in `.env`:
```
NEXT_PUBLIC_SITE_URL=https://poolparty3501.builtwithrocket.new
NEXT_PUBLIC_SUPABASE_URL=[configured]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[configured]
```

No additional environment variables required.

---

## Testing

### Manual Testing
1. Generate a pool share link: `/share/[any-pool-uuid]`
2. Paste into Twitter/Facebook/LinkedIn preview tool
3. Verify OG image, title, and description render correctly

### Social Media Debuggers
- **Facebook:** https://developers.facebook.com/tools/debug/
- **Twitter:** https://cards-dev.twitter.com/validator
- **LinkedIn:** https://www.linkedin.com/post-inspector/

### Metrics to Monitor
- Click-through rate (CTR) on shared links
- Viral coefficient (invites_accepted / invites_sent)
- Group join rate from invite links
- Template clone rate from preview links

---

## Performance Considerations

- **Dynamic metadata generation:** Fetches data at request time (no caching)
- **OG image generation:** Uses Vercel's edge-optimized ImageResponse API
- **Fallback handling:** All routes include error handling with sensible defaults
- **Database queries:** Minimal (single row fetch per request)

---

## Future Enhancements

1. **Caching:** Add ISR (Incremental Static Regeneration) for frequently shared pools
2. **Analytics:** Track OG image impressions via pixel tracking
3. **A/B Testing:** Test different OG descriptions for CTR optimization
4. **Localization:** Generate OG tags in user's preferred language
5. **Rich Media:** Add video previews for pool outcomes

---

## Files Modified/Created

| File | Action | Purpose |
|------|--------|----------|
| `src/app/layout.tsx` | Modified | Added metadataBase |
| `src/app/share/[pool-id]/page.tsx` | Created | Pool share route |
| `src/app/template/[template-id]/page.tsx` | Created | Template preview route |
| `src/app/invite/[invite-code]/page.tsx` | Created | Group invite route |
| `src/app/api/og/route.ts` | Created | OG image generation |
| `src/lib/supabase/client.tsx` | Modified | Added server-side client |

---

## Deployment Notes

- No database migrations required
- No new environment variables needed
- Compatible with Next.js 15.1.11 (current version)
- Requires `next/og` package (included in Next.js)
- Ready for production deployment
