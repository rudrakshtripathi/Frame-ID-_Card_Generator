import { Storage } from "@google-cloud/storage";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

function getShareObject(id: string) {
  const privateDir = process.env.PRIVATE_OBJECT_DIR?.replace(/^\/+|\/+$/g, "");
  if (!privateDir) {
    throw new Error("PRIVATE_OBJECT_DIR is not configured.");
  }

  const [bucketName, ...prefixParts] = privateDir.split("/");
  if (!bucketName) {
    throw new Error("PRIVATE_OBJECT_DIR does not include a bucket.");
  }

  const objectName = [
    ...prefixParts,
    "hh-goa-shares",
    `${id}.png`,
  ].filter(Boolean).join("/");

  return objectStorageClient.bucket(bucketName).file(objectName);
}

export async function saveShareImage(id: string, image: Buffer): Promise<void> {
  const file = getShareObject(id);
  await file.save(image, {
    resumable: false,
    metadata: {
      contentType: "image/png",
      cacheControl: "public, max-age=31536000, immutable",
    },
  });
}

export async function loadShareImage(id: string): Promise<Buffer | null> {
  const file = getShareObject(id);
  const [exists] = await file.exists();
  if (!exists) return null;

  const [contents] = await file.download();
  return contents;
}

export async function shareImageExists(id: string): Promise<boolean> {
  const file = getShareObject(id);
  const [exists] = await file.exists();
  return exists;
}