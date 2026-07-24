import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Key, 
  Clock, 
  Eye, 
  Copy, 
  Check, 
  Trash2, 
  ArrowLeft, 
  FileText, 
  AlertCircle, 
  RefreshCw,
  EyeOff
} from "lucide-react";
import { MagneticButton } from "@/components/secureshare";

export const Route = createFileRoute("/share")({
  component: SharePage,
});

interface UploadedFile {
  name: string;
  size: string;
  type: string;
}

function SharePage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptionStep, setEncryptionStep] = useState(0);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  
  // Share options
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [expiry, setExpiry] = useState("24h");
  const [oneTimeDownload, setOneTimeDownload] = useState(false);
  const [gdprCompliance, setGdprCompliance] = useState(true);
  const [hipaaCompliance, setHipaaCompliance] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelected(droppedFile.name, droppedFile.size, droppedFile.type);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      handleFileSelected(selectedFile.name, selectedFile.size, selectedFile.type);
    }
  };

  const handleFileSelected = (name: string, sizeBytes: number, type: string) => {
    const sizeKB = sizeBytes / 1024;
    const sizeStr = sizeKB > 1024 
      ? `${(sizeKB / 1024).toFixed(2)} MB` 
      : `${sizeKB.toFixed(1)} KB`;
    
    setFile({
      name,
      size: sizeStr,
      type: type || "application/octet-stream"
    });
  };

  const handleStartSharing = () => {
    if (!file) return;
    
    setIsEncrypting(true);
    setEncryptionStep(0);

    // Simulate cryptographic workflow
    setTimeout(() => setEncryptionStep(1), 1000); // AES-256 key generation
    setTimeout(() => setEncryptionStep(2), 2200); // Local Client-side Encryption
    setTimeout(() => setEncryptionStep(3), 3400); // Compliance Policy verification
    setTimeout(() => {
      // Complete & Generate Link
      setIsEncrypting(false);
      const randomId = Math.random().toString(36).substring(2, 7);
      setShareLink(`https://secureshare.io/f/${randomId}`);
    }, 4600);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFile(null);
    setShareLink("");
    setEncryptionStep(0);
    setIsEncrypting(false);
    setPassword("");
    setRequirePassword(false);
  };

  const formatSize = (size: string) => {
    return size;
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans antialiased text-ink">
      {/* Background patterns */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-signal/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:px-10">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
            <svg width="22" height="22" viewBox="0 0 26 26" fill="none" className="text-signal">
              <rect x="1" y="1" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="1.6" />
              <path d="M8 13.5L11.5 17L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>SecureShare</span>
          </Link>
          
          <Link to="/" className="text-xs font-semibold text-muted-foreground transition-colors hover:text-ink flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-[1000px] px-6 py-12 md:px-10 md:py-16 relative z-10">
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Secure File Sharing
          </h1>
          <p className="mt-2.5 text-muted-foreground text-base max-w-lg">
            Zero-knowledge client-side encryption. Securely upload, configure compliance policies, and generate an immutable share link.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          
          {/* Left Column: Upload & Encryption Visualizer */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <AnimatePresence mode="wait">
                {!file && !isEncrypting && !shareLink && (
                  <motion.div 
                    key="upload-zone"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`relative flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center transition-all cursor-pointer ${
                      dragActive 
                        ? "border-signal bg-signal/[0.02]" 
                        : "border-border hover:border-muted-foreground bg-mist/20"
                    }`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      className="hidden" 
                      onChange={handleFileInput}
                    />
                    <div className="rounded-full bg-background p-3.5 shadow-sm border border-border">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-ink">
                      Drag & drop your file here
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      or click to browse from device (Up to 10GB)
                    </p>
                    <div className="mt-6 flex gap-2.5 text-[10px] font-mono text-muted-foreground">
                      <span className="flex items-center gap-1"><Lock className="h-3 w-3 text-signal" /> Local Encryption</span>
                      <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-signal" /> Policy Check</span>
                    </div>
                  </motion.div>
                )}

                {file && !isEncrypting && !shareLink && (
                  <motion.div 
                    key="file-selected"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="flex flex-col items-center justify-center py-8 text-center"
                  >
                    <div className="rounded-2xl border border-border bg-[#fcfcfc] p-6 shadow-sm w-full max-w-sm flex items-center gap-4 mb-8 text-left">
                      <div className="p-3.5 rounded-xl bg-mist text-muted-foreground border border-border">
                        <FileText className="h-7 w-7" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-ink truncate">{file.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{file.size} · {file.type}</p>
                      </div>
                      <button 
                        onClick={handleReset}
                        className="p-2 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-50/50 transition-colors"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    <div className="flex gap-3 w-full max-w-xs">
                      <button
                        onClick={handleReset}
                        className="flex-1 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-ink hover:bg-mist/35 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleStartSharing}
                        className="flex-1 py-2.5 rounded-xl bg-ink text-xs font-semibold text-background hover:bg-ink/90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Lock className="h-3.5 w-3.5" /> Encrypt & Share
                      </button>
                    </div>
                  </motion.div>
                )}

                {isEncrypting && (
                  <motion.div 
                    key="encrypting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-10 text-center"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-full border border-border flex items-center justify-center bg-background">
                        <RefreshCw className="h-6 w-6 text-signal animate-spin" />
                      </div>
                    </div>

                    <h3 className="text-base font-semibold text-ink">Cryptographic Pipeline Active</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Processing file using zero-knowledge infrastructure
                    </p>

                    <div className="w-full max-w-sm mt-8 space-y-4 text-left font-mono text-[10px]">
                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                        <div className="flex items-center gap-2">
                          {encryptionStep >= 1 ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-signal" />
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full border border-dashed border-border" />
                          )}
                          <span className={encryptionStep >= 1 ? "text-ink font-semibold" : "text-muted-foreground"}>
                            1. Generate ephemeral client keys
                          </span>
                        </div>
                        <span className="text-muted-foreground">{encryptionStep >= 1 ? "Success" : "Pending"}</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                        <div className="flex items-center gap-2">
                          {encryptionStep >= 2 ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-signal" />
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full border border-dashed border-border" />
                          )}
                          <span className={encryptionStep >= 2 ? "text-ink font-semibold" : "text-muted-foreground"}>
                            2. Local AES-256 GCM encryption
                          </span>
                        </div>
                        <span className="text-muted-foreground">{encryptionStep >= 2 ? "Success" : "Pending"}</span>
                      </div>

                      <div className="flex items-center justify-between pb-2">
                        <div className="flex items-center gap-2">
                          {encryptionStep >= 3 ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-signal" />
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full border border-dashed border-border" />
                          )}
                          <span className={encryptionStep >= 3 ? "text-ink font-semibold" : "text-muted-foreground"}>
                            3. Apply compliance policy filters
                          </span>
                        </div>
                        <span className="text-muted-foreground">{encryptionStep >= 3 ? "Success" : "Pending"}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {shareLink && (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-6 text-center"
                  >
                    <div className="rounded-full bg-signal/10 border border-signal/20 p-3 mb-4">
                      <ShieldCheck className="h-7 w-7 text-signal" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-ink">Link Generated Securely</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      The file payload has been compiled and is ready for secure retrieval.
                    </p>

                    <div className="w-full max-w-md mt-6 rounded-xl border border-border bg-[#fcfcfc] p-4 flex items-center gap-3">
                      <div className="flex-1 font-mono text-xs text-ink truncate text-left select-all px-1">
                        {shareLink}
                      </div>
                      <button 
                        onClick={handleCopyLink}
                        className="px-3.5 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold hover:bg-mist/30 transition-colors flex items-center gap-1"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-signal" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" /> Copy
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-8 flex gap-3 w-full max-w-xs">
                      <button
                        onClick={handleReset}
                        className="w-full py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-ink hover:bg-mist/35 transition-colors"
                      >
                        Share another file
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Safe sharing indicators info card */}
            <div className="rounded-2xl border border-border/80 bg-mist/10 p-5 flex gap-4 text-left">
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-ink">Zero Knowledge Cryptography</h4>
                <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                  Your files are encrypted inside your browser using web-crypto API before being transmitted. SecureShare never stores or has access to your decryption keys.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Settings & Configuration */}
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm text-left">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-6">
              Share Configuration
            </h3>

            <div className="space-y-6">
              {/* Expiry Options */}
              <div>
                <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Link Expiration
                </label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[
                    { label: "1 Hour", value: "1h" },
                    { label: "24 Hours", value: "24h" },
                    { label: "7 Days", value: "7d" },
                    { label: "Never", value: "never" }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setExpiry(opt.value)}
                      className={`py-2 text-[11px] rounded-lg border text-center font-medium transition-colors ${
                        expiry === opt.value 
                          ? "border-ink bg-ink text-background" 
                          : "border-border bg-background hover:bg-mist/20"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password Protection */}
              <div className="border-t border-border/60 pt-5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink flex items-center gap-1.5 cursor-pointer">
                    <Key className="h-3.5 w-3.5 text-muted-foreground" /> Password Protection
                  </label>
                  <input
                    type="checkbox"
                    checked={requirePassword}
                    onChange={(e) => setRequirePassword(e.target.checked)}
                    className="h-4 w-4 accent-signal rounded border-border"
                  />
                </div>
                {requirePassword && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3"
                  >
                    <input
                      type="password"
                      placeholder="Enter file decryption password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-ink"
                    />
                  </motion.div>
                )}
              </div>

              {/* Access Restrictions */}
              <div className="border-t border-border/60 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink flex items-center gap-1.5 cursor-pointer">
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> One-time Download
                  </label>
                  <input
                    type="checkbox"
                    checked={oneTimeDownload}
                    onChange={(e) => setOneTimeDownload(e.target.checked)}
                    className="h-4 w-4 accent-signal rounded border-border"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Automatically destroy the file payload and deactivate the link immediately after the first download.
                </p>
              </div>

              {/* Compliance Policies */}
              <div className="border-t border-border/60 pt-5 space-y-3.5">
                <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" /> Compliance Engines
                </label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-ink">GDPR Enforcement</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">Filter EU resident data transfers</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={gdprCompliance}
                      onChange={(e) => setGdprCompliance(e.target.checked)}
                      className="h-4 w-4 accent-signal rounded border-border"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-ink">HIPAA Audit Logs</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">Enable immutable clinical audit records</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={hipaaCompliance}
                      onChange={(e) => setHipaaCompliance(e.target.checked)}
                      className="h-4 w-4 accent-signal rounded border-border"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
