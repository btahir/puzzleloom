# Browser considerations

Chromium is the automated acceptance browser. The 22 browser checks exercise downloads, keyboard movement, pointer/touch selection, accessibility, local storage, project files, offline operation after load, and post-load network silence. Safari, Firefox and Edge were not installed or executed.

Implementation choices for portability:

- Real buttons and inputs provide keyboard navigation; crossword arrows do not depend on browser-specific key codes.
- Word search supports two endpoint taps/keyboard selections as well as dragging. `touch-action: none` applies only to the grid. Touch endpoints use the element beneath the released contact.
- PDF export uses an object URL and a native anchor; print uses the generated PDF in an iframe. Some browsers restrict automatic print or multiple simultaneous downloads. Downloading the PDF and printing from the viewer remains available.
- IndexedDB saves report failures instead of claiming persistence. Theme changes still work if localStorage is unavailable.
- Local fonts are loaded before the document is ready; SVG exports embed their font. Unsupported print glyphs produce a clear error.
- Reduced-motion preferences remove animation. The paper remains black on white in either theme.
- Play links use a fragment, so the data is not sent to the web host; unusually long links may exceed some messaging apps’ limits.

Reference pages for future device work: MDN Pointer Events (`https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events`) and Window.print (`https://developer.mozilla.org/en-US/docs/Web/API/Window/print`). Live retrieval of these references was unavailable in this environment; these notes are an implementation review, not a claim of fresh cross-browser research. Physical print, Safari/Firefox behaviour and mobile platform download UX remain owner/device checks.

Development mode is checked separately by `pnpm test:dev`. The worker sends an explicit readiness signal because development bundlers can load worker chunks asynchronously. Next.js local-origin access is scoped to 127.0.0.1; automatic framework agent-file generation is disabled to preserve this repository’s own instructions.
