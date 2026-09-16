interface ImageAttachment {
  file: File;
  previewUrl: string;
  base64?: string;
}

/** Mirrors server AttachmentInfo / AttachmentResponse (camelCase JSON). */
interface AttachmentInfo {
  url: string;
  mimeType: string;
  originalFilename: string | null;
}

type ChatAttachment = ImageAttachment | AttachmentInfo;

export type { ImageAttachment, AttachmentInfo, ChatAttachment };
