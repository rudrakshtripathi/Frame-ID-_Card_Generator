---
name: HH Goa X sharing
description: Browser popup behavior for the HH Goa frame share flow.
---

Create the durable share before any navigation or external share action. On browsers with file sharing, use the Web Share API with the generated PNG `File` so the user can choose X while sending the image itself. On browsers without file sharing, navigate to the X intent only after the share API responds, using the durable share page as the fallback preview.

**Why:** A pre-opened blank tab is confusing and violates the product requirement that the share link exist first. X web intents cannot attach a browser-generated local file, while the device share sheet can pass the actual PNG to X on supported mobile browsers.

**How to apply:** Keep share creation first. Prefer `navigator.share({ files: [pngFile], text, title })`; treat user cancellation as a completed stop, and use the post-creation X intent only as an unsupported-browser fallback.