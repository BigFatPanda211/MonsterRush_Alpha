# Friends playtest fixes

- Local RTT display samples a health request every 3 seconds. Amber above 120ms; red above 220ms. A stalled snapshot stream stops controls.
- Immediate local movement at 235 units/s with collision-safe replay of recent input and small visual corrections. Server owns hits/health. Prediction is capped at 300ms; this does not remove international latency or add hit rewind.
- Stable P1-P4 labels, YOU tag, slot colours, and in-world player health bars (including teammates with the same hunter).
- Ghost base speed 72, Wraith 116, Brute 46. Navigation approach slowdown is reduced; Wraith windup/dash retained. Layouts and waves retained.
- Hunter selection, room actions and level choice now live in the central hunt screen. Classes remain cosmetic.
- Hold right mouse for at least 0.35s then release: 2 damage, or 4 damage after 1s. Maximum charge 1.2s, recovery 1.25s. Left mouse remains normal fire. Charge cancels on focus loss, menu, death, disconnect or intermission. Server enforces damage/cooldown independently per player.

## Exact next playtest

1. Refresh all clients; create a new room. Pick identical hunters: distinguish everyone by P-number and YOU marker. Ready/start through the central menu.
2. Compare ping across continents. Hold/release WASD, reverse direction and move diagonally: own movement should start immediately, speed should not increase diagonally. Record RTT if correction jumps occur.
3. Push against outer walls, corners and doorframes for 10 seconds. No movement through walls. Stop/reconnect: no stuck movement or firing.
4. Damage each player. Verify their own health bar changes above their character and teammates see the same result. Downed players remain marked.
5. Observe Ghost/Wraith/Brute on open paths and through doors. Wraith should reposition faster and still warn before dashing; Brute stays slow. Check all three maps for navigation regression.
6. Right-click release below 0.35s: no shot. Release at 0.5s: 2 damage. Hold 1s: 4 damage gold bolt. Repeat immediately: cooldown prevents spam. Left fire still works and is suppressed while charging.
7. Charge beside a wall: shot cannot originate across it. Pause/lose focus while charging: no automatic shot on return. Both players charge at once: cooldowns remain independent.
8. Clear three waves/boss/summons/finale with 2 and 4 players; check shared score, heals, readiness after victory, fullscreen dialogs and solo pause.

Automated coverage: full encounter simulations and HTTP/SSE tests; client prediction/RTT/modal tests; charge ownership/damage/cooldown tests; audio and fullscreen/pause checks. Automated rendering uses mocked Canvas. Real cross-continent feel and visual balance require the next friends session.
