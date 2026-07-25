import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Check,
  Search,
  Terminal,
  BookOpen,
  Cpu,
  ShieldCheck,
  Code,
  Lock,
  Key,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { LogoMark } from "@/components/secureshare";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
});

interface CodeSnippet {
  curl: string;
  js: string;
  python: string;
}

interface DocSection {
  id: string;
  category: string;
  title: string;
  content: React.ReactNode;
  code?: CodeSnippet;
}

function DocsPage() {
  const [activeSection, setActiveSection] = useState("quickstart");
  const [activeTab, setActiveTab] = useState<"curl" | "js" | "python">("curl");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const contentRefs = {
    quickstart: useRef<HTMLDivElement>(null),
    concepts: useRef<HTMLDivElement>(null),
    "api-create": useRef<HTMLDivElement>(null),
    "api-revoke": useRef<HTMLDivElement>(null),
    sdks: useRef<HTMLDivElement>(null),
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Scroll to section on click
  const scrollToSection = (id: keyof typeof contentRefs) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = contentRefs[id].current;
    if (element) {
      const offset = 90; // account for header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;

      for (const [id, ref] of Object.entries(contentRefs)) {
        const element = ref.current;
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const sections: DocSection[] = [
    {
      id: "quickstart",
      category: "Getting Started",
      title: "Quickstart Guide",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            SecureShare provides client-side zero-knowledge encryption infrastructure for modern
            organizations. By using our Developer Tools, you can encrypt and distribute files programmatically.
          </p>
          <div className="rounded-xl border border-border bg-muted/35 p-4">
            <h4 className="flex items-center gap-2 font-mono text-xs font-semibold text-ink uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" /> Prerequisites
            </h4>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              You will need an active developer account and an API Key generated from your SecureShare dashboard.
              All API requests must be sent over HTTPS.
            </p>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Follow our 3-step setup to upload, encrypt, and share your first dataset securely.
          </p>
        </div>
      ),
      code: {
        curl: `# Install CLI tool and authenticate\ncurl -fsSL https://get.secureshare.dev | sh\nsecureshare auth login --key sec_live_8f8a12bc9f...`,
        js: `// Install dependencies\n// npm install @secureshare/client\nimport { SecureShare } from '@secureshare/client';\n\nconst client = new SecureShare({ apiKey: 'sec_live_8f...' });`,
        python: `# Install library\n# pip install secureshare-client\nfrom secureshare import SecureShare\n\nclient = SecureShare(api_key="sec_live_8f...")`,
      },
    },
    {
      id: "concepts",
      category: "Core Architecture",
      title: "Cryptographic Design",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            SecureShare is designed on zero-knowledge architecture. Neither our servers nor any intermediary
            can read your uploaded contents. Files are encrypted client-side before upload, using a hybrid cryptosystem.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-5 bg-card">
              <Lock className="h-5 w-5 text-signal" />
              <h4 className="mt-3 font-semibold text-foreground">Symmetric Encryption</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Files are partitioned and encrypted locally using AES-GCM 256-bit keys generated in the browser or terminal.
              </p>
            </div>
            <div className="rounded-xl border border-border p-5 bg-card">
              <Key className="h-5 w-5 text-signal" />
              <h4 className="mt-3 font-semibold text-foreground">Asymmetric Key Wrapping</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                The symmetric file key is wrapped using RSA-OAEP 4096-bit keys and stored securely, linked only to authorized roles.
              </p>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            When access is revoked, SecureShare shreds the key wrap metadata, rendering the cyphertext permanently unrecoverable.
          </p>
        </div>
      ),
    },
    {
      id: "api-create",
      category: "API Reference",
      title: "Create Secure Share",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Use this endpoint to programmatically prepare and register a share payload. You will receive an upload URI where
            you can put your encrypted file chunks.
          </p>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="rounded bg-signal/10 px-2 py-0.5 font-bold text-signal">POST</span>
            <span className="text-muted-foreground">https://api.secureshare.dev/v1/shares</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            You can configure sharing parameters such as expiry times, maximum downloads, password protection,
            and compliance tracking flags.
          </p>
        </div>
      ),
      code: {
        curl: `curl -X POST https://api.secureshare.dev/v1/shares \\\n  -H "Authorization: Bearer sec_live_8f..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "name": "financial_report.xlsx",\n    "expiry": "7d",\n    "max_downloads": 5,\n    "require_mfa": true\n  }'`,
        js: `// Register a share payload\nconst share = await client.shares.create({\n  name: 'financial_report.xlsx',\n  expiry: '7d',\n  maxDownloads: 5,\n  requireMfa: true\n});\nconsole.log(\`Upload file chunks to: \${share.uploadUrl}\`);`,
        python: `# Register a share payload\nshare = client.shares.create(\n    name="financial_report.xlsx",\n    expiry="7d",\n    max_downloads=5,\n    require_mfa=True\n)\nprint(f"Upload file chunks to: {share.upload_url}")`,
      },
    },
    {
      id: "api-revoke",
      category: "API Reference",
      title: "Instant Revocation",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Revoke a share link instantly. This endpoint invalidates access keys and deletes the key-wrapping metadata.
            Any active sessions download links will be aborted immediately.
          </p>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="rounded bg-destructive/10 px-2 py-0.5 font-bold text-destructive">DELETE</span>
            <span className="text-muted-foreground">https://api.secureshare.dev/v1/shares/:share_id</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            This operation is instant and completely irreversible.
          </p>
        </div>
      ),
      code: {
        curl: `curl -X DELETE https://api.secureshare.dev/v1/shares/sh_923c8ab2 \\\n  -H "Authorization: Bearer sec_live_8f..."`,
        js: `// Revoke the share instantly\nawait client.shares.revoke('sh_923c8ab2');\nconsole.log('Share access revoked successfully.');`,
        python: `# Revoke the share instantly\nclient.shares.revoke("sh_923c8ab2")\nprint("Share access revoked successfully.")`,
      },
    },
    {
      id: "sdks",
      category: "Integration",
      title: "SDKs & Client Libraries",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Integrate client-side encryption into your native applications. Our SDKs automatically handle key generation,
            chunk partitioning, local WebCrypto encryption, and multi-part upload flow.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <a href="#" className="flex items-center justify-between rounded-xl border border-border p-4 hover:border-border-strong hover:bg-muted/5 transition-all">
              <span className="font-semibold text-sm">NodeJS SDK</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a href="#" className="flex items-center justify-between rounded-xl border border-border p-4 hover:border-border-strong hover:bg-muted/5 transition-all">
              <span className="font-semibold text-sm">Python SDK</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a href="#" className="flex items-center justify-between rounded-xl border border-border p-4 hover:border-border-strong hover:bg-muted/5 transition-all">
              <span className="font-semibold text-sm">Go Library</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a href="#" className="flex items-center justify-between rounded-xl border border-border p-4 hover:border-border-strong hover:bg-muted/5 transition-all">
              <span className="font-semibold text-sm">React Component Wrapper</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          </div>
        </div>
      ),
    },
  ];

  // Group sections by category for sidebar
  const categoriesMap = sections.reduce(
    (acc, section) => {
      if (!acc[section.category]) {
        acc[section.category] = [];
      }
      acc[section.category].push(section);
      return acc;
    },
    {} as Record<string, DocSection[]>,
  );

  // Filter sections by search query
  const filteredCategories = Object.entries(categoriesMap).reduce(
    (acc, [category, catSections]) => {
      const matchingSections = catSections.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.category.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      if (matchingSections.length > 0) {
        acc[category] = matchingSections;
      }
      return acc;
    },
    {} as Record<string, DocSection[]>,
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground grain font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:px-10">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 hover:opacity-95 transition-opacity">
              <LogoMark />
              <span className="font-display text-xl font-medium">SecureShare</span>
            </Link>
            <div className="hidden h-5 w-px bg-border sm:block" />
            <span className="hidden font-mono text-xs font-semibold text-muted-foreground tracking-wider uppercase sm:inline">
              Developer Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 hover:bg-mist md:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Workspace container */}
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="grid md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] gap-10">
          {/* Sidebar (Desktop) */}
          <aside className="sticky top-24 hidden h-[calc(100vh-120px)] overflow-y-auto pr-6 md:block">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-4 text-xs outline-none transition-colors focus:border-border-strong focus:ring-1 focus:ring-ring"
              />
            </div>

            <nav className="space-y-6">
              {Object.entries(filteredCategories).map(([category, catSections]) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {category}
                  </h4>
                  <ul className="space-y-1">
                    {catSections.map((s) => (
                      <li key={s.id}>
                        <button
                          onClick={() => scrollToSection(s.id as keyof typeof contentRefs)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                            activeSection === s.id
                              ? "bg-ink text-background"
                              : "text-muted-foreground hover:bg-mist hover:text-ink"
                          }`}
                        >
                          {s.title}
                          <ChevronRight
                            className={`h-3 w-3 transition-transform ${
                              activeSection === s.id ? "rotate-90 opacity-100" : "opacity-0"
                            }`}
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {Object.keys(filteredCategories).length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">No documentation matches your search.</p>
              )}
            </nav>
          </aside>

          {/* Mobile Navigation Drawer */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-x-0 top-16 z-30 border-b border-border bg-background p-6 md:hidden max-h-[80vh] overflow-y-auto shadow-xl"
              >
                <div className="relative mb-6">
                  <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search docs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-4 text-xs outline-none focus:border-border-strong"
                  />
                </div>

                <nav className="space-y-6">
                  {Object.entries(filteredCategories).map(([category, catSections]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {category}
                      </h4>
                      <ul className="space-y-1">
                        {catSections.map((s) => (
                          <li key={s.id}>
                            <button
                              onClick={() => scrollToSection(s.id as keyof typeof contentRefs)}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                                activeSection === s.id
                                  ? "bg-ink text-background"
                                  : "text-muted-foreground hover:bg-mist hover:text-ink"
                              }`}
                            >
                              {s.title}
                              <ChevronRight
                                className={`h-3 w-3 ${
                                  activeSection === s.id ? "rotate-90" : "opacity-0"
                                }`}
                              />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content Area */}
          <main className="min-w-0 py-10 pb-24 md:py-12">
            <div className="space-y-16">
              {sections.map((section) => (
                <div
                  key={section.id}
                  ref={contentRefs[section.id as keyof typeof contentRefs]}
                  className="scroll-mt-24 border-b border-border/60 pb-12 last:border-0"
                >
                  <span className="font-mono text-[10px] font-semibold tracking-wider text-muted-foreground uppercase bg-mist px-2 py-0.5 rounded">
                    {section.category}
                  </span>
                  <h2 className="mt-3 text-3xl font-medium tracking-tight text-ink">
                    {section.title}
                  </h2>

                  <div className="mt-6 grid gap-8 lg:grid-cols-2">
                    {/* Left Column: Descriptions */}
                    <div className="text-sm font-sans">{section.content}</div>

                    {/* Right Column: Code snippets (if available) */}
                    {section.code && (
                      <div className="flex flex-col rounded-2xl border border-border bg-surface overflow-hidden shadow-sm h-fit">
                        {/* Code Header / Tab Bar */}
                        <div className="flex items-center justify-between border-b border-border/80 bg-mist px-4 py-2">
                          <div className="flex gap-2">
                            {(["curl", "js", "python"] as const).map((lang) => (
                              <button
                                key={lang}
                                onClick={() => setActiveTab(lang)}
                                className={`rounded px-2.5 py-1 font-mono text-[10px] font-bold uppercase transition-all ${
                                  activeTab === lang
                                    ? "bg-ink text-background shadow-sm"
                                    : "text-muted-foreground hover:text-ink"
                                }`}
                              >
                                {lang === "curl" ? "cURL" : lang === "js" ? "NodeJS" : "Python"}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                section.code![activeTab],
                                `${section.id}-${activeTab}`,
                              )
                            }
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-border hover:text-ink"
                            title="Copy code"
                          >
                            {copiedId === `${section.id}-${activeTab}` ? (
                              <Check className="h-3.5 w-3.5 text-signal" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Code Body */}
                        <div className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-foreground/90 selection:bg-ink/10">
                          <pre>
                            <code>{section.code[activeTab]}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
