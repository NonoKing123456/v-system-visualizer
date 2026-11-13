# 灰烬誓约 · THE LAST BELL

A compact original third-person action level: arrival court, two sentinels, optional chapel checkpoint, an opening gate and a two-phase Warden. No account or backend is required.

## Real character art

The player and enemies use the credited CC0 Knight by Patch/anymove: one coherent 59,281-triangle skinned mesh, 22 bones, UVs and color/normal/metallic-roughness maps. This is a licensed base asset, not an original sculpture. See assets/ASSET_CREDITS.md. The source has real Idle, Walk, Run and Hit animation. Its unarmed Attack clip is deliberately not used as a sword strike: sword cuts, cleaves and thrusts are authored on its weighted bones and validated against the actual swept blade.

The GLB is loaded from its public immutable source URL (9.71 MB, CORS enabled); the local development server can use assets/knight.glb. First load needs internet. Three.js r128 and GLTFLoader are vendored under the upstream MIT license. No procedural cube/sphere humanoid fallback is used.

## Controls

WASD move; Shift sprint; drag to orbit; wheel zoom. J / left click light chain; K heavy; Space directional dodge; Q lock; L / right click guard; E heal; F interact. Escape pauses; R retries after defeat. Holding guard costs stamina; a timed guard in the first .16 seconds can parry.

## Run and validation

Serve this directory with any static HTTP server. Run `node --test feel.test.cjs play.test.cjs`. The 19 rule/controller tests cover real swept-segment damage, vertical rejection, commitment and buffer windows, guard thresholds, healing interruption, fresh-run persistence and a control-only complete level through both Boss phases. Controller tests use an explicit synthetic sword fixture; the separate 16-case asset validation samples actual GLB bone transforms for three light cuts, heavy, Boss sweep/slam/thrust and both combo windows. Browser QA checks the real render, model loading, controls and contact feedback.

## Files

`game.js` owns the controller and level flow; `feel.js` owns collision/timing; `characters.js` and `motion.js` preserve/import the real mesh and animate its bones; `level.js` owns the environment; `render.js`, `audio.js` and `ui.js` own presentation.
