import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  File as FileIcon,
} from "lucide-react";

export interface Attachment {
  id: string;
  file: File;
  previewUrl: string;
  uploading: boolean;
  uploadedUrl?: string;
  uploadedS3Key?: string;
  uploadedFileName?: string;
  uploadedFileType?: string;
  uploadedFileSize?: number;
  error?: string;
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}

export function isAudioFile(file: File): boolean {
  return file.type.startsWith("audio/");
}

export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function getFileTypeIcon(file: File) {
  if (isImageFile(file)) return FileImage;
  if (isVideoFile(file)) return FileVideo;
  if (isAudioFile(file)) return FileAudio;
  const ext = getFileExtension(file.name);
  const codeExts = new Set([
    "js", "ts", "tsx", "jsx", "py", "rb", "go", "rs", "java",
    "c", "cpp", "h", "css", "html", "json", "xml", "yaml", "yml",
    "toml", "md", "sh", "sql",
  ]);
  const archiveExts = new Set(["zip", "tar", "gz", "rar", "7z", "bz2", "xz"]);
  const spreadsheetExts = new Set(["csv", "xls", "xlsx", "ods"]);
  if (file.type === "application/pdf") return FileText;
  if (codeExts.has(ext)) return FileCode;
  if (archiveExts.has(ext)) return FileArchive;
  if (spreadsheetExts.has(ext)) return FileSpreadsheet;
  if (file.type.startsWith("text/")) return FileText;
  return FileIcon;
}

export function getFileTypeColor(file: File): string {
  if (isImageFile(file)) return "text-emerald-400";
  if (isVideoFile(file)) return "text-purple-400";
  if (isAudioFile(file)) return "text-amber-400";
  const ext = getFileExtension(file.name);
  if (file.type === "application/pdf") return "text-red-400";
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) return "text-orange-400";
  if (["csv", "xls", "xlsx"].includes(ext)) return "text-green-400";
  if (["js", "ts", "tsx", "jsx", "py", "go", "rs"].includes(ext)) return "text-sky-400";
  return "text-[var(--text-muted)]";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface UploadFileParams {
  file: File;
  taskId: string;
  messageId: string;
}

export interface UploadFileResult {
  url: string;
  s3Key: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export async function uploadFile({ file, taskId, messageId }: UploadFileParams): Promise<UploadFileResult | null> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("taskId", taskId);
  formData.append("messageId", messageId);
  try {
    const res = await fetch("/api/feed/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      url: data.url as string,
      s3Key: data.s3Key as string,
      fileName: data.fileName as string,
      fileType: data.fileType as string,
      fileSize: data.fileSize as number,
    };
  } catch {
    return null;
  }
}

export function buildAttachmentMarkdown(attachment: Attachment): string {
  if (!attachment.uploadedUrl) return "";
  if (isImageFile(attachment.file)) {
    return `![image](${attachment.uploadedUrl})`;
  }
  const name = attachment.uploadedFileName || attachment.file.name;
  const size = formatFileSize(attachment.file.size);
  return `[📎 ${name} (${size})](${attachment.uploadedUrl})`;
}
