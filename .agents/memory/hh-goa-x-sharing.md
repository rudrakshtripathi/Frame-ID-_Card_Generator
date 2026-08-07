---
name: HH Goa X sharing
description: Browser popup behavior for the HH Goa frame share flow.
---

For X sharing, the browser window must be opened synchronously inside the user's click/tap handler before the asynchronous image-share request. Navigate that already-open window to the X intent after the API responds, and fall back to same-tab navigation if a popup blocker rejects it.

**Why:** Mobile browsers commonly block windows opened after an async upload, making a successful share API call appear to the user as if Share to X did nothing.

**How to apply:** Keep the share upload and X navigation as two steps: reserve the window on the gesture, then assign the final intent URL only after the share page URL is available.