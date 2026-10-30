# Boss motion and health pickup playtest

Open `solo.html` and choose **Practice stage boss**. Repeat for all four stages.

1. Move around each boss. Gargoyle and Behemoth should now glide as smoothly as Sovereign and Overlord, without side-to-side foot stepping. Their attack windups and effects should still play.
2. Confirm a glowing green **P1 HEAL** item appears near the hunter when the boss arrives. At full health, crossing it should leave it available.
3. Take damage, then step onto the item. It should restore 35% of the hunter's maximum health, capped at full, and disappear. It must not restore health a second time.
4. Complete the fight and confirm the item does not remain during the cleared state. Start a new fight and confirm a new item appears.
5. In a multiplayer room, confirm each connected player gets a separately labeled P1–P4 item. One player must not be able to take another's item. Health changes and used items should agree on all screens after the server update.
6. Check that the health items appear on walkable floor, not inside walls, and that existing boss attack telegraphs and player collision remain intact.

The boss health and attack test scripts cover the four stages; pickup ownership, single use and full-health behavior have an additional automated check.
