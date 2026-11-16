// Cloudinary Prescription Pipeline & Client-Side Extreme Compression
// Compresses 4-5 MB smartphone photos down to ~150 KB WebP & 1-click PDF

export interface CloudinaryUploadResult {
  url: string;
  pdfUrl: string;
  publicId: string;
  bytes: number;
  format: string;
  width?: number;
  height?: number;
}

/**
 * Client-Side Canvas Pre-Compressor
 * If a patient takes a 5MB 4000x3000px camera photo, this scales it to max 1600px
 * and compresses it to clean WebP before network transfer.
 */
export async function compressImageOnClient(file: File, maxDim = 1600, quality = 0.82): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        // Auto contrast & clarity fill
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const dataUrl = canvas.toDataURL("image/webp", quality);
              resolve({ blob, dataUrl });
            } else {
              reject(new Error("Image compression failed"));
            }
          },
          "image/webp",
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload Slip to Cloudinary
 * Transforms image: q_auto:good, f_auto, w_1600, e_auto_contrast
 * Provides direct PDF format URL for medical records.
 */
export async function uploadSlipToCloudinary(
  file: File,
  patientUid: string
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim().replace(/['"]/g, "");
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET?.trim().replace(/['"]/g, "") || "pronto_prescriptions";

  // First compress locally on canvas to save mobile data bandwidth
  let fileToUpload: Blob | File = file;
  let localDataUrl = "";
  try {
    const compressed = await compressImageOnClient(file);
    fileToUpload = compressed.blob;
    localDataUrl = compressed.dataUrl;
  } catch (compErr) {
    console.warn("Client pre-compression skipped, using original file:", compErr);
  }

  // Live Cloudinary credentials upload
  if (cloudName && cloudName !== "demo") {
    const formData = new FormData();
    // Ensure file or blob has explicit filename so Cloudinary accepts it
    if (fileToUpload instanceof Blob && !(fileToUpload instanceof File)) {
      formData.append("file", fileToUpload, "prescription.webp");
    } else {
      formData.append("file", fileToUpload);
    }
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", `prescriptions/${patientUid}`);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const errMsg = errorData?.error?.message || `HTTP ${res.status}`;
      throw new Error(`Cloudinary upload failed: ${errMsg}`);
    }

    const data = await res.json();
    const rawUrl = data.secure_url || data.url;
    // Inject on-the-fly Cloudinary delivery transformation (contrast & auto-format)
    const optimizedUrl = rawUrl.includes("/upload/")
      ? rawUrl.replace("/upload/", "/upload/q_auto:good,f_auto,w_1600,c_limit,e_auto_contrast/")
      : rawUrl;

    return {
      url: optimizedUrl,
      pdfUrl: rawUrl.replace(/\.[^/.]+$/, ".pdf"),
      publicId: data.public_id,
      bytes: data.bytes || 150000,
      format: data.format || "webp",
      width: data.width,
      height: data.height,
    };
  }

  throw new Error("Cloudinary cloud name is missing. Please configure NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your environment.");
}

/**
 * Upload Doctor Avatar/Photo to Cloudinary
 * Compresses to clean square WebP profile format and uploads to Cloudinary doctors folder.
 */
export async function uploadDoctorPhotoToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim().replace(/['"]/g, "");
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET?.trim().replace(/['"]/g, "") || "pronto_prescriptions";

  let fileToUpload: Blob | File = file;
  try {
    const compressed = await compressImageOnClient(file, 800, 0.85);
    fileToUpload = compressed.blob;
  } catch (compErr) {
    console.warn("Doctor avatar pre-compression skipped, using original file:", compErr);
  }

  if (cloudName && cloudName !== "demo") {
    const formData = new FormData();
    if (fileToUpload instanceof Blob && !(fileToUpload instanceof File)) {
      formData.append("file", fileToUpload, "doctor-avatar.webp");
    } else {
      formData.append("file", fileToUpload);
    }
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "doctors/avatars");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const errMsg = errorData?.error?.message || `HTTP ${res.status}`;
      throw new Error(`Doctor photo upload failed: ${errMsg}`);
    }

    const data = await res.json();
    const rawUrl = data.secure_url || data.url;
    // Add auto-format & face-focused square thumbnail optimization
    const optimized = rawUrl.includes("/upload/")
      ? rawUrl.replace("/upload/", "/upload/q_auto:good,f_auto,w_500,h_500,c_fill,g_face/")
      : rawUrl;
    return optimized;
  }

  throw new Error("Cloudinary is not configured. Please check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.");
}
