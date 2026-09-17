import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

export function isCloudinaryConfigured(): boolean {
  return Boolean(cloudName && apiKey && apiSecret);
}

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export { cloudinary };

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
};

export async function uploadImageBuffer(
  buffer: Buffer,
  options?: {
    folder?: string;
    publicId?: string;
    mimeType?: string;
  },
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    throw Object.assign(
      new Error(
        "Chưa cấu hình Cloudinary (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET)",
      ),
      { status: 503 },
    );
  }

  const folder =
    options?.folder ||
    process.env.CLOUDINARY_FOLDER?.trim() ||
    "ticket3";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        ...(options?.publicId ? { public_id: options.publicId } : {}),
      },
      (err, result) => {
        if (err || !result) {
          reject(
            Object.assign(
              new Error(err?.message || "Upload Cloudinary thất bại"),
              { status: 502 },
            ),
          );
          return;
        }
        resolve({
          url: result.secure_url || result.url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );
    stream.end(buffer);
  });
}
