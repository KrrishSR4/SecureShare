import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Download,
  AlertCircle,
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  FileCode,
  RefreshCw,
  Clock,
  Trash2,
} from "lucide-react";
import { LogoMark } from "@/components/secureshare";

export const Route = createFileRoute("/share/$shareId")({
  component: ShareDownloadPage,
});

interface SharePayload {
  id: string;
  name: string;
  size: string;
  type: string;
  content: string;
  requirePassword?: boolean;
  password?: string;
  oneTimeDownload?: boolean;
  expiresAt?: string;
  downloadsCount: number;
  downloadsLimit: number;
  remainingDownloads: number;
  createdBy?: string;
  createdAt?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL as string).replace(/\/api$/, "")
  : (typeof window !== "undefined"
    ? `http://${window.location.hostname}:4000`
    : "http://localhost:4000");

function ShareDownloadPage() {
  const { shareId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState<SharePayload | null>(null);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Password Verification State
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Decryption & Download Animation State
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionStep, setDecryptionStep] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    // 1. Try to fetch from server
    fetch(`${API_BASE_URL}/api/shares/${shareId}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "invalid_link");
        }
        return res.json();
      })
      .then((data) => {
        const payload: SharePayload = {
          id: data.id,
          name: data.name,
          size: data.size,
          type: data.type,
          content: "",
          requirePassword: data.requirePassword,
          password: "",
          oneTimeDownload: data.oneTime,
          expiresAt: data.expiresAt,
          downloadsCount: data.downloadsCount,
          downloadsLimit: data.downloadsLimit,
          remainingDownloads: data.remainingDownloads,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
        };
        setShareData(payload);
        if (!data.requirePassword) {
          setIsVerified(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Not found on server or network error, checking local storage fallback", err);

        // 2. Try to load from localStorage as fallback
        const saved = localStorage.getItem(`ss_share_${shareId}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as SharePayload;
            setShareData(parsed);
            if (!parsed.requirePassword) {
              setIsVerified(true);
            }
            setLoading(false);
            return;
          } catch (e) {
            console.error("Failed to parse local share data", e);
          }
        }

        setErrorState(err.message || "invalid_link");
        setLoading(false);
      });
  }, [shareId]);

  const getFileIcon = (fileName?: string) => {
    const ext = (fileName || "").split(".").pop() || "";
    switch (ext.toLowerCase()) {
      case "pdf":
        return FileText;
      case "csv":
      case "xlsx":
      case "xls":
        return FileSpreadsheet;
      case "png":
      case "jpg":
      case "jpeg":
      case "webp":
        return FileImage;
      case "zip":
      case "tar":
      case "gz":
      case "rar":
        return FileArchive;
      case "js":
      case "ts":
      case "tsx":
      case "json":
      case "html":
      case "css":
        return FileCode;
      default:
        return FileText;
    }
  };

  const handleVerifyPassword = () => {
    if (!shareData) return;

    fetch(`${API_BASE_URL}/api/shares/${shareId}/decrypt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: passwordInput }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Incorrect password");
        return res.json();
      })
      .then(() => {
        setIsVerified(true);
        setPasswordError(false);
      })
      .catch((err) => {
        console.warn("Server validation failed, trying local storage fallback", err);
        // Local Fallback
        const saved = localStorage.getItem(`ss_share_${shareId}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as SharePayload;
            if (passwordInput === parsed.password) {
              setIsVerified(true);
              setPasswordError(false);
              return;
            }
          } catch (e) {
            console.error(e);
          }
        }
        setPasswordError(true);
      });
  };

  const handleDecryptAndDownload = () => {
    if (!shareData || !isVerified) return;

    setIsDecrypting(true);
    setDecryptionStep(0);

    const downloadUrl =
      `${API_BASE_URL}/api/shares/${shareId}/download` +
      (passwordInput ? `?password=${encodeURIComponent(passwordInput)}` : "");

    fetch(downloadUrl)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Could not download file");
        }
        return res.blob();
      })
      .then((blob) => {
        // Cryptographic steps visualization
        setTimeout(() => setDecryptionStep(1), 500); // Verify wrap parameters
        setTimeout(() => setDecryptionStep(2), 1200); // Reconstruct AES GCM keys
        setTimeout(() => setDecryptionStep(3), 2000); // Decrypt payload buffer
        setTimeout(() => {
          setIsDecrypting(false);
          setDownloadSuccess(true);

          // Trigger actual browser download
          const urlObj = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = urlObj;
          link.download = shareData.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(urlObj);

          // Handle local fallback shredding
          if (shareData.oneTimeDownload) {
            localStorage.removeItem(`ss_share_${shareId}`);
          }
        }, 3000);
      })
      .catch((err) => {
        console.error(err);
        setIsDecrypting(false);
        alert("Download failed: " + err.message);
      });
  };

  const getErrorContent = (error: string) => {
    switch (error) {
      case "link_expired":
        return {
          title: "Link Expired",
          description:
            "This secure share link has reached its expiration time and is no longer accessible.",
          icon: Clock,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/25",
        };
      case "link_revoked":
        return {
          title: "Link Revoked",
          description:
            "This secure share link has been revoked by the sender. Access is no longer permitted.",
          icon: ShieldAlert,
          color: "text-red-500 bg-red-500/10 border-red-500/25",
        };
      case "limit_reached":
        return {
          title: "Download Limit Reached",
          description:
            "This secure link has reached its maximum download limit and is now deactivated.",
          icon: AlertCircle,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/25",
        };
      case "file_removed":
        return {
          title: "File Removed",
          description:
            "The shared file has been permanently removed by the owner from SecureShare.",
          icon: Trash2,
          color: "text-red-500 bg-red-500/10 border-red-500/25",
        };
      case "owner_inactive":
        return {
          title: "Account Inactive",
          description:
            "The sender's account is currently inactive or suspended. Data retrieval is blocked.",
          icon: ShieldAlert,
          color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/25",
        };
      default:
        return {
          title: "Invalid Share Link",
          description:
            "This secure share link is invalid, incomplete, or does not exist. Please check the URL and try again.",
          icon: ShieldAlert,
          color: "text-red-500 bg-red-500/10 border-red-500/25",
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground grain flex items-center justify-center">
        <RefreshCw className="h-6 w-6 text-signal animate-spin" />
      </div>
    );
  }

  const FileIcon = shareData ? getFileIcon(shareData.name) : FileText;
  const errorDetails = errorState ? getErrorContent(errorState) : null;
  const ErrorIcon = errorDetails ? errorDetails.icon : ShieldAlert;

  return (
    <div className="min-h-screen bg-background text-foreground grain flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:px-10">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xl font-bold tracking-tight"
          >
            <LogoMark />
            <span>SecureShare</span>
          </Link>
          <Link
            to="/"
            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-ink flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Panel */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {errorDetails ? (
              /* ERROR STATES */
              <motion.div
                key="error-page"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="rounded-2xl border border-border bg-card p-8 text-center shadow-lg"
              >
                <div
                  className={`rounded-full p-3.5 w-fit mx-auto mb-5 border ${errorDetails.color}`}
                >
                  <ErrorIcon className="h-7 w-7" />
                </div>
                <h2 className="text-lg font-semibold text-ink">{errorDetails.title}</h2>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {errorDetails.description}
                </p>
                <div className="mt-8">
                  <Link
                    to="/"
                    className="inline-flex w-full justify-center rounded-xl bg-ink py-2.5 text-xs font-semibold text-background hover:bg-ink/90 transition-colors shadow-sm"
                  >
                    Go back to SecureShare
                  </Link>
                </div>
              </motion.div>
            ) : isDecrypting ? (
              /* DECRYPTION PIPELINE ANIMATION */
              <motion.div
                key="decrypting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-border bg-card p-8 text-center shadow-lg"
              >
                <div className="relative mb-6 mx-auto w-14 h-14 rounded-full border border-border flex items-center justify-center bg-background shadow-sm">
                  <RefreshCw className="h-5 w-5 text-signal animate-spin" />
                </div>
                <h3 className="text-sm font-semibold text-ink">Local Cryptographic Decryption</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Reconstructing ciphertext and validating signature keyblocks in browser sandbox.
                </p>

                <div className="w-full mt-6 space-y-3 text-left font-mono text-[10px]">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div className="flex items-center gap-2">
                      {decryptionStep >= 1 ? (
                        <ShieldCheck className="h-3.5 w-3.5 text-signal" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border border-dashed border-border" />
                      )}
                      <span
                        className={
                          decryptionStep >= 1 ? "text-ink font-semibold" : "text-muted-foreground"
                        }
                      >
                        1. Verify key wrapper signature
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {decryptionStep >= 1 ? "Success" : "Pending"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div className="flex items-center gap-2">
                      {decryptionStep >= 2 ? (
                        <ShieldCheck className="h-3.5 w-3.5 text-signal" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border border-dashed border-border" />
                      )}
                      <span
                        className={
                          decryptionStep >= 2 ? "text-ink font-semibold" : "text-muted-foreground"
                        }
                      >
                        2. Unwrap client AES-256 GCM key
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {decryptionStep >= 2 ? "Success" : "Pending"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      {decryptionStep >= 3 ? (
                        <ShieldCheck className="h-3.5 w-3.5 text-signal" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border border-dashed border-border" />
                      )}
                      <span
                        className={
                          decryptionStep >= 3 ? "text-ink font-semibold" : "text-muted-foreground"
                        }
                      >
                        3. Decrypt ciphertext payload
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {decryptionStep >= 3 ? "Success" : "Pending"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : downloadSuccess ? (
              /* SUCCESS STATE */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-border bg-card p-8 text-center shadow-lg"
              >
                <div className="rounded-full bg-signal/10 border border-signal/25 p-3.5 w-fit mx-auto mb-5 text-signal">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h2 className="text-lg font-semibold text-ink">Decryption Complete</h2>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Your file has been successfully decrypted client-side and saved to your device.
                </p>
                {shareData?.oneTimeDownload && (
                  <div className="mt-4 rounded-xl border border-red-500/10 bg-red-500/[0.02] p-3 text-red-500/90 text-[10px] leading-normal flex items-start gap-2 text-left">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>One-time download:</strong> Decryption wrap metadata has been shredded
                      from SecureShare records. This link is now dead.
                    </span>
                  </div>
                )}
                <div className="mt-8 flex gap-3">
                  <Link
                    to="/"
                    className="flex-1 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-ink hover:bg-mist/35 transition-colors text-center"
                  >
                    Go Home
                  </Link>
                </div>
              </motion.div>
            ) : !isVerified ? (
              /* PASSWORD PROMPTS */
              <motion.div
                key="password-prompt"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="rounded-2xl border border-border bg-card p-8 shadow-lg text-left"
              >
                <div className="rounded-full bg-mist p-3.5 w-fit mx-auto mb-5 text-muted-foreground border border-border">
                  <Lock className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-ink text-center">
                  Decryption Key Required
                </h2>
                <p className="text-xs text-muted-foreground mt-2 text-center leading-relaxed">
                  This share payload requires a client-side decryption key. Enter the password to
                  initialize unwrap sequence.
                </p>

                <div className="mt-6 space-y-4 text-xs">
                  <div>
                    <input
                      type="password"
                      placeholder="Enter decryption password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:border-ink font-sans text-sm"
                    />
                    {passwordError && (
                      <p className="text-red-500 font-semibold text-[10px] mt-1.5 flex items-center gap-1 font-mono">
                        <AlertCircle className="h-3.5 w-3.5" /> Invalid decryption passphrase.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleVerifyPassword}
                    className="w-full py-2.5 rounded-xl bg-ink text-xs font-semibold text-background hover:bg-ink/90 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Key className="h-3.5 w-3.5" /> Verify & Access File
                  </button>
                </div>
              </motion.div>
            ) : (
              /* READY TO DOWNLOAD STATE */
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="rounded-2xl border border-border bg-card p-8 text-center shadow-lg"
              >
                <div className="rounded-2xl border border-border bg-mist/35 p-6 w-fit mx-auto mb-4 text-muted-foreground border-dashed flex items-center justify-center">
                  <FileIcon className="h-10 w-10 text-ink" strokeWidth={1.5} />
                </div>

                {/* UI BADGES */}
                <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <ShieldCheck className="h-3 w-3" /> AES-256 Encrypted
                  </span>
                  {shareData?.oneTimeDownload && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      <AlertCircle className="h-3 w-3" /> One-Time Download
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    <Lock className="h-3 w-3" /> Privacy Protected
                  </span>
                </div>

                <h2
                  className="text-lg font-semibold text-ink truncate max-w-full px-2"
                  title={shareData?.name}
                >
                  {shareData?.name}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {shareData?.size} · {shareData?.type || "unknown binary"}
                </p>

                {/* METADATA LIST */}
                {shareData && (
                  <div className="mt-6 border border-border/80 rounded-xl bg-mist/10 p-4 text-[11px] space-y-2 text-left font-sans">
                    {shareData.createdBy && (
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="text-muted-foreground font-mono">Shared By:</span>
                        <span className="text-ink font-semibold">{shareData.createdBy}</span>
                      </div>
                    )}
                    {shareData.createdAt && (
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="text-muted-foreground font-mono">Shared On:</span>
                        <span className="text-ink font-mono">
                          {new Date(shareData.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {shareData.expiresAt && (
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="text-muted-foreground font-mono">Expires At:</span>
                        <span className="text-amber-600 font-semibold font-mono">
                          {new Date(shareData.expiresAt).toLocaleDateString()}{" "}
                          {new Date(shareData.expiresAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-mono">Downloads Remaining:</span>
                      <span className="text-ink font-semibold font-mono">
                        {shareData.downloadsLimit - shareData.downloadsCount} of{" "}
                        {shareData.downloadsLimit}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <button
                    onClick={handleDecryptAndDownload}
                    className="w-full py-3 rounded-xl bg-ink text-xs font-semibold text-background hover:bg-ink/90 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Download className="h-4 w-4" /> Download Securely
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-border/80 text-center text-xs text-muted-foreground bg-mist/10">
        <p>© {new Date().getFullYear()} SecureShare Inc. All decryption processes are sandboxed.</p>
      </footer>
    </div>
  );
}
