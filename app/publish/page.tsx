"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { sha256 } from "ethers";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useWallet } from "@/hooks/useWallet";
import {
  canonicalizePublicationContent,
  createPublication,
  getPublications,
  verifyPublicationContent,
  scrapePublicationSource,
  type PublicationStatus,
} from "@/lib/api-client";

type ContentType = "text" | "article" | "code" | "document" | "image" | "audio" | "video";

const DEFAULT_MAX_CANONICALIZED_PREVIEW_BYTES = 120_000;
const MAX_CANONICALIZED_PREVIEW_BYTES_BY_TYPE: Partial<Record<ContentType, number>> = {
  audio: 20 * 1024 * 1024,
  video: 50 * 1024 * 1024,
};

const MAX_EMBED_FILE_SIZE_BY_TYPE: Partial<Record<ContentType, number>> = {
  code: 8 * 1024 * 1024,
  document: 24 * 1024 * 1024,
  image: 24 * 1024 * 1024,
  audio: 500 * 1024 * 1024,
  video: 1024 * 1024 * 1024,
};

const CODE_EXTENSIONS = new Set([
  ".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".c", ".cpp", ".h", ".hpp", ".cs", ".go", ".rs", ".php", ".rb", ".sol", ".json", ".xml", ".html", ".css", ".scss", ".sh", ".bat", ".ps1", ".md",
]);

const DOCUMENT_EXTENSIONS = new Set([
  ".pdf", ".doc", ".docx", ".txt", ".md", ".rtf", ".odt",
]);

const IMAGE_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".tiff", ".ico", ".avif",
]);

const VIDEO_EXTENSIONS = new Set([
  ".mp4", ".webm", ".mov", ".mkv", ".avi", ".wmv", ".m4v", ".mpeg", ".mpg", ".3gp",
]);

const EXTENSION_MIME_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".tiff": "image/tiff",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
  ".wmv": "video/x-ms-wmv",
  ".m4v": "video/x-m4v",
  ".mpeg": "video/mpeg",
  ".mpg": "video/mpeg",
  ".3gp": "video/3gpp",
};

function resolveMimeType(file: File): string {
  const existing = (file.type || "").trim().toLowerCase();
  if (existing) return existing;
  const extension = getFileExtension(file.name);
  return EXTENSION_MIME_MAP[extension] || "application/octet-stream";
}

async function computeSha256Hex(bytes: ArrayBuffer): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (subtle?.digest) {
    const hashBuffer = await subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hashBuffer))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }

  // Fallback for browsers where Web Crypto is unavailable.
  const digestWithPrefix = sha256(new Uint8Array(bytes));
  return digestWithPrefix.startsWith("0x") ? digestWithPrefix.slice(2) : digestWithPrefix;
}

function formatFileSize(value: number): string {
  if (value >= 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(value / 1024))} KB`;
}

function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".");
  if (index === -1) return "";
  return fileName.slice(index).toLowerCase();
}

function isFileAllowedForContentType(file: File, selectedType: ContentType): boolean {
  const mime = (file.type || "").toLowerCase();
  const extension = getFileExtension(file.name);

  if (selectedType === "code") {
    return CODE_EXTENSIONS.has(extension)
      || mime.startsWith("text/")
      || mime.includes("javascript")
      || mime.includes("json")
      || mime.includes("xml")
      || mime.includes("x-python");
  }

  if (selectedType === "document") {
    return DOCUMENT_EXTENSIONS.has(extension)
      || mime === "application/pdf"
      || mime === "application/msword"
      || mime.includes("officedocument.wordprocessingml.document")
      || mime === "text/markdown"
      || mime.startsWith("text/");
  }

  if (selectedType === "image") {
    return mime.startsWith("image/") || IMAGE_EXTENSIONS.has(extension);
  }

  if (selectedType === "audio") {
    return mime.startsWith("audio/");
  }

  if (selectedType === "video") {
    return mime.startsWith("video/") || VIDEO_EXTENSIONS.has(extension);
  }

  return true;
}

function parseContentType(value: string): ContentType | null {
  const normalized = value.toLowerCase();
  if (
    normalized === "text"
    || normalized === "article"
    || normalized === "code"
    || normalized === "document"
    || normalized === "image"
    || normalized === "audio"
    || normalized === "video"
  ) {
    return normalized as ContentType;
  }

  return null;
}

function PublishingOverlay() {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/30 bg-black/70 px-7 py-6">
        <div
          className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white"
          role="status"
          aria-label="Publishing in progress"
        />
        <p className="text-sm font-bold text-white">Publishing in progress...</p>
        <p className="text-xs text-gray-300">Please wait and do not close this page.</p>
      </div>
    </div>
  );
}

export default function PublishPage() {
  const { isConnected, address, isLoading } = useWallet();
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastAppliedParentPrefillRef = useRef("");
  
  const [title, setTitle] = useState("");
  const [hasFilledTitleBefore, setHasFilledTitleBefore] = useState(false);
  const [content, setContent] = useState("");
  const [filePayload, setFilePayload] = useState("");
  const [contentType, setContentType] = useState<ContentType>("text");
  const [sourceUrl, setSourceUrl] = useState("");
  const [parentHash, setParentHash] = useState("");
  const [availableParentHashes, setAvailableParentHashes] = useState<string[]>([]);
  const [parentHashTypeLookup, setParentHashTypeLookup] = useState<Record<string, string>>({});
  const [parentHashHasChildLookup, setParentHashHasChildLookup] = useState<Record<string, boolean>>({});
  const [isValidatingParentHash, setIsValidatingParentHash] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadWarning, setUploadWarning] = useState("");
  
  const [isSigning, setIsSigning] = useState(false);
  const [isScrapingArticle, setIsScrapingArticle] = useState(false);
  const [publicationStatus, setPublicationStatus] = useState<PublicationStatus | null>(null);
  const [canonicalizedContent, setCanonicalizedContent] = useState("");
  const [computedHash, setComputedHash] = useState("");
  const [duplicatePublicationId, setDuplicatePublicationId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [txHash, setTxHash] = useState("");
  const [blockTimestamp, setBlockTimestamp] = useState("");
  const [publicationId, setPublicationId] = useState("");
  const [error, setError] = useState("");

  const supportsFileUpload = contentType === "code" || contentType === "document" || contentType === "image" || contentType === "audio" || contentType === "video";
  const isCodeType = contentType === "code";
  const isContentReadOnly = supportsFileUpload;
  const isContentOptional = contentType === "document" || contentType === "image" || contentType === "audio" || contentType === "video";
  const hasCodeText = content.trim().length > 0;
  const hasCodeFile = uploadedFileName.trim().length > 0;
  const isCodeInputValid = !isCodeType || hasCodeFile || hasCodeText;
  const fileAccept =
    contentType === "code"
      ? ".js,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.h,.hpp,.cs,.go,.rs,.php,.rb,.sol,.json,.xml,.html,.css,.scss,.sh,.bat,.ps1,.md,text/plain,text/javascript,application/javascript,text/x-python"
      : contentType === "document"
      ? ".pdf,.doc,.docx,.txt,.md,.rtf,.odt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
      : contentType === "image"
        ? "image/*"
        : contentType === "audio"
          ? "audio/*"
          : contentType === "video"
            ? "video/*"
            : undefined;
  const acceptedFormatsLabel =
    contentType === "code"
      ? ".js, .ts, .jsx, .tsx, .py, .java, .c, .cpp, .h, .hpp, .cs, .go, .rs, .php, .rb, .sol, .json, .xml, .html, .css, .scss, .sh, .bat, .ps1, .md"
      : contentType === "document"
        ? ".pdf, .doc, .docx, .txt, .md, .rtf, .odt"
        : contentType === "image"
          ? "Any image format (e.g. .png, .jpg, .jpeg, .gif, .webp, .svg)"
          : contentType === "audio"
            ? "Any audio format (e.g. .mp3, .wav, .ogg, .m4a, .flac)"
            : contentType === "video"
              ? "Any video format (e.g. .mp4, .webm, .mov, .mkv)"
              : "";
  const uploadSizeLimitText = MAX_EMBED_FILE_SIZE_BY_TYPE[contentType]
    ? `Max file size: ${formatFileSize(MAX_EMBED_FILE_SIZE_BY_TYPE[contentType] as number)}`
    : "";
  const parentHashFromQuery = (searchParams.get("parent") || "").trim();

  useEffect(() => {
    let isMounted = true;

    const loadParentHashSuggestions = async () => {
      if (!address) {
        setAvailableParentHashes([]);
        return;
      }

      try {
        const data = await getPublications({ wallet: address, limit: 100 });
        if (!isMounted) {
          return;
        }

        const nextLookup: Record<string, string> = {};
        const nextHasChildLookup: Record<string, boolean> = {};
        const uniqueHashes = Array.from(
          new Set(
            (data.publications || [])
              .map((publication) => {
                const normalizedHash = publication.contentHash?.toLowerCase();
                if (!normalizedHash) return null;
                nextLookup[normalizedHash] = publication.contentType;
                if (publication.parentHash) {
                  nextHasChildLookup[publication.parentHash.toLowerCase()] = true;
                }
                return publication.contentHash;
              })
              .filter((hash): hash is string => Boolean(hash))
          )
        );

        setAvailableParentHashes(uniqueHashes);
        setParentHashTypeLookup(nextLookup);
        setParentHashHasChildLookup(nextHasChildLookup);
      } catch {
        if (isMounted) {
          setAvailableParentHashes([]);
          setParentHashTypeLookup({});
          setParentHashHasChildLookup({});
        }
      }
    };

    loadParentHashSuggestions();

    return () => {
      isMounted = false;
    };
  }, [address, publicationId]);

  const filteredParentHashSuggestions = useMemo(() => {
    const needle = parentHash.trim().toLowerCase();
    const hashes = availableParentHashes.filter((hash) => hash !== computedHash);

    if (!needle) {
      return hashes.slice(0, 8);
    }

    return hashes
      .filter((hash) => hash.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [availableParentHashes, parentHash, computedHash]);

  const normalizeHash = (value: string): string => value.trim().toLowerCase();

  const resolveParentHashType = async (hashValue: string): Promise<string | null> => {
    const normalizedHash = normalizeHash(hashValue);
    if (!normalizedHash) {
      return null;
    }

    const cachedType = parentHashTypeLookup[normalizedHash];
    if (cachedType) {
      return cachedType;
    }

    const data = await getPublications({ search: normalizedHash, limit: 50 });
    const exactMatch = (data.publications || []).find(
      (publication) => publication.contentHash.toLowerCase() === normalizedHash
    );

    if (!exactMatch) {
      return null;
    }

    setParentHashTypeLookup((current) => ({
      ...current,
      [normalizedHash]: exactMatch.contentType,
    }));

    return exactMatch.contentType;
  };

  const resolveParentHashHasChild = async (hashValue: string): Promise<boolean> => {
    const normalizedHash = normalizeHash(hashValue);
    if (!normalizedHash) {
      return false;
    }

    if (normalizedHash in parentHashHasChildLookup) {
      return Boolean(parentHashHasChildLookup[normalizedHash]);
    }

    if (!address) {
      return false;
    }

    const data = await getPublications({ wallet: address, limit: 100 });
    const nextHasChildLookup: Record<string, boolean> = {};

    for (const publication of data.publications || []) {
      if (publication.parentHash) {
        nextHasChildLookup[publication.parentHash.toLowerCase()] = true;
      }
    }

    setParentHashHasChildLookup((current) => ({ ...current, ...nextHasChildLookup }));

    return Boolean(nextHasChildLookup[normalizedHash]);
  };

  useEffect(() => {
    let isMounted = true;

    const applyParentPrefill = async () => {
      if (!parentHashFromQuery) {
        return;
      }

      const normalizedHash = normalizeHash(parentHashFromQuery);
      if (lastAppliedParentPrefillRef.current !== normalizedHash) {
        lastAppliedParentPrefillRef.current = normalizedHash;
        setParentHash(parentHashFromQuery);
      }

      const cachedType = parentHashTypeLookup[normalizedHash];
      if (cachedType) {
        const parsedType = parseContentType(cachedType);
        if (parsedType) {
          setContentType(parsedType);
        }
        return;
      }

      try {
        const data = await getPublications({ search: normalizedHash, limit: 50 });
        if (!isMounted) {
          return;
        }

        const exactMatch = (data.publications || []).find(
          (publication) => publication.contentHash.toLowerCase() === normalizedHash
        );

        if (!exactMatch) {
          return;
        }

        setParentHashTypeLookup((current) => ({
          ...current,
          [normalizedHash]: exactMatch.contentType,
        }));

        const parsedType = parseContentType(exactMatch.contentType);
        if (parsedType) {
          setContentType(parsedType);
        }
      } catch {
        // Keep silent fallback: prefill hash even if type lookup fails.
      }
    };

    void applyParentPrefill();

    return () => {
      isMounted = false;
    };
  }, [parentHashFromQuery, parentHashTypeLookup]);

  const handlePreview = async () => {
    setError("");

    if (!isCodeInputValid) {
      setError("For code type, upload a code file first");
      return;
    }

    try {
      const canonicalizationInput = supportsFileUpload ? filePayload : content;
      if (!canonicalizationInput.trim()) {
        throw new Error("No content available to canonicalize");
      }

      const data = await canonicalizePublicationContent(canonicalizationInput);

      setCanonicalizedContent(data.canonicalizedContent);
      setComputedHash(data.contentHash);
      setDuplicatePublicationId(null);

      const duplicateCheck = await verifyPublicationContent({ contentHash: data.contentHash });
      if (duplicateCheck.matched && duplicateCheck.matches.length > 0) {
        setDuplicatePublicationId(duplicateCheck.matches[0].publicationId);
        setError(`Duplicate content detected: hash already exists in publication #${duplicateCheck.matches[0].publicationId}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to canonicalize content");
    }
  };

  const handleSignAndRegister = async () => {
    setError("");

    if (!isCodeInputValid) {
      setError("For code type, upload a code file first");
      return;
    }

    if (duplicatePublicationId) {
      setError(`Duplicate content detected. Existing publication #${duplicatePublicationId} already uses this hash.`);
      return;
    }

    if (parentHash.trim()) {
      try {
        setIsValidatingParentHash(true);
        const parentType = await resolveParentHashType(parentHash);
        if (!parentType) {
          setError("Parent hash not found. Please pick a valid parent hash or clear the field.");
          return;
        }

        if (parentType.toLowerCase() !== contentType.toLowerCase()) {
          setError(`Parent hash type is \"${parentType}\" but current content type is \"${contentType}\". Change content type to match before signing.`);
          return;
        }

        const parentAlreadyHasChild = await resolveParentHashHasChild(parentHash);
        if (parentAlreadyHasChild) {
          setError("Parent hash already has a child version. Choose another parent hash or clear the parent field.");
          return;
        }
      } catch {
        setError("Failed to validate parent hash. Please try again.");
        return;
      } finally {
        setIsValidatingParentHash(false);
      }
    }

    if (!computedHash) {
      setError("Please preview canonicalized content first");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmPublish = async () => {
    setShowConfirmModal(false);
    setIsSigning(true);
    setError("");

    try {
      if (!address) {
        throw new Error("Wallet is not connected");
      }

      const data = await createPublication({
        title,
        contentType,
        canonicalizedContent,
        contentHash: computedHash,
        sourceUrl: sourceUrl || undefined,
        parentHash: parentHash || undefined,
        publisherWallet: address,
        status: "CONFIRMED",
      });

      const publication = data.publication;
      setPublicationId(publication.id);
      setTxHash(publication.txHash);
      setBlockTimestamp(publication.blockTimestamp);
      setPublicationStatus(publication.status);
    } catch (err) {
      setPublicationStatus("FAILED");
      setError(err instanceof Error ? err.message : "Failed to publish content");
    } finally {
      setIsSigning(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for environments where clipboard API is unavailable
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    } catch (err) {
      console.warn("Failed to copy to clipboard:", err);
    }
  };

  const handleClearPublicationDetails = () => {
    setTitle("");
    setHasFilledTitleBefore(false);
    setContent("");
    setFilePayload("");
    setContentType("text");
    setSourceUrl("");
    setParentHash("");
    setUploadedFileName("");
    setIsUploadingFile(false);
    setUploadProgress(0);
    setUploadWarning("");
    setIsSigning(false);
    setIsScrapingArticle(false);
    setPublicationStatus(null);
    setCanonicalizedContent("");
    setComputedHash("");
    setDuplicatePublicationId(null);
    setShowConfirmModal(false);
    setTxHash("");
    setBlockTimestamp("");
    setPublicationId("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!isFileAllowedForContentType(file, contentType)) {
      const warningMessage = `Warning: ${file.name} does not match selected content type (${contentType}). Please upload a valid file.`;
      setUploadWarning(warningMessage);
      setError("Uploaded file type does not match selected content type");
      setUploadedFileName("");
      setUploadProgress(0);
      setContent("");
      setFilePayload("");
      event.target.value = "";
      return;
    }

    const uploadSizeLimit = MAX_EMBED_FILE_SIZE_BY_TYPE[contentType];
    if (uploadSizeLimit && file.size > uploadSizeLimit) {
      const warningMessage = `${file.name} is too large (${formatFileSize(file.size)}). Limit for ${contentType} is ${formatFileSize(uploadSizeLimit)}.`;
      setUploadWarning(warningMessage);
      setError("File is too large to process safely in browser memory");
      setUploadedFileName("");
      setUploadProgress(0);
      setContent("");
      setFilePayload("");
      event.target.value = "";
      return;
    }

    setError("");
    setUploadWarning("");
    setUploadedFileName(file.name);
    setCanonicalizedContent("");
    setComputedHash("");
    setDuplicatePublicationId(null);
    setIsUploadingFile(true);
    setUploadProgress(0);

    try {
      const readFileWithProgress = <T,>(mode: "text" | "arrayBuffer" | "dataUrl") => new Promise<T>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Failed to read uploaded file"));
        reader.onload = () => resolve(reader.result as T);
        reader.onloadend = () => setUploadProgress(100);
        reader.onprogress = (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress(percent);
          }
        };

        if (mode === "text") {
          reader.readAsText(file);
        } else if (mode === "arrayBuffer") {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsDataURL(file);
        }
      });

      let fileContent = "";

      const resolvedMimeType = resolveMimeType(file);
      const bytes = await readFileWithProgress<ArrayBuffer>("arrayBuffer");
      const hashHex = await computeSha256Hex(bytes);

      // Persist full file data so publication details can always provide downloads.
      const previewDataUrlRaw = await readFileWithProgress<string>("dataUrl");
      const previewDataUrl = previewDataUrlRaw.startsWith("data:application/octet-stream")
        && resolvedMimeType !== "application/octet-stream"
        ? previewDataUrlRaw.replace(/^data:application\/octet-stream/i, `data:${resolvedMimeType}`)
        : previewDataUrlRaw;

      fileContent = [
        `FILE:${file.name}`,
        `TYPE:${resolvedMimeType}`,
        `SIZE:${file.size}`,
        `SHA256:0x${hashHex}`,
        `DATAURL:${previewDataUrl}`,
      ].join("\n");

      setFilePayload(fileContent);
      setContent([
        `FILE:${file.name}`,
        `TYPE:${resolvedMimeType}`,
        `SIZE:${file.size}`,
        `SHA256:0x${hashHex}`,
      ].join("\n"));
      if (!title.trim() && !hasFilledTitleBefore) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
      setUploadProgress(100);
    } catch (err) {
      setUploadProgress(0);
      setError(err instanceof Error ? err.message : "Failed to load uploaded file");
      setFilePayload("");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleScrapeArticle = async () => {
    if (contentType !== "article") {
      return;
    }

    if (!sourceUrl.trim()) {
      setError("Please provide a source URL first");
      return;
    }

    setIsScrapingArticle(true);
    setError("");

    try {
      const data = await scrapePublicationSource(sourceUrl.trim());
      setContent(data.content);
      setFilePayload("");
      if (!title.trim() && data.title) {
        setTitle(data.title);
      }
      setCanonicalizedContent("");
      setComputedHash("");
      setDuplicatePublicationId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scrape content from URL");
    } finally {
      setIsScrapingArticle(false);
    }
  };

  const isUploadComplete = !isUploadingFile && uploadProgress === 100;
  const showPublishingOverlay = isSigning || publicationStatus === "PENDING";
  const canonicalizedContentSizeBytes = new TextEncoder().encode(canonicalizedContent).length;
  const canonicalizedPreviewLimitBytes = MAX_CANONICALIZED_PREVIEW_BYTES_BY_TYPE[contentType]
    ?? DEFAULT_MAX_CANONICALIZED_PREVIEW_BYTES;
  const isCanonicalizedPreviewTooLarge = canonicalizedContentSizeBytes > canonicalizedPreviewLimitBytes;

  // Loading state
  if (isLoading) {
    if (isMobile) {
      return (
        <main className="min-h-screen bg-black text-white">
          <div className="mx-auto max-w-md space-y-5 px-4 py-8">
            <div className="border-b border-white pb-5">
              <Link href="/" className="text-sm text-gray-400 hover:text-white">
                ← Back to Home
              </Link>
              <h1 className="mt-3 text-3xl font-bold">Publish Content</h1>
            </div>
            <div className="rounded-3xl border border-white p-8 text-center text-gray-400">Loading...</div>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
          <div className="mb-8 border-b border-white pb-6">
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              ← Back to Home
            </Link>
            <h1 className="mt-2 text-3xl font-bold">Publish Content</h1>
          </div>
          <div className="rounded-lg border border-white bg-black p-12 text-center">
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  // Not connected state
  if (!isConnected) {
    if (isMobile) {
      return (
        <main className="min-h-screen bg-black text-white">
          <div className="mx-auto max-w-md space-y-5 px-4 py-8">
            <div className="space-y-3 border-b border-white pb-5">
              <Link href="/" className="text-sm text-gray-400 hover:text-white">
                ← Back to Home
              </Link>
              <h1 className="text-3xl font-bold">Publish Content</h1>
              <p className="text-sm text-gray-400">Create a new proof-of-publish on-chain record</p>
            </div>

            <div className="rounded-3xl border border-white p-6 text-center">
              <h2 className="text-2xl font-bold">Wallet Connection Required</h2>
              <p className="mt-3 text-sm text-gray-400">
                Connect your MetaMask wallet before publishing content on-chain.
              </p>
              <Link href="/connect-wallet" className="mt-5 inline-flex rounded-full bg-white px-6 py-3 font-bold text-black hover:bg-gray-200">
                Connect MetaMask Wallet
              </Link>
            </div>

            <div className="rounded-3xl border border-gray-700 p-5">
              <h3 className="text-sm font-bold">Why do I need to connect?</h3>
              <ul className="mt-3 space-y-2 text-xs text-gray-400">
                <li>• Sign transactions to register hashes on-chain</li>
                <li>• Prove authorship and publication timestamp</li>
                <li>• Keep custody of your cryptographic identity</li>
                <li>• Only hashes and metadata are stored</li>
              </ul>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
          <div className="mb-8 border-b border-white pb-6">
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              ← Back to Home
            </Link>
            <h1 className="mt-2 text-3xl font-bold">Publish Content</h1>
            <p className="mt-1 text-sm text-gray-400">
              Create a new proof-of-publish on-chain record
            </p>
          </div>
          
          <div className="mx-auto max-w-2xl">
            <div className="rounded-lg border border-white bg-black p-12 text-center">
              <div className="mb-6">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full border-2 border-white bg-black p-4">
                  <svg className="h-full w-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="mb-3 text-2xl font-bold">Wallet Connection Required</h2>
                <p className="mb-6 text-gray-400">
                  You need to connect your MetaMask wallet to publish content on-chain. 
                  This ensures you have ownership and can sign transactions.
                </p>
              </div>
              
              <Link
                href="/connect-wallet"
                className="inline-block rounded-full bg-white px-8 py-3 font-bold text-black hover:bg-gray-200"
              >
                Connect MetaMask Wallet
              </Link>

              <div className="mt-6 rounded-lg border border-gray-700 bg-black p-4 text-left">
                <h3 className="mb-2 text-sm font-bold">Why do I need to connect?</h3>
                <ul className="space-y-1 text-xs text-gray-400">
                  <li>• Sign transactions to register content hashes on-chain</li>
                  <li>• Prove authorship and timestamp of publications</li>
                  <li>• Maintain full custody of your cryptographic identity</li>
                  <li>• No content is uploaded - only hashes are stored</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (isMobile) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-md space-y-5 px-4 py-8">
          <div className="space-y-3 border-b border-white pb-5">
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold">Publish Content</h1>
            <p className="text-sm text-gray-400">Create a new proof-of-publish on-chain record</p>
            <div className="text-xs text-gray-400">
              Connected Wallet <code className="ml-2 text-white">{address?.slice(0, 6)}...{address?.slice(-4)}</code>
            </div>
          </div>

          <section className="rounded-3xl border border-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Content Details</h2>
              <button
                type="button"
                onClick={handleClearPublicationDetails}
                disabled={isSigning}
                className="rounded border border-white px-3 py-2 text-xs font-bold text-white hover:bg-white hover:text-black disabled:border-gray-700 disabled:text-gray-700"
              >
                Clear
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="title-mobile" className="mb-2 block text-sm font-bold">Title *</label>
                <input
                  id="title-mobile"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!hasFilledTitleBefore && e.target.value.trim().length > 0) {
                      setHasFilledTitleBefore(true);
                    }
                  }}
                  className="w-full rounded border border-gray-700 bg-black px-3 py-3 text-white focus:border-white focus:outline-none"
                  placeholder="Enter content title"
                />
              </div>

              <div>
                <label htmlFor="contentType-mobile" className="mb-2 block text-sm font-bold">Content Type *</label>
                <select
                  id="contentType-mobile"
                  value={contentType}
                  onChange={(e) => {
                    setContentType(e.target.value as ContentType);
                    setUploadedFileName("");
                    setContent("");
                    setFilePayload("");
                    setCanonicalizedContent("");
                    setComputedHash("");
                    setDuplicatePublicationId(null);
                    setUploadProgress(0);
                    setUploadWarning("");
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="w-full rounded border border-gray-700 bg-black px-3 py-3 text-white focus:border-white focus:outline-none"
                >
                  <option value="text">Plain Text</option>
                  <option value="article">Article</option>
                  <option value="code">Code</option>
                  <option value="document">Document</option>
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {supportsFileUpload && (
                <div>
                  <label htmlFor="file-upload-mobile" className="mb-2 block text-sm font-bold">
                    Upload {contentType === "document" ? "Document" : contentType.charAt(0).toUpperCase() + contentType.slice(1)} File
                  </label>
                  <input
                    ref={fileInputRef}
                    id="file-upload-mobile"
                    type="file"
                    accept={fileAccept}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="file-upload-mobile" className="flex cursor-pointer items-center justify-center rounded border border-gray-700 px-4 py-5 text-center hover:border-white">
                    <div>
                      <p className="font-bold text-white">Click to upload file</p>
                      <p className="mt-1 text-xs text-gray-400">{uploadedFileName || "No file selected"}</p>
                    </div>
                  </label>
                  <p className="mt-2 text-xs text-gray-400">Accepted formats: {acceptedFormatsLabel}</p>
                  {uploadSizeLimitText && <p className="mt-1 text-xs text-gray-400">{uploadSizeLimitText}</p>}
                  {uploadWarning && <p className="mt-2 text-xs font-bold text-white">⚠ {uploadWarning}</p>}
                </div>
              )}

              <div>
                <label htmlFor="content-mobile" className="mb-2 block text-sm font-bold">Content {!supportsFileUpload ? "*" : ""}</label>
                <textarea
                  id="content-mobile"
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setFilePayload("");
                    setDuplicatePublicationId(null);
                  }}
                  readOnly={isContentReadOnly}
                  className="w-full rounded border border-gray-700 bg-black px-3 py-3 font-mono text-sm text-white focus:border-white focus:outline-none read-only:cursor-not-allowed read-only:opacity-80"
                  rows={12}
                  placeholder={supportsFileUpload ? "Upload a file above to populate content..." : "Enter or paste your content here..."}
                />
              </div>

              {contentType === "article" && (
                <div>
                  <label htmlFor="sourceUrl-mobile" className="mb-2 block text-sm font-bold">Source URL</label>
                  <input
                    id="sourceUrl-mobile"
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="w-full rounded border border-gray-700 bg-black px-3 py-3 text-white focus:border-white focus:outline-none"
                    placeholder="https://example.com/original-content"
                  />
                  <button
                    onClick={handleScrapeArticle}
                    type="button"
                    disabled={!sourceUrl.trim() || isScrapingArticle || isSigning}
                    className="mt-3 w-full rounded border border-white px-4 py-3 text-sm font-bold text-white hover:bg-white hover:text-black disabled:border-gray-700 disabled:text-gray-700"
                  >
                    {isScrapingArticle ? "Scraping..." : "Scrape URL into Content"}
                  </button>
                </div>
              )}

              <div>
                <label htmlFor="parentHash-mobile" className="mb-2 block text-sm font-bold">Parent Hash</label>
                <input
                  id="parentHash-mobile"
                  type="text"
                  list="parentHashSuggestions"
                  autoComplete="off"
                  value={parentHash}
                  onChange={(e) => setParentHash(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-black px-3 py-3 font-mono text-sm text-white focus:border-white focus:outline-none"
                  placeholder="0x..."
                />
                <datalist id="parentHashSuggestions">
                  {filteredParentHashSuggestions.map((hash) => (
                    <option key={hash} value={hash} />
                  ))}
                </datalist>
              </div>
            </div>
          </section>

          <div className="grid gap-2">
            <button
              onClick={handlePreview}
              disabled={!title || (!isCodeType && !isContentOptional && !content) || (isCodeType && !isCodeInputValid) || isSigning || publicationStatus === "PENDING"}
              className="rounded-full border border-white px-6 py-3 font-bold text-white hover:bg-white hover:text-black disabled:border-gray-700 disabled:text-gray-700"
            >
              Preview Canonicalized
            </button>
            <button
              onClick={handleSignAndRegister}
              disabled={!computedHash || isSigning || isValidatingParentHash || Boolean(duplicatePublicationId) || publicationStatus === "PENDING" || publicationStatus === "CONFIRMED"}
              className="rounded-full bg-white px-6 py-3 font-bold text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600"
            >
              {isValidatingParentHash ? "Validating Parent..." : "Sign & Register"}
            </button>
          </div>

          <section className="rounded-3xl border border-white p-5">
            <h2 className="text-lg font-bold">Canonicalized Preview</h2>
            {canonicalizedContent ? (
              <>
                {isCanonicalizedPreviewTooLarge ? (
                  <div className="mt-4 rounded border border-gray-700 p-4 text-sm text-gray-300">
                    Canonicalized content will not be previewed because it is too large ({formatFileSize(canonicalizedContentSizeBytes)}).
                  </div>
                ) : (
                  <div className="mt-4 max-h-[280px] overflow-y-auto rounded border border-gray-700 p-4">
                    <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-300">{canonicalizedContent}</pre>
                  </div>
                )}
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-bold">Computed Hash</label>
                  <code className="block break-all rounded border border-gray-700 px-3 py-3 font-mono text-xs text-white">{computedHash}</code>
                  <button onClick={() => copyToClipboard(computedHash)} className="mt-3 w-full rounded border border-white px-4 py-2 text-xs font-bold text-white hover:bg-white hover:text-black">
                    Copy Hash
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded border border-gray-700 p-6 text-center text-gray-400">
                Click "Preview Canonicalized" to see normalized content and computed hash.
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white p-5">
            <h2 className="text-lg font-bold">Publication Status</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold">Status</span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                  isSigning ? "border-gray-700 text-gray-400" :
                  publicationStatus === "CONFIRMED" ? "border-white bg-white text-black" :
                  publicationStatus === "FAILED" ? "border-white text-white" :
                  "border-gray-700 text-gray-400"
                }`}>
                  {isSigning ? "SIGNING" : publicationStatus || "NOT STARTED"}
                </span>
              </div>
              {txHash && <code className="block break-all rounded border border-gray-700 px-3 py-3 text-xs text-white">{txHash}</code>}
              {blockTimestamp && <p className="text-white">{new Date(blockTimestamp).toLocaleString()}</p>}
              {publicationId && <p className="text-white">Publication #{publicationId}</p>}
              {publicationStatus === "CONFIRMED" && (
                <div className="grid gap-2">
                  <Link href={`/publication/${publicationId}`} className="rounded-full border border-white px-4 py-3 text-center text-sm font-bold text-white hover:bg-white hover:text-black">
                    View Details
                  </Link>
                  <Link href="/dashboard" className="rounded-full border border-white px-4 py-3 text-center text-sm font-bold text-white hover:bg-white hover:text-black">
                    Go to Dashboard
                  </Link>
                  <p className="pt-1 text-center text-xs text-gray-400">Done? Remember to clear the form before publishing new content.</p>
                  <button onClick={handleClearPublicationDetails} className="rounded-full border border-gray-600 px-4 py-3 text-sm font-bold text-gray-400 hover:border-white hover:text-white">
                    Clear &amp; Publish Another
                  </button>
                </div>
              )}
            </div>
          </section>

          {error && (
            <div className="rounded-3xl border border-white p-4 text-sm font-bold text-white">
              ⚠ {error}
            </div>
          )}

          <section className="rounded-3xl border border-gray-700 p-5">
            <h3 className="text-sm font-bold">How it works</h3>
            <ul className="mt-3 space-y-2 text-xs text-gray-400">
              <li>• Content is canonicalized using deterministic rules</li>
              <li>• SHA-256 is computed locally in your browser</li>
              <li>• Your wallet signs the transaction with the hash</li>
              <li>• The hash is registered on-chain with metadata</li>
            </ul>
          </section>
        </div>

        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-end overflow-y-auto bg-black/80">
            <div className="max-h-[calc(100dvh-1rem)] w-full overflow-y-auto rounded-t-[2rem] border border-white bg-black p-5">
              <h2 className="text-xl font-bold">Confirm Publication</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs font-bold text-gray-400">Title</p>
                  <p className="text-white">{title}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400">Content Type</p>
                  <p className="text-white">{contentType}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400">Hash to Register</p>
                  <code className="block break-all rounded border border-gray-700 p-3 text-xs text-white">{computedHash}</code>
                </div>
                {parentHash && (
                  <div>
                    <p className="text-xs font-bold text-gray-400">Parent Hash</p>
                    <code className="block break-all rounded border border-gray-700 p-3 text-xs text-white">{parentHash}</code>
                  </div>
                )}
              </div>
              <div className="mt-5 grid gap-2">
                <button onClick={() => setShowConfirmModal(false)} className="rounded-full border border-white px-6 py-3 font-bold text-white hover:bg-white hover:text-black">
                  Cancel
                </button>
                <button onClick={confirmPublish} className="rounded-full bg-white px-6 py-3 font-bold text-black hover:bg-gray-200">
                  Confirm & Sign
                </button>
              </div>
            </div>
          </div>
        )}

        {showPublishingOverlay && <PublishingOverlay />}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b border-white pb-6">
          <div>
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              ← Back to Home
            </Link>
            <h1 className="mt-2 text-3xl font-bold">Publish Content</h1>
            <p className="mt-1 text-sm text-gray-400">
              Create a new proof-of-publish on-chain record
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Connected Wallet</p>
            <code className="text-xs text-white">{address?.slice(0, 6)}...{address?.slice(-4)}</code>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 xl:gap-10">
          {/* Left Column: Form */}
          <div className="space-y-6">
            <div className="rounded-lg border border-white bg-black p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold">Content Details</h2>
                <button
                  type="button"
                  onClick={handleClearPublicationDetails}
                  disabled={isSigning}
                  className="rounded border border-white bg-black px-3 py-2 text-xs font-bold text-white hover:bg-white hover:text-black disabled:border-gray-700 disabled:text-gray-700 disabled:hover:bg-black"
                >
                  Clear Content
                </button>
              </div>
              
              {/* Title */}
              <div className="mb-4">
                <label htmlFor="title" className="mb-2 block text-sm font-bold">
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!hasFilledTitleBefore && e.target.value.trim().length > 0) {
                      setHasFilledTitleBefore(true);
                    }
                  }}
                  className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-white focus:border-white focus:outline-none"
                  placeholder="Enter content title"
                />
              </div>

              {/* Content Type */}
              <div className="mb-4">
                <label htmlFor="contentType" className="mb-2 block text-sm font-bold">
                  Content Type *
                </label>
                <select
                  id="contentType"
                  value={contentType}
                  onChange={(e) => {
                    setContentType(e.target.value as ContentType);
                    setUploadedFileName("");
                    setContent("");
                    setFilePayload("");
                    setCanonicalizedContent("");
                    setComputedHash("");
                    setDuplicatePublicationId(null);
                    setUploadProgress(0);
                    setUploadWarning("");
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-white focus:border-white focus:outline-none"
                >
                  <option value="text">Plain Text</option>
                  <option value="article">Article</option>
                  <option value="code">Code</option>
                  <option value="document">Document</option>
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {supportsFileUpload && (
                <div className="mb-4">
                  <label htmlFor="file-upload" className="mb-2 block text-sm font-bold">
                    Upload {contentType === "document" ? "Document" : contentType.charAt(0).toUpperCase() + contentType.slice(1)} File
                  </label>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept={fileAccept}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex cursor-pointer items-center justify-center rounded border border-gray-700 bg-black px-4 py-4 text-center hover:border-white"
                  >
                    <div>
                      <p className="font-bold text-white">Click to upload file</p>
                      <p className="mt-1 text-xs text-gray-400">{uploadedFileName || "No file selected"}</p>
                    </div>
                  </label>
                  <p className="mt-1 text-xs text-gray-400">
                    Accepted formats: {acceptedFormatsLabel}
                  </p>
                  {uploadSizeLimitText && (
                    <p className="mt-1 text-xs text-gray-400">{uploadSizeLimitText}</p>
                  )}
                  {uploadWarning && (
                    <p className="mt-1 text-xs font-bold text-white">⚠ {uploadWarning}</p>
                  )}
                  {(isUploadingFile || uploadProgress > 0) && (
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
                        <span>
                          {isUploadingFile
                            ? "Uploading..."
                            : isUploadComplete
                              ? "Upload complete"
                              : "Upload interrupted"}
                        </span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded border border-gray-700 bg-black">
                        <div
                          className="h-full bg-white transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Content Editor */}
              <div className="mb-4">
                <label htmlFor="content" className="mb-2 block text-sm font-bold">
                  Content {!supportsFileUpload ? "*" : ""}
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setFilePayload("");
                    setDuplicatePublicationId(null);
                  }}
                  readOnly={isContentReadOnly}
                  className="w-full rounded border border-gray-700 bg-black px-3 py-2 font-mono text-sm text-white focus:border-white focus:outline-none read-only:cursor-not-allowed read-only:opacity-80"
                  rows={12}
                  placeholder={supportsFileUpload ? "Upload a file above to populate content..." : "Enter or paste your content here..."}
                />
                <p className="mt-1 text-xs text-gray-400">
                  {supportsFileUpload ? "Read-only for this content type" : `${content.length} characters`}
                </p>
              </div>

              {contentType === "article" && (
                <div className="mb-4">
                  <label htmlFor="sourceUrl" className="mb-2 block text-sm font-bold">
                    Source URL <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="sourceUrl"
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-white focus:border-white focus:outline-none"
                    placeholder="https://example.com/original-content"
                  />
                  <div className="mt-2">
                    <button
                      onClick={handleScrapeArticle}
                      type="button"
                      disabled={!sourceUrl.trim() || isScrapingArticle || isSigning}
                      className="rounded border border-white bg-black px-3 py-2 text-xs font-bold text-white hover:bg-white hover:text-black disabled:border-gray-700 disabled:text-gray-700 disabled:hover:bg-black"
                    >
                      {isScrapingArticle ? "Scraping..." : "Scrape URL into Content"}
                    </button>
                    <p className="mt-1 text-xs text-gray-400">
                      For article type, fetch text from URL and auto-fill the content box
                    </p>
                  </div>
                </div>
              )}

              {/* Parent Hash (Optional) */}
              <div className="mb-4">
                <label htmlFor="parentHash" className="mb-2 block text-sm font-bold">
                  Parent Hash <span className="font-normal text-gray-400">(optional, for versioning)</span>
                </label>
                <input
                  id="parentHash"
                  type="text"
                  list="parentHashSuggestions"
                  autoComplete="off"
                  value={parentHash}
                  onChange={(e) => setParentHash(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-black px-3 py-2 font-mono text-sm text-white focus:border-white focus:outline-none"
                  placeholder="0x..."
                />
                <datalist id="parentHashSuggestions">
                  {filteredParentHashSuggestions.map((hash) => (
                    <option key={hash} value={hash} />
                  ))}
                </datalist>
                <p className="mt-1 text-xs text-gray-400">
                  Link this to a previous version by entering its hash. Suggestions appear while typing.
                </p>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePreview}
                disabled={!title || (!isCodeType && !isContentOptional && !content) || (isCodeType && !isCodeInputValid) || isSigning || publicationStatus === "PENDING"}
                className="flex-1 rounded-full border border-white bg-black px-6 py-3 font-bold text-white hover:bg-white hover:text-black disabled:border-gray-700 disabled:text-gray-700 disabled:hover:bg-black"
              >
                Preview Canonicalized
              </button>
              <button
                onClick={handleSignAndRegister}
                disabled={!computedHash || isSigning || isValidatingParentHash || Boolean(duplicatePublicationId) || publicationStatus === "PENDING" || publicationStatus === "CONFIRMED"}
                className="flex-1 rounded-full bg-white px-6 py-3 font-bold text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600"
              >
                {isValidatingParentHash ? "Validating Parent..." : "Sign & Register"}
              </button>
            </div>
          </div>

          {/* Right Column: Preview & Status */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* Preview Area */}
            <div className="rounded-lg border border-white bg-black p-6">
              <h2 className="mb-4 text-xl font-bold">Canonicalized Preview</h2>
              
              {canonicalizedContent ? (
                <>
                  {isCanonicalizedPreviewTooLarge ? (
                    <div className="mb-4 rounded border border-gray-700 bg-black p-4 text-sm text-gray-300">
                      Canonicalized content will not be previewed because it is too large ({formatFileSize(canonicalizedContentSizeBytes)}). Preview limit for {contentType} is {formatFileSize(canonicalizedPreviewLimitBytes)}.
                    </div>
                  ) : (
                    <div className="mb-4 max-h-[320px] overflow-y-auto rounded border border-gray-700 bg-black p-4">
                      <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-300">
                        {canonicalizedContent}
                      </pre>
                    </div>
                  )}
                  
                  {/* Hash Display */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Computed Hash</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded border border-gray-700 bg-black px-3 py-2 font-mono text-xs text-white">
                        {computedHash}
                      </code>
                      <button
                        onClick={() => copyToClipboard(computedHash)}
                        className="rounded border border-white bg-black px-3 py-2 text-xs font-bold text-white hover:bg-white hover:text-black"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      SHA-256 hash computed client-side via SubtleCrypto
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[220px] items-center justify-center rounded border border-gray-700 bg-black p-8 text-center text-gray-400">
                  <p>Click "Preview Canonicalized" to see normalized content and computed hash</p>
                </div>
              )}
            </div>

            {/* Status Display */}
            <div className="rounded-lg border border-white bg-black p-6">
              <h2 className="mb-4 text-xl font-bold">Publication Status</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Status</span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    isSigning ? "border-gray-700 bg-black text-gray-400" :
                    publicationStatus === "CONFIRMED" ? "border-white bg-white text-black" :
                    publicationStatus === "FAILED" ? "border-white bg-black text-white" :
                    publicationStatus === "PENDING" ? "border-gray-700 bg-black text-gray-400" :
                    "border-gray-700 bg-black text-gray-400"
                  }`}>
                    {isSigning ? "SIGNING" : publicationStatus || "NOT STARTED"}
                  </span>
                </div>
                
                {txHash && (
                  <div className="rounded border border-gray-700 bg-black p-3">
                    <p className="mb-1 text-xs font-bold text-gray-400">Transaction Hash</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate font-mono text-xs text-white">{txHash}</code>
                      <button
                        onClick={() => copyToClipboard(txHash)}
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                
                {blockTimestamp && (
                  <div className="rounded border border-gray-700 bg-black p-3">
                    <p className="mb-1 text-xs font-bold text-gray-400">Block Timestamp</p>
                    <p className="text-sm text-white">{new Date(blockTimestamp).toLocaleString()}</p>
                  </div>
                )}
                
                {publicationId && (
                  <div className="rounded border border-gray-700 bg-black p-3">
                    <p className="mb-1 text-xs font-bold text-gray-400">Publication ID</p>
                    <p className="text-sm text-white">#{publicationId}</p>
                  </div>
                )}

                {publicationStatus === "CONFIRMED" && (
                  <div className="mt-4 grid gap-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/publication/${publicationId}`}
                        className="flex-1 rounded-full border border-white bg-black px-4 py-2 text-center text-sm font-bold text-white hover:bg-white hover:text-black"
                      >
                        View Details
                      </Link>
                      <Link
                        href="/dashboard"
                        className="flex-1 rounded-full border border-white bg-black px-4 py-2 text-center text-sm font-bold text-white hover:bg-white hover:text-black"
                      >
                        Go to Dashboard
                      </Link>
                    </div>
                    <p className="text-center text-xs text-gray-400">Done? Remember to clear the form before publishing new content.</p>
                    <button onClick={handleClearPublicationDetails} className="rounded-full border border-gray-600 bg-black px-4 py-2 text-sm font-bold text-gray-400 hover:border-white hover:text-white">
                      Clear &amp; Publish Another
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="rounded-lg border border-white bg-black p-4">
                <p className="text-sm font-bold text-white">⚠ {error}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="rounded-lg border border-gray-700 bg-black p-4">
              <h3 className="mb-2 text-sm font-bold">How it works</h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>• Content is canonicalized using deterministic rules</li>
                <li>• SHA-256 hash is computed locally in your browser</li>
                <li>• Your wallet signs the transaction with the hash</li>
                <li>• The hash is registered on-chain with metadata</li>
                <li>• Content never leaves your browser unless you choose to share</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-white bg-black p-6">
            <h2 className="mb-4 text-2xl font-bold">Confirm Publication</h2>
            
            <div className="mb-6 space-y-4">
              <div>
                <p className="mb-2 text-sm font-bold text-gray-400">Title</p>
                <p className="text-white">{title}</p>
              </div>
              
              <div>
                <p className="mb-2 text-sm font-bold text-gray-400">Content Type</p>
                <p className="text-white">{contentType}</p>
              </div>
              
              <div>
                <p className="mb-2 text-sm font-bold text-gray-400">Canonicalized Content Preview</p>
                <div className="max-h-48 overflow-y-auto rounded border border-gray-700 bg-black p-3">
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs text-gray-300">
                    {canonicalizedContent.slice(0, 500)}
                    {canonicalizedContent.length > 500 && "..."}
                  </pre>
                </div>
              </div>
              
              <div>
                <p className="mb-2 text-sm font-bold text-gray-400">Hash to Register</p>
                <code className="block break-all rounded border border-gray-700 bg-black p-3 font-mono text-xs text-white">
                  {computedHash}
                </code>
              </div>

              {parentHash && (
                <div>
                  <p className="mb-2 text-sm font-bold text-gray-400">Parent Hash (Version Link)</p>
                  <code className="block break-all rounded border border-gray-700 bg-black p-3 font-mono text-xs text-white">
                    {parentHash}
                  </code>
                </div>
              )}
            </div>

            <div className="mb-4 rounded border border-gray-700 bg-black p-4">
              <p className="text-sm text-gray-400">
                By confirming, you will sign a transaction that registers this hash on-chain. 
                This action cannot be undone. The original content is NOT stored on-chain, 
                only the hash and metadata.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 rounded-full border border-white bg-black px-6 py-3 font-bold text-white hover:bg-white hover:text-black"
              >
                Cancel
              </button>
              <button
                onClick={confirmPublish}
                className="flex-1 rounded-full bg-white px-6 py-3 font-bold text-black hover:bg-gray-200"
              >
                Confirm & Sign
              </button>
            </div>
          </div>
        </div>
      )}

      {showPublishingOverlay && <PublishingOverlay />}
    </main>
  );
}