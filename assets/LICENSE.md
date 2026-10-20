# Guitar recording credits and licence

The audio recordings bundled in `guitar-acoustic.js` and `guitar-electric.js` are from
[tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments), curated and
edited by N. P. Brosowsky and contributors. The upstream project licenses its samples
under [Creative Commons Attribution 3.0 Unported (CC BY 3.0)](https://creativecommons.org/licenses/by/3.0/).
This notice concerns the recordings, independently of the project's source code.

Original recording sources, as identified by the upstream sample-source-info.txt:

- Acoustic guitar: [University of Iowa Electronic Music Studios](https://theremin.music.uiowa.edu/).
- Clean electric guitar: [Karoryfer Samples](https://www.karoryfer.com/karoryfer-samples).

Upstream revision: `622c2f1c32c8cfce4158ddc3eb26e518ddef37e5`.

- [Sample licence declaration](https://github.com/nbrosowsky/tonejs-instruments/blob/622c2f1c32c8cfce4158ddc3eb26e518ddef37e5/README.md#license)
- [Original source inventory](https://github.com/nbrosowsky/tonejs-instruments/blob/622c2f1c32c8cfce4158ddc3eb26e518ddef37e5/sample-source-info.txt)
- [Acoustic sample folder](https://github.com/nbrosowsky/tonejs-instruments/tree/622c2f1c32c8cfce4158ddc3eb26e518ddef37e5/samples/guitar-acoustic)
- [Electric sample folder](https://github.com/nbrosowsky/tonejs-instruments/tree/622c2f1c32c8cfce4158ddc3eb26e518ddef37e5/samples/guitar-electric)

Changes in this distribution: removed leading silence, limited each recording to
4.5 seconds, converted to mono 44.1 kHz MP3 at 128 kbit/s, and stored the resulting
MP3 bytes as base64 inside local JavaScript data packs to support direct `file://`
use. Playback transposes the nearest recorded note where needed and fades its tail.
No endorsement by the recording authors or upstream contributors is implied.

Bundled notes (scientific pitch notation; C4 = MIDI 60):

- Acoustic: every semitone from E2 (40) through D5 (74), 35 recordings.
- Electric: E2, F♯2, A2, C3, D♯3, F♯3, A3, C4, D♯4, F♯4, A4, C5,
  D♯5, F♯5, A5, C6, 16 recordings.
