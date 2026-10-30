# Monster Rush Alpha

Cooperative haunted-mansion arcade combat for 2–4 players, with an offline-capable solo mode.

Play: https://monster-rush-alpha.vercel.app/
Solo: https://monster-rush-alpha.vercel.app/solo
Multiplayer server: https://monster-rush-alpha.onrender.com

## Current build

Four levels: Moonlit Courtyard, Shattered Archives, Blackthorn Manor and Haunted Graveyard. Four classes: Warden (hammer/guard), Riftwalker (bow/dash), Hexkeeper (staff, grimoire, healing and revival), and Revenant (twin blades/Blood Pact). Dark illustrated characters, class-specific actions, a planted Brute gait, tapered Revenant slashes, scrollable character selection with persistent action descriptions and reticle-only aiming.

Three rising waves lead to the Amalgam and nine Wraith reinforcements. A smaller, half-health Amalgam appears after the main boss dies; victory requires clearing every enemy. The Graveyard includes looping gates, grass, skeletal hazards, castle spawning and a one-time main-boss heal.

## Controls

WASD/arrows move. Left mouse attacks. Hold right mouse then release for a charged attack. Space uses the class ability. Hexkeeper can hold E near a fallen connected teammate for three uninterrupted seconds to revive them at 20 HP. Movement, damage, attacks, release, blocked sightlines or loss of range interrupt revival.

Esc opens the exit prompt; F toggles fullscreen/windowed. Escape-only Keyboard Lock is requested where supported; browsers may require permission or reserve Esc to leave fullscreen. The game preserves the exit prompt in that case.

## Hosting and local play

Vercel serves frontend/; Render runs the authoritative Node server. Root config.js is same-origin; prepare-frontend.cjs generates the explicit Render backend origin for static hosting. Preserve the configured CORS allowlist. Node.js 20+ is required for local multiplayer. Run npm start and open http://127.0.0.1:8080; /solo opens solo mode. All game runtime code has no external package dependencies.

## Validation

node test.cjs --simulation-only checks complete two/four-player encounters across all maps. Dedicated tests cover class combat, animations, graveyard gates/hazards, boss phases, authoritative revival and protocol input, menu/reticle controls, fullscreen and Escape handling. See RELEASE-V6.md for release coverage.

Original Canvas slash effects are inspired by jasontomlee's Slash FX; no sprite-pack files are included. See SLASH-REFERENCE.md.

## Selection and healing update

Compact stage carousel lists Lvl 1 : Moonlit Courtyard, Lvl 2 : Shattered Archives, Lvl 3 : Blackthorn Manor and Lvl 4 : Haunted Graveyard. Character cards show Basic Attack, Charged Attack and Special Ability beside the featured hunter.

Revenant Blood Pact now spends its allowance only on actual restored HP and preserves its authoritative multiplayer counter. Floating +HP feedback and the healed-total HUD show successful healing. Activate with Space, then hit enemies during the four-second window; maximum healing remains 12 HP.
