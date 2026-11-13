# 灰烬誓约 ASHEN VOW

An original third-person dark fantasy combat prototype. All characters, weapons,
ruined architecture and effects are modeled procedurally as actual 3D geometry.
This is a compact single-boss encounter, not an open-world game.

## Play

WASD / arrows: move relative to camera. Shift: sprint. Drag: orbit camera.
Left click / J: light attack. K: heavy attack. Space: dodge roll.
Right click / L: guard. Q: lock target. E: heal. F: rest at embers.
Escape: pause. R: restart after defeat. Touch controls are also included.

Rolling has vulnerable startup and recovery. Shield blocks use stamina and can
break. Attacks, healing and rolls are committed actions. The boss uses windup,
active and recovery phases; at half health it gains faster attacks and a combo.

## Run

Serve this directory with any static web server. There is no backend or account.
Three.js and OrbitControls are vendored from the official r128 release under the
upstream MIT license in vendor/LICENSE.txt. No CDN access is required.

## Validation

Run node --test combat.test.cjs and node --check game.js.
The rules tests cover facing, reach, wrapped angles, dodge protection,
shield stamina and phase-specific attack timing. Browser validation covers
actual rendering and the playable encounter.
