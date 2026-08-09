// @ts-nocheck
import fs from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  } catch (err) {
    console.warn("[shareStorage] Failed to initialize Supabase client:", err);
  }
}

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "hh-goa-shares";
const LOCAL_STORAGE_DIR = path.resolve(process.cwd(), ".data", "shares");

async function ensureLocalDir() {
  await fs.mkdir(LOCAL_STORAGE_DIR, { recursive: true });
}

function getLocalPath(id: string): string {
  return path.join(LOCAL_STORAGE_DIR, `${id}.png`);
}

function getFilePath(id: string): string {
  return `${id}.png`;
}

export async function saveShareImage(id: string, image: Buffer): Promise<void> {
  // 1. Instantly save to local disk (< 5ms)
  await ensureLocalDir();
  await fs.writeFile(getLocalPath(id), image);

  // 2. Sync to Supabase asynchronously in the background so it NEVER blocks the user's HTTP request
  if (supabase) {
    // Non-blocking background upload with 3s timeout
    (async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);

        const { error } = await supabase!.storage
          .from(BUCKET)
          .upload(getFilePath(id), image, {
            contentType: "image/png",
            cacheControl: "public, max-age=31536000, immutable",
            upsert: true,
          });

        clearTimeout(timer);
        if (error) {
          console.warn(`[shareStorage] Background Supabase upload warning for ${id}: ${error.message}`);
        }
      } catch (err) {
        // Silently handle background network/timeout issues
      }
    })();
  }
}

export async function loadShareImage(id: string): Promise<Buffer | null> {
  // 1. Read from local disk first (sub-millisecond)
  try {
    return await fs.readFile(getLocalPath(id));
  } catch {
    // Not on local disk
  }

  // 2. Check Supabase if local file is missing
  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .download(getFilePath(id));

      if (!error && data) {
        const buffer = Buffer.from(await data.arrayBuffer());
        await ensureLocalDir().catch(() => {});
        await fs.writeFile(getLocalPath(id), buffer).catch(() => {});
        return buffer;
      }
    } catch {
      // Ignore background download error
    }
  }

  return null;
}

export async function shareImageExists(id: string): Promise<boolean> {
  // 1. Check local disk (sub-millisecond)
  try {
    await fs.access(getLocalPath(id));
    return true;
  } catch {
    // Not on local disk
  }

  // 2. Check Supabase
  if (supabase) {
    try {
      const fileName = getFilePath(id);
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list("", { limit: 1, search: fileName });

      if (!error && data?.some((f) => f.name === fileName)) {
        return true;
      }
    } catch {
      // Ignore error
    }
  }

  return false;
}