# Haunted Graveyard — level 4

World: 960 × 600. Ruined mansion: 200 × 200 at (380,200), solid cover. Sixteen inward-facing gravestones in curved rows, 50 × 34 collision bounds. Six decorative bone/skull piles. Existing levels retain their geometry.

Four diagonal corner lanterns: 720-unit range, approximately 62-degree beams, occluded by graves and the mansion. Four mansion doorway lights: radius 300, collectively illuminating all directions. Light affects visual sightlines and atmosphere; enemy detection and damage are unchanged.

Left/right gates span y=244–356. Top/bottom gates span x=424–536. Players and enemies use paired corridors; other perimeter sections remain solid. Navigation includes the connections; multiplayer actors snap through rather than slide across the arena. Shots expire at the world boundary.

House entrances: (480,178), (480,422), (358,300), (602,300). Wave enemies, boss and Ghost reinforcements can emerge around these entrances subject to safe spacing.

When boss health first reaches 90% or lower, it relocates to the farthest house entrance and channels a visible green tether for 1.5 seconds, then restores full health if alive. It remains damageable, cannot revive, and heals only once per hunt. Existing nine-Ghost limit and final Wraith rules remain.

## Playtest checklist

1. Choose Haunted Graveyard as the fourth menu destination in solo and multiplayer.
2. Cross all four gates in both directions. Check correct exit, unchanged health/class, no wall overlap or repeated wrapping while stationary.
3. Test perimeter outside gate openings, diagonal gate entry and class dash/lunge near edges and graves.
4. Lead every enemy type through gates. Check pursuit and dash recovery without trapping.
5. In multiplayer, watch another player crossing repeatedly. No sliding through the arena; both clients must agree on health, enemies and score.
6. Inspect four corner beams, grave shadows, inward-facing stones, six bone piles and four glowing house entrances. Toggle ambient motion and fullscreen.
7. Keep boss above 90%: no ritual. Cross 90%: one visible 1.5-second ritual and full heal. Cross 90% again: no second heal. Kill during ritual: no resurrection.
8. Clear boss plus all nine Ghosts before the final Wraith appears. Finish the Wraith, retry, and verify the one-time heal resets.
9. Revisit levels 1–3: no wrapping, no house ritual, original props and lighting preserved.

Automated checks cover gate directions, solid perimeter, enemy portal pursuit, one-time house heal, class combat/animation and two/four-player complete encounters across all four maps. Actual remote latency still requires friends' playtests.
