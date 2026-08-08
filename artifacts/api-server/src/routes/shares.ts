import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { CreateShareBody, CreateShareResponse } from "@workspace/api-zod";
import { loadShareImage, saveShareImage, shareImageExists } from "../lib/shareStorage";

const router: IRouter = Router();
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

router.post("/shares", async (req, res): Promise<void> => {
  const parsed = CreateShareBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid share payload");
    res.status(400).json({ error: "Please provide a valid generated PNG." });
    return;
  }

  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(
    parsed.data.imageData,
  );
  if (!match) {
    res.status(400).json({ error: "Only PNG data URLs can be shared." });
    return;
  }

  const image = Buffer.from(match[1], "base64");
  const isPng =
    image.length >= 8 &&
    image.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );

  if (!isPng || image.length > MAX_IMAGE_BYTES) {
    res.status(400).json({ error: "The generated image is not a valid PNG." });
    return;
  }

  const id = randomUUID();
  try {
    await saveShareImage(id, image);
    req.log.info({ shareId: id, bytes: image.length }, "Created frame share");
  } catch (error) {
    req.log.error({ err: error, shareId: id }, "Failed to persist frame share");
    res.status(500).json({ error: "We could not prepare the share image. Please try again." });
    return;
  }

  res.status(201).json(
    CreateShareResponse.parse({
      id,
      sharePath: `/s/${id}`,
      imagePath: `/api/shares/${id}/image`,
    }),
  );
});

router.get("/shares/:id/image", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const image = await loadShareImage(id);
    if (!image) {
      res.status(404).json({ error: "Share not found" });
      return;
    }

    res
      .type("png")
      .set("Cache-Control", "public, max-age=31536000, immutable")
      .send(image);
  } catch (error) {
    req.log.error({ err: error, shareId: id }, "Failed to load frame share");
    res.status(500).json({ error: "We could not load this shared frame." });
  }
});

async function renderSharePage(req: Request, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    if (!(await shareImageExists(id))) {
      res
        .status(404)
        .type("html")
        .send(
          "<!doctype html><title>Share not found</title><main><h1>This frame has expired</h1><a href='/'>Make your own HH Goa frame</a></main>",
        );
      return;
    }
  } catch (error) {
    req.log.error({ err: error, shareId: id }, "Failed to find frame share");
    res.status(500).type("html").send("Unable to load this frame right now.");
    return;
  }

  const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || req.protocol;
  const origin = `${protocol}://${req.get("host")}`;
  const imageUrl = `${origin}/api/shares/${encodeURIComponent(id)}/image`;
  const pageUrl = `${origin}/s/${encodeURIComponent(id)}`;
  const title = "I made my HH Goa 2026 builder frame";

  res
    .type("html")
    .set("Cache-Control", "public, max-age=300")
    .send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="A builder frame made for Hackers House Goa 2026.">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="Join the HH Goa builder community.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${escapeHtml(pageUrl)}">
    <meta property="og:image" content="${escapeHtml(imageUrl)}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1000">
    <meta property="og:image:height" content="1000">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
    <style>
      :root { color-scheme: dark; font-family: Inter, system-ui, sans-serif; background: #075c36; color: #fffbe3; }
      body { min-height: 100vh; display: grid; place-items: center; margin: 0; padding: 24px; box-sizing: border-box; }
      main { width: min(520px, 100%); text-align: center; }
      img { display: block; width: min(100%, 440px); margin: 0 auto 28px; border-radius: 22px; box-shadow: 0 24px 70px #003b2380; }
      h1 { font-family: Georgia, serif; font-size: clamp(32px, 8vw, 58px); line-height: .95; margin: 0 0 20px; }
      a { display: inline-flex; background: #ff1493; color: #fff; padding: 14px 20px; border-radius: 999px; font-weight: 800; text-decoration: none; }
    </style>
  </head>
  <body>
    <main>
      <img src="${escapeHtml(imageUrl)}" alt="HH Goa 2026 builder frame">
      <h1>Built in Goa.<br>Made to share.</h1>
      <a href="/">Make your own frame</a>
    </main>
  </body>
</html>`);
}

/*
 * The API is mounted at both /api and / so the crawler-facing /s/:id page
 * and the image endpoint share the same public origin as the web app.
 */

router.get("/shares/:id", renderSharePage);
router.get("/s/:id", renderSharePage);

export default router;