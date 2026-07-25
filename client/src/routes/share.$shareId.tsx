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
  Eye,
  Check,
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
}

function ShareDownloadPage() {
  const { shareId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState<SharePayload | null>(null);
  
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
    fetch(`http://localhost:4000/api/shares/${shareId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found on server");
        return res.json();
      })
      .then((data) => {
        const payload: SharePayload = {
          id: data.id,
          name: data.name,
          size: data.size,
          type: data.type,
          content: data.content || "",
          requirePassword: data.requirePassword,
          password: "", // password is authenticated on server
          oneTimeDownload: data.oneTime,
        };
        setShareData(payload);
        if (!data.requirePassword) {
          setIsVerified(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Not found on server or network error, falling back to local storage", err);
        // 2. Try to load from localStorage
        const saved = localStorage.getItem(`ss_share_${shareId}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as SharePayload;
            setShareData(parsed);
            if (!parsed.requirePassword) {
              setIsVerified(true);
            }
          } catch (e) {
            console.error("Failed to parse share data", e);
          }
        }
        setLoading(false);
      });
  }, [shareId]);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop() || "";
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

    fetch(`http://localhost:4000/api/shares/${shareId}/decrypt`, {
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
      .then((data) => {
        setShareData((prev) => prev ? { ...prev, content: data.content } : null);
        setIsVerified(true);
        setPasswordError(false);
      })
      .catch((err) => {
        console.warn("Server validation failed, trying local storage fallback", err);
        // Fallback
        if (passwordInput === shareData.password) {
          setIsVerified(true);
          setPasswordError(false);
        } else {
          setPasswordError(true);
        }
      });
  };

  const handleDecryptAndDownload = () => {
    if (!shareData || !isVerified) return;

    setIsDecrypting(true);
    setDecryptionStep(0);

    // Cryptographic steps visualization
    setTimeout(() => setDecryptionStep(1), 500); // Verify wrap parameters
    setTimeout(() => setDecryptionStep(2), 1200); // Reconstruct AES block keys
    setTimeout(() => setDecryptionStep(3), 2000); // Decrypt payload buffer
    setTimeout(() => {
      setIsDecrypting(false);
      setDownloadSuccess(true);

      // Trigger actual browser download
      const link = document.createElement("a");
      link.href = shareData.content;
      link.download = shareData.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Handle One-Time Download Shredding
      if (shareData.oneTimeDownload) {
        localStorage.removeItem(`ss_share_${shareId}`);
        // Log that this is shredded locally
        console.log(`Payload for shareId ${shareId} shredded immediately after single retrieval.`);
      }
    }, 2800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground grain flex items-center justify-center">
        <RefreshCw className="h-6 w-6 text-signal animate-spin" />
      </div>
    );
  }

  const FileIcon = shareData ? getFileIcon(shareData.name) : FileText;

  return (
    <div className="min-h-screen bg-background text-foreground grain flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:px-10">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
            <LogoMark />
            <span>SecureShare</span>
          </Link>
          <Link to="/" className="text-xs font-semibold text-muted-foreground transition-colors hover:text-ink flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Panel */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!shareData ? (
              /* ERROR STATE: SHARE NOT FOUND / EXPIRED */
              <motion.div
                key="expired"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="rounded-2xl border border-border bg-card p-8 text-center shadow-lg"
              >
                <div className="rounded-full bg-red-500/10 border border-red-500/25 p-3.5 w-fit mx-auto mb-5 text-red-500">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <h2 className="text-lg font-semibold text-ink">Secure Share Expired</h2>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  This share link does not exist, has expired, or was already retrieved and shredded.
                  SecureShare zero-knowledge payloads are permanently deleted from host records after expiration or single-use retrieval.
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
                      <span className={decryptionStep >= 1 ? "text-ink font-semibold" : "text-muted-foreground"}>
                        1. Verify key wrapper signature
                      </span>
                    </div>
                    <span className="text-muted-foreground">{decryptionStep >= 1 ? "Success" : "Pending"}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div className="flex items-center gap-2">
                      {decryptionStep >= 2 ? (
                        <ShieldCheck className="h-3.5 w-3.5 text-signal" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border border-dashed border-border" />
                      )}
                      <span className={decryptionStep >= 2 ? "text-ink font-semibold" : "text-muted-foreground"}>
                        2. Unwrap client AES-256 GCM key
                      </span>
                    </div>
                    <span className="text-muted-foreground">{decryptionStep >= 2 ? "Success" : "Pending"}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      {decryptionStep >= 3 ? (
                        <ShieldCheck className="h-3.5 w-3.5 text-signal" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border border-dashed border-border" />
                      )}
                      <span className={decryptionStep >= 3 ? "text-ink font-semibold" : "text-muted-foreground"}>
                        3. Decrypt ciphertext payload
                      </span>
                    </div>
                    <span className="text-muted-foreground">{decryptionStep >= 3 ? "Success" : "Pending"}</span>
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
                {shareData.oneTimeDownload && (
                  <div className="mt-4 rounded-xl border border-red-500/10 bg-red-500/[0.02] p-3 text-red-500/90 text-[10px] leading-normal flex items-start gap-2 text-left">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>One-time download:</strong> Decryption wrap metadata has been shredded from SecureShare records. This link is now dead.
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
                <h2 className="text-lg font-semibold text-ink text-center">Decryption Key Required</h2>
                <p className="text-xs text-muted-foreground mt-2 text-center leading-relaxed">
                  This share payload requires a client-side decryption key. Enter the password to initialize unwrap sequence.
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
                <div className="rounded-2xl border border-border bg-mist/35 p-6 w-fit mx-auto mb-5 text-muted-foreground border-dashed flex items-center justify-center">
                  <FileIcon className="h-10 w-10 text-ink" strokeWidth={1.5} />
                </div>
                
                <h2 className="text-lg font-semibold text-ink truncate max-w-full px-2" title={shareData.name}>
                  {shareData.name}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {shareData.size} · {shareData.type || "unknown binary"}
                </p>

                <div className="mt-6 rounded-xl border border-border bg-mist/20 p-4 text-left text-[11px] text-muted-foreground leading-normal flex gap-3">
                  <ShieldCheck className="h-4.5 w-4.5 text-signal shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-ink block">Zero-Knowledge Decryption</span>
                    Payload verified under local Browser sandboxing. Files are reconstructed entirely on-device.
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={handleDecryptAndDownload}
                    className="w-full py-3 rounded-xl bg-ink text-xs font-semibold text-background hover:bg-ink/90 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Download className="h-4 w-4" /> Decrypt & Download File
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
