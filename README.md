# Monster Rush Alpha — Shared Hunt

Two-to-four-player cooperative browser game. Create a room, share its six-character code, choose hunters, ready up, and let the host start. Everyone must use the same hosted address. No downloads for joining players.

## Run locally

Node.js 22 recommended. No runtime dependencies. Run `npm start` and open http://127.0.0.1:8080 in two browser tabs. Or double-click play.cmd. Keep the server running while playing. A localhost link cannot be used by a friend on another computer.

## Gameplay

Courtyard → Archives → Manor; three waves of 8/12/16, then boss, health-based Ghost summons and final Wraith. Shared score and authoritative enemy state; separate player health and weapons. No friendly fire. Dead hunters spectate until the next run; surviving teammates can finish. Everyone readies up again, then the host chooses/restarts a map. Survivors receive up to 15 HP between waves; dead hunters do not revive mid-run.

Enemy HP scales with party size at run start: 1.5x for two, 2x for three, 2.5x for four, rounded up. Speeds and damage remain at solo Rising Dread tuning. All four hunters remain cosmetic identities with equal gameplay stats.

Short connection interruptions allow reconnecting for ten seconds. Refreshing the same tab restores its session if still valid. Stale controls stop after 350ms. Lost hosts transfer ownership when leaving or after their grace period. Rooms reject new players during an active run; create a new room for a different team.

## Hosting

Deploy as one Node web service, not a static site. Build: `npm install --ignore-scripts`. Start: `node server.cjs`. Environment: HOST=0.0.0.0 and NODE_VERSION=22. The provider supplies PORT. Health endpoint: /health. A render.yaml is included for the standalone repository.

One running instance owns in-memory rooms. Restart/redeploy clears them; there is no database or durable match recovery. Render free instances sleep when idle and may take about a minute to wake. This is a playtest alpha; latency/balance across continents needs real player testing.

## Tests

`node test.cjs`: two/four-player simulations on all maps, full waves/boss/finale, shared hit/score rules, per-player damage and team defeat, live HTTP/SSE protocol, room capacity/auth/host/readiness/sequence/disconnect rules.

`node client-test.cjs`: actual client room/ready/start/render-state/session-resume/leave logic using live HTTP/SSE with mocked DOM/Canvas. These are not a substitute for a real-browser playtest.

Controls: WASD/arrows move, mouse aims, hold left mouse fires, Escape leaves room. R/N direct you to shared room controls rather than resetting only one client. Client interpolation smooths state at the cost of some visible input delay; prediction/lag compensation and revives are not implemented.

Original approved solo Rising Dread remains available at /solo. Solo source is embedded read-only by the server adapter to preserve its authored game behavior. Net adapters change authority, target selection, scaling, team healing and snapshot ownership.
