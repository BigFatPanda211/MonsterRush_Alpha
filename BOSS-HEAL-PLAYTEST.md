# Boss motion and health pickup playtest

Open `solo.html` and choose **Practice stage boss**. Repeat for all four stages.

1. Move around each boss. Gargoyle and Behemoth should now glide as smoothly as Sovereign and Overlord, without side-to-side foot stepping. Their attack windups and effects should still play.
2. Confirm no health item appears when the boss arrives while the hunter has at least 50% health.
3. Let health fall below 50%. A glowing green **P1 HEAL** item should appear nearby, on walkable floor. At exactly 50%, it should not appear yet.
4. Step onto the item. It should restore 35% of the hunter's maximum health, capped at full, and disappear. It must not restore health a second time.
5. Complete the fight and confirm the item does not remain during the cleared state. Start a new fight and confirm the one-time drop is available again if health falls below 50%.
6. In a multiplayer room, each connected player should trigger their own separately labeled P1–P4 item only after their own health falls below 50%. One player must not be able to take another's item. Health changes and used items should agree on all screens after the server update.
7. Check that the health items appear on walkable floor, not inside walls, and that existing boss attack telegraphs and player collision remain intact.

The boss health and attack test scripts cover the four stages; pickup ownership, single use and full-health behavior have an additional automated check.
