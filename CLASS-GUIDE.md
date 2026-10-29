# Four hunters: first class build

All classes: 100 HP, movement 235. Left mouse = normal attack; hold right mouse at least 0.35s and release = charged attack; Space = class ability. Full charge at 1s, capped at 1.2s. Charged recovery 1.25s. Abilities and damage are authoritative on the multiplayer server.

| Hunter | Normal | Charged (full) | Space |
| --- | --- | --- | --- |
| Warden | 2 damage, broad 58-unit hammer sweep, 0.55s cooldown | 4 damage, 82-unit slam, heavy knockback | Hold the Line: 2.5s directional protection for nearby allies; 9s cooldown |
| Riftwalker | 1 damage crossbow bolt, 0.18s cooldown | 4 damage piercing bolt, each enemy hit once | Rift Step: up to 100-unit wall-safe dash, 0.3s protection; 4s cooldown |
| Hexkeeper | 1 damage hex, 1.2s slow, 0.4s cooldown | 75-unit rune burst, 3 damage after 0.65s warning | Sanctuary: 85-unit circle for 4s, up to 20 HP per living teammate; 18s cooldown |
| Revenant | 1 damage alternating slash, 50-unit reach, 0.25s cooldown | Up to 70-unit lunge, 3 damage cleave | Blood Pact: heal from damage for 4s, capped at 12 HP; 12s cooldown |

Melee, runes, healing and dashes respect walls. Shields protect the facing direction, not the rear. Healing cannot revive or exceed 100 HP. Duplicate classes are allowed. Player labels and health bars retain slot colours.

## Friends playtest

1. Refresh every client and create a new room. Try a party of all four classes, then duplicate-class parties.
2. Confirm selection cards show shield/hammer, crossbow, book and twin blades. Change hunter: selected-class explanation and in-game instructions must update.
3. Warden: hit several enemies in front, then test an enemy behind. Hold the Line blocks front contact; the rear is vulnerable. Test a teammate standing nearby behind the guard.
4. Riftwalker: pierce two lined-up enemies once each. Dash into walls and corners: no clipping. Check Space cooldown and short protection.
5. Hexkeeper: compare slowed enemy pace. Charge a rune: warning first, burst later. Sanctuary heals living allies within the circle, stops at full health, cannot reach through walls or revive downed players.
6. Revenant: alternate slashes; charge a lunge beside walls. Activate Blood Pact while hurt and compare healing while hitting versus missing. It must stop at the duration/cap.
7. Hold Space: only one activation per press. Spam during cooldown: no reset. Test charge + ability together, death, focus loss, solo pause, multiplayer reconnect, and fresh-run cooldown reset.
8. Clear Courtyard, Archives and Manor through all waves, boss summons and finale. Check score is shared and melee can finish every encounter.
9. Compare melee/ranged survivability at your usual ping. Record class, RTT, wave and remaining HP so we can tune this first balance pass.

Automated checks cover class mechanics and complete 2/4-player encounter simulations on every map. Balance and international latency remain real-player playtests; this is the first class tuning pass.
