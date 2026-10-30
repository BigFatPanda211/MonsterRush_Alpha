# V6 production release

Publishes the accepted local V6 build for solo and multiplayer. Includes illustrated player/enemy art; class-specific hammer/shield, bow, staff/book and compact blade actions; heavy Brute walking; nine Wraith reinforcements and Lesser Amalgam finale; Hexkeeper E revival at 20 HP; Revenant crescent effects; F fullscreen and Esc exit prompt; three-point hover/focus character help; and removal of player guide lines.

Validated before publishing: full 2/4-player simulations on all four maps, class combat and source-independent native rendering, revival success/interruption and authenticated input, gate/path/health mechanics, menu/mode/reticle checks, and fullscreen Escape/keyboard-lock/fallback event ordering.

Class numeric damage/cooldown tuning is unchanged. Browser-specific fullscreen capture and real cross-continent latency still require playtester feedback.

Release verification also corrected saved-room restoration to use the configured Render API origin for its event stream, matching new-room connections. The regression check covers both split-hosting and same-origin local hosting.
