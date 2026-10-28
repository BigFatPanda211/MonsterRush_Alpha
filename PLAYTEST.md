# Multiplayer acceptance checklist

1. Open public URL in two independent browser tabs/devices. Host creates a room; guest enters code. Hunters and P-numbers match. No fighting before host starts; both must be ready.
2. Verify Courtyard/Archives/Manor picker order. Both players move/aim/fire simultaneously. Watch the same enemy lose shared HP and die once; score changes once on both screens.
3. Walk/shoot into walls, doors and furniture on each map. Confirm smooth pursuit and solid collision. Try separate rooms to verify isolation.
4. Check wave counts 8/12/16 and shared four-second breaks. Only living players heal up to 15. Dead players spectate; all dead triggers team defeat. Host/restart returns everyone together with fresh health/score.
5. Test boss health scaling by team size, Ghost batches at 20%/40% loss and nine total; boss+all-Ghosts cleanup before final Wraith. Maximum team score 7500.
6. Refresh one tab during active play within ten seconds. It should rejoin the same actor. Disconnect/close host: controls stop immediately; remaining players continue and host transfers after grace. Expired sessions receive a clear rejoin message.
7. Four players: all four distinct hunters, room-full error for fifth. Everyone shares one world; no friendly fire. New player cannot enter active run.
8. Finish or lose; change hunter while ended, ready up, choose next map/retry. No ghost bullets, duplicated enemies or stale health.
9. Real long-distance play: record ping feel, aim/movement delay, frame rate and disconnect behavior. Check console/runtime logs. Slow host free-plan wakeup is distinct from in-game network delay.

Automated suite passed locally before deployment. Public health, two-client protocol and browser interaction should be recorded separately after deployment. No claim of cross-continent latency validation is made by local tests.
