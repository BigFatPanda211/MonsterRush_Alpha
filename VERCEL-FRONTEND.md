# Static frontend on Vercel, multiplayer backend on Render

LIVE: https://monster-rush-alpha.vercel.app (Vercel production). Multiplayer backend: https://monster-rush-alpha.onrender.com (Render Free). The old Render public link remains working.

Vercel project monster-rush-alpha / prj_dqtU0BLeJro6sMo86sIwC8Ez9Jud is Git-linked to BigFatPanda211/MonsterRush_Alpha, main branch, root frontend/. Production frontend commit: 673130ea925eabc287ed8c81740a4c64dca6c1fe. Render FRONTEND_ORIGINS is configured for the exact canonical Vercel origin. Browser verified two-player create/join/ready/start and server-authoritative Rift Step across the two hosts. Fullscreen retained through multiplayer/solo switches.

The frontend/ directory contains only public static files. config.js points API calls directly to https://monster-rush-alpha.onrender.com. Solo runs in the browser; multiplayer stays authoritative on Render. The persistent shell keeps fullscreen active while switching game frames.

## Publish frontend

1. Import BigFatPanda211/MonsterRush_Alpha into Vercel using your account.
2. Root directory: frontend. Framework: Other. No build command is needed for this prepared directory; publish the root of that directory.
3. After Vercel assigns the production URL, add its exact origin (for example https://your-game.vercel.app) to the Render web service's FRONTEND_ORIGINS environment variable. Multiple approved production/preview origins can be comma-separated. Do not use a wildcard.
4. Redeploy Render. Open the Vercel URL in two browsers, create/join/ready/start, test class abilities, SSE reconnect, solo mode, and fullscreen mode switching.

Regenerate the static package after source changes with node prepare-frontend.cjs. Set MONSTER_BACKEND only if moving the backend; it must be an HTTPS origin. No backend tokens or user secrets belong in frontend files.

## Cost implications

Vercel serves initial code and subsequent solo play, reducing static traffic on Render. Multiplayer snapshots, particles, health and API responses still leave Render and count toward its bandwidth. Splitting hosting does not cap Render bills or improve the US simulation's distance from remote players. The current initial two-player snapshot is about 4.2KB uncompressed; at 30 updates/sec this is roughly 456MB per player-hour before live effects and transport overhead. This is an illustrative traffic estimate, not a billing forecast. Reducing snapshot size/frequency would address the larger multiplayer bandwidth source.

Current references: https://render.com/docs/outbound-bandwidth and https://vercel.com/docs/plans/hobby (personal, non-commercial Hobby use).
