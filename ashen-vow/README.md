# 灰烬誓约 ASHEN VOW

An original third-person dark fantasy combat prototype. All characters, weapons,
ruined architecture and effects are modeled procedurally as actual 3D geometry.
This is a compact single-boss encounter, not an open-world game.

## Play

WASD / arrows: move relative to camera. Shift: sprint. Drag: orbit camera.
Left click / J: buffered three-cut light chain. K: heavy attack. Space: dodge roll.
Right click / L: guard. Q: lock target. E: heal. F: rest at embers.
Escape: pause. R: restart after defeat. Touch controls are also included.

Rolling has vulnerable startup and recovery. Shield blocks use stamina and can
break. Attacks, healing and rolls are committed actions. The boss uses windup,
active and recovery phases, including sweeps, overhead cleaves and narrow thrusts;
at half health it gains faster attacks and a two-sweep combo. Heavy attacks build
posture damage; breaking posture opens a committed punish window.

The v4 art pass adds articulated curved armor, forged surface detail, scabbards,
torn cloth and joint-preserving mesh batching. The ruined cloister uses clustered
columns, pointed arcades, broken rose tracery, carved mourners, modeled terrain,
wind-driven flags, weathered paving and a filmic post-process. Sword ribbons use
the actual hilt and tip movement, rather than a detached screen effect.

## Run

Serve this directory with any static web server. There is no backend or account.
Three.js and OrbitControls are vendored from the official r128 release under the
upstream MIT license in vendor/LICENSE.txt. No CDN access is required.

## Validation

Run `node --test combat.test.cjs integration.test.cjs` and `node --check game.js`.
The rules tests cover facing, reach, wrapped angles, dodge protection,
shield stamina and phase-specific attack timing. Browser validation covers
actual rendering and the playable encounter. Integration tests use real Three.js
geometry and a stub renderer to exercise mesh validity, chained inputs, roll
recovery, healing, restart and phase transitions; they do not replace GPU QA.
