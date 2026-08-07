---
name: HH Goa share persistence
description: Durable storage constraint for generated HH Goa frame share pages.
---

The share page must expose the generated PNG through a stable public URL because X crawlers cannot execute the client app. The current MVP keeps generated shares in API process memory, which is sufficient for an immediate same-process demo but not across restarts.

**Why:** The product's key sharing promise depends on the crawler being able to fetch the image after the user leaves the app, while process memory disappears on restart.

**How to apply:** Before relying on this for a durable public launch, move generated PNG bytes to persistent object storage and retain only a share ID/path lookup in the API layer; keep the browser compositor and no-login flow unchanged.