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
  ShieldAlert,
  Database,
  Eye,
  Activity,
  Layers,
  Server,
  HelpCircle,
  TrendingUp,
  History,
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
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
  code?: CodeSnippet;
}

function DocsPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [activeTab, setActiveTab] = useState<"curl" | "js" | "python">("curl");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const contentRefs = {
    introduction: useRef<HTMLDivElement>(null),
    "getting-started": useRef<HTMLDivElement>(null),
    features: useRef<HTMLDivElement>(null),
    authentication: useRef<HTMLDivElement>(null),
    "file-sharing": useRef<HTMLDivElement>(null),
    "privacy-policies": useRef<HTMLDivElement>(null),
    encryption: useRef<HTMLDivElement>(null),
    "access-control": useRef<HTMLDivElement>(null),
    "secure-links": useRef<HTMLDivElement>(null),
    "audit-logs": useRef<HTMLDivElement>(null),
    storage: useRef<HTMLDivElement>(null),
    "api-reference": useRef<HTMLDivElement>(null),
    sdks: useRef<HTMLDivElement>(null),
    webhooks: useRef<HTMLDivElement>(null),
    architecture: useRef<HTMLDivElement>(null),
    security: useRef<HTMLDivElement>(null),
    deployment: useRef<HTMLDivElement>(null),
    faq: useRef<HTMLDivElement>(null),
    roadmap: useRef<HTMLDivElement>(null),
    changelog: useRef<HTMLDivElement>(null),
  };

  const copyToClipboard = (text: string, id: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        })
        .catch(() => {
          fallbackCopyText(text, id);
        });
    } else {
      fallbackCopyText(text, id);
    }
  };

  const fallbackCopyText = (text: string, id: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      if (document.execCommand("copy")) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      console.warn("execCommand fallback failed", err);
    }
    document.body.removeChild(textArea);
  };

  const scrollToSection = (id: keyof typeof contentRefs) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = contentRefs[id].current;
    if (element) {
      const offset = 90; // header height
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

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;

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

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sections: DocSection[] = [
    {
      id: "introduction",
      category: "Overview",
      title: "Introduction",
      icon: BookOpen,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Welcome to the <strong>SecureShare</strong> developer documentation. SecureShare is an
            enterprise-grade, zero-knowledge privacy infrastructure that enables modern
            organizations to share sensitive files, datasets, and credentials with external partners
            without risking data leaks.
          </p>
          <p>
            Unlike traditional file sharing platforms, SecureShare encrypts all payloads
            client-side, meaning that data is encrypted in the browser or terminal before reaching
            our servers. Neither SecureShare nor cloud hosts ever have access to the raw files or
            decryption keys.
          </p>
          <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs">
            <span className="font-semibold text-ink">Zero-Knowledge Guarantee:</span> We store
            cryptographically wrapped keys and encrypted ciphertext blocks. Decryption is performed
            entirely in authorized client environments using keys derived or kept client-side.
          </div>
        </div>
      ),
    },
    {
      id: "getting-started",
      category: "Overview",
      title: "Getting Started",
      icon: Terminal,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Get up and running with SecureShare in less than five minutes. To begin
            programmatically, you will install the client-side binary or SDK, login, and upload your
            first file.
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Create a developer account in the SecureShare console and obtain your API token.
            </li>
            <li>Install the appropriate library or CLI tool for your stack.</li>
            <li>Initialize the client with your credentials to encrypt and share datasets.</li>
          </ol>
        </div>
      ),
      code: {
        curl: `# Install the CLI tool\ncurl -fsSL https://get.secureshare.dev | sh\n\n# Authenticate your terminal session\nsecureshare auth login --key sec_live_8f8a12bc9f91a27e...`,
        js: `// Install via npm\n// npm install @secureshare/client\n\nimport { SecureShare } from '@secureshare/client';\nconst client = new SecureShare({ apiKey: 'sec_live_8f8a12bc...' });`,
        python: `# Install via pip\n# pip install secureshare-client\n\nfrom secureshare import SecureShare\nclient = SecureShare(api_key="sec_live_8f8a12bc...")`,
      },
    },
    {
      id: "features",
      category: "Overview",
      title: "Features",
      icon: Cpu,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>SecureShare is built from the ground up for high-trust environments:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Client-Side Hybrid Encryption:</strong> Auto-generates local key material for
              file chunks.
            </li>
            <li>
              <strong>Dynamic Compliance Guardrails:</strong> Automatically checks data structures
              for GDPR, HIPAA, and custom PII constraints before uploading.
            </li>
            <li>
              <strong>Access Expiry Controls:</strong> Revoke access automatically based on date,
              view limit, or geolocation.
            </li>
            <li>
              <strong>Immutable Cryptographic Audit Trails:</strong> Cryptographically signs access
              actions to create tamper-proof logs.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "authentication",
      category: "Core Concepts",
      title: "Authentication",
      icon: Lock,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Every API request to the SecureShare platform requires a secure bearer token. Tokens are
            generated in the SecureShare Console with granular read/write and scope permissions.
          </p>
          <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs font-mono">
            Authorization: Bearer sec_live_8f8a12bc...
          </div>
          <p>
            Keep your API keys confidential. Do not expose them in client-side code that is shipped
            to public browsers. Use our server-side wrappers or ephemeral browser-session keys
            instead.
          </p>
        </div>
      ),
      code: {
        curl: `curl -X GET https://api.secureshare.dev/v1/auth/verify \\\n  -H "Authorization: Bearer sec_live_8f8a12bc..."`,
        js: `// Verification is handled automatically during client initialization\nconst verified = await client.auth.verify();\nconsole.log('Session Status:', verified.active);`,
        python: `# Verify client connection scope\nstatus = client.auth.verify()\nprint(f"Session Active: {status.active}")`,
      },
    },
    {
      id: "file-sharing",
      category: "Core Concepts",
      title: "File Sharing",
      icon: ExternalLink,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Files shared via SecureShare are split into chunks, encrypted locally, and streamed
            directly to object storage. A share link is then generated containing the metadata
            required for decryption.
          </p>
          <p>
            The decryption key is appended in the URL hash fragment (e.g.,{" "}
            <code className="text-xs bg-muted px-1 rounded">#key=...</code>). Since hash fragments
            are never sent to the hosting server during HTTP requests, the key remains strictly in
            the recipient's browser.
          </p>
        </div>
      ),
      code: {
        curl: `# Initialize share payload & get upload URI\ncurl -X POST https://api.secureshare.dev/v1/shares \\\n  -H "Authorization: Bearer sec_live_8f..." \\\n  -H "Content-Type: application/json" \\\n  -d '{"name": "dataset.csv", "size": 1048576}'`,
        js: `// Encrypt file and generate sharing link\nconst fileBuffer = getFileBuffer('dataset.csv');\nconst share = await client.shares.encryptAndShare(fileBuffer, {\n  name: 'dataset.csv',\n  expiresIn: '24h'\n});\nconsole.log('Share URL:', share.url);`,
        python: `# Encrypt and share dataset\nwith open("dataset.csv", "rb") as f:\n    share = client.shares.encrypt_and_share(\n        f.read(), \n        name="dataset.csv", \n        expires_in="24h"\n    )\nprint(f"Share URL: {share.url}")`,
      },
    },
    {
      id: "privacy-policies",
      category: "Core Concepts",
      title: "Privacy Policies",
      icon: ShieldAlert,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Before encryption occurs, the SecureShare policy engine scans the file contents for PII,
            PHI, or regulatory markers.
          </p>
          <p>
            If sensitive keys or violations (e.g. unhashed social security numbers, medical record
            details) are found, the upload will block, notify the developer, or request an explicit
            compliance override based on workspace configurations.
          </p>
        </div>
      ),
    },
    {
      id: "encryption",
      category: "Core Concepts",
      title: "Encryption Details",
      icon: Key,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>Our cryptographic envelope utilizes standard, proven primitives:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Symmetric Cipher:</strong> AES-256-GCM for file payload encryption. Each file
              has a unique key.
            </li>
            <li>
              <strong>Asymmetric Wrapping:</strong> RSA-OAEP 4096-bit or Elliptic Curve secp256k1
              keys wrap the symmetric key.
            </li>
            <li>
              <strong>Derivation function:</strong> PBKDF2 with SHA-256 is used if password
              protection is enabled.
            </li>
          </ul>
          <p>
            Cryptographic signatures ensure that files cannot be tampered with in-flight. If a
            single byte of ciphertext is modified on the storage tier, decryption will fail
            validation.
          </p>
        </div>
      ),
    },
    {
      id: "access-control",
      category: "Core Concepts",
      title: "Access Control",
      icon: ShieldCheck,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>Define precisely who can access shared assets. SecureShare supports:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Email verification:</strong> Requires verification pins sent to recipient
              domains.
            </li>
            <li>
              <strong>IP/Geo-fencing:</strong> Restricts downloads to corporate network blocks or
              specific countries.
            </li>
            <li>
              <strong>MFA Enforcement:</strong> Forces downloading users to authenticate with
              WebAuthn or SMS pins.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "secure-links",
      category: "Core Concepts",
      title: "Secure Links",
      icon: Code,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Secure links are dynamic redirect pathways. Instead of pointing to raw storage targets,
            links point to a SecureShare verification router that validates expiration criteria,
            download counters, and policy rules.
          </p>
          <p>
            If a link is set to "one-time download", the token representing the keywrap mapping is
            deleted from the database immediately upon the first byte stream request.
          </p>
        </div>
      ),
    },
    {
      id: "audit-logs",
      category: "Core Concepts",
      title: "Audit Logs",
      icon: Activity,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            All access actions (link creation, download, failed validation, revocation) generate
            signed events stored in the SecureShare audit ledger.
          </p>
          <p>
            These logs can be integrated directly with SIEM providers (like Splunk, Datadog) using
            webhooks, ensuring that compliance monitors have real-time tracking of files.
          </p>
        </div>
      ),
    },
    {
      id: "storage",
      category: "Core Concepts",
      title: "Storage",
      icon: Database,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            By default, encrypted blobs are stored in our secure, globally distributed Cloudflare R2
            storage containers. For enterprise clients, we support **BYOS (Bring Your Own
            Storage)**.
          </p>
          <p>
            You can configure your workspace to route encrypted ciphertext directly to your AWS S3,
            Google Cloud Storage, or Azure Blob Storage instances.
          </p>
        </div>
      ),
    },
    {
      id: "api-reference",
      category: "Developer Reference",
      title: "API Reference",
      icon: Layers,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Interact directly with the SecureShare REST engine. All responses return JSON
            formatting.
          </p>
          <div className="space-y-2">
            <h5 className="font-semibold text-ink">Endpoints:</h5>
            <div className="grid gap-2 text-xs">
              <div className="flex justify-between border-b border-border py-1">
                <span className="font-mono text-signal">POST /v1/shares</span>
                <span>Initialize new share and get upload URL</span>
              </div>
              <div className="flex justify-between border-b border-border py-1">
                <span className="font-mono text-blue-500">GET /v1/shares/:id</span>
                <span>Fetch encrypted share metadata</span>
              </div>
              <div className="flex justify-between border-b border-border py-1">
                <span className="font-mono text-destructive">DELETE /v1/shares/:id</span>
                <span>Revoke share & delete keys instantly</span>
              </div>
            </div>
          </div>
        </div>
      ),
      code: {
        curl: `# Request revocation\ncurl -X DELETE https://api.secureshare.dev/v1/shares/sh_9b2c8a \\\n  -H "Authorization: Bearer sec_live_8f..."`,
        js: `// Revoke using the JS library\nawait client.shares.revoke('sh_9b2c8a');`,
        python: `# Revoke using the Python library\nclient.shares.revoke("sh_9b2c8a")`,
      },
    },
    {
      id: "sdks",
      category: "Developer Reference",
      title: "SDKs & Libraries",
      icon: Code,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            We maintain native wrappers for multiple languages to simplify WebCrypto calculations
            and chunk-upload mechanics.
          </p>
          <p>
            Check out the official GitHub repositories to download release builds, review tests, and
            submit pull requests.
          </p>
        </div>
      ),
      code: {
        curl: `# Browse CLI documentation on GitHub\n# https://github.com/secureshare/cli`,
        js: `// JS SDK features automatic key wrapping, chunking and streaming\nimport { SecureShare } from '@secureshare/client';\nconst client = new SecureShare({ apiKey: 'sec_live_...' });`,
        python: `# Python SDK handles cryptography via PyCryptodome internally\nfrom secureshare import SecureShare\nclient = SecureShare(api_key="sec_live_...")`,
      },
    },
    {
      id: "webhooks",
      category: "Developer Reference",
      title: "Webhooks",
      icon: Activity,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Receive HTTP POST notifications when events occur in your account. Webhook payloads are
            signed with a shared secret so you can verify they originated from SecureShare.
          </p>
          <p>
            Supported events: <code className="text-xs bg-muted px-1 rounded">share.created</code>,
            <code className="text-xs bg-muted px-1 rounded">share.accessed</code>,
            <code className="text-xs bg-muted px-1 rounded">share.revoked</code>,
            <code className="text-xs bg-muted px-1 rounded">compliance.failed</code>.
          </p>
        </div>
      ),
      code: {
        curl: `# Webhook Header verification key\n# SecureShare-Signature: t=1672531199,v1=9f8a...`,
        js: `// Node.js Express Webhook receiver validation\napp.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {\n  const sig = req.headers['secureshare-signature'];\n  const event = client.webhooks.constructEvent(req.body, sig, endpointSecret);\n  console.log('Verified Event:', event.type);\n  res.sendStatus(200);\n});`,
        python: `# Python Flask Webhook verification\n@app.route('/webhook', methods=['POST'])\ndef webhook():\n    sig = request.headers.get('SecureShare-Signature')\n    event = client.webhooks.construct_event(request.data, sig, endpoint_secret)\n    print(f"Verified Event: {event['type']}")\n    return '', 200`,
      },
    },
    {
      id: "architecture",
      category: "Architecture & Security",
      title: "System Architecture",
      icon: Layers,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>SecureShare is designed to segment storage and key handling.</p>
          <pre className="p-4 rounded-xl bg-muted/30 border border-border text-[10px] leading-relaxed font-mono overflow-x-auto text-ink">
            {`+-----------------+       Encrypts File & Wraps Key       +--------------------+
|  Client Browser | ------------------------------------> | Cloudflare R2 / S3 |
|  or CLI Session |                                       |  (Ciphertext Blob) |
+-----------------+                                       +--------------------+
         |
         | Sends encrypted key wrap metadata
         v
+-----------------+
| SecureShare API |  (Stores wrapped keys, access policies & logs)
+-----------------+`}
          </pre>
          <p>
            By storing wrapped keys in the SecureShare metadata database and the actual file
            ciphertext in object storage, compromise of a single layer does not expose any user
            files.
          </p>
        </div>
      ),
    },
    {
      id: "security",
      category: "Architecture & Security",
      title: "Security Standards",
      icon: ShieldCheck,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Our cryptographic models undergo continuous third-party penetration testing. SecureShare
            is SOC 2 Type II certified, and our zero-knowledge models are HIPAA, GDPR, and ISO 27001
            compliant.
          </p>
          <p>
            We run an active Bug Bounty program on Bugcrowd. If you discover a cryptographic
            vulnerability, please submit a report to receive a bounty reward.
          </p>
        </div>
      ),
    },
    {
      id: "deployment",
      category: "Architecture & Security",
      title: "Deployment",
      icon: Server,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            SecureShare can be self-hosted inside your private cloud using Docker. Self-hosting
            ensures that even the metadata ledger, audit logs, and keys are stored on physical
            servers you own.
          </p>
          <p>
            Modify the environment variables in your compose stack to bind your database and cloud
            bucket targets.
          </p>
        </div>
      ),
      code: {
        curl: `# Run migrations and start stack\ndocker-compose up -d`,
        js: `# docker-compose.yml configuration snippet\nversion: '3.8'\nservices:\n  secureshare-api:\n    image: secureshare/api:latest\n    ports:\n      - "4000:4000"\n    environment:\n      - DATABASE_URL=postgresql://...\n      - STORAGE_PROVIDER=s3`,
        python: `# Environment file (.env)\nDATABASE_URL="postgresql://postgres:pass@localhost:5432/secureshare"\nPORT=4000\nSTORAGE_PROVIDER=s3\nAWS_ACCESS_KEY_ID=minioadmin\nAWS_SECRET_ACCESS_KEY=minioadmin`,
      },
    },
    {
      id: "faq",
      category: "Resources",
      title: "FAQ",
      icon: HelpCircle,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <div>
            <h5 className="font-semibold text-ink">What is the maximum file size I can share?</h5>
            <p className="mt-1 text-xs">
              SecureShare supports files up to 50 GB. Larger files are partitioned into 10 MB chunks
              and encrypted concurrently.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-ink">
              What happens if I lose my master encryption passphrase?
            </h5>
            <p className="mt-1 text-xs">
              Due to zero-knowledge constraints, SecureShare cannot recover files if your private
              keys are lost. Please backup keys in HSM or secure keyvault managers.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "roadmap",
      category: "Resources",
      title: "Roadmap",
      icon: TrendingUp,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Our upcoming product development releases focus on expanding compliance configurations:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs">
            <li>
              <strong>Q3 2026:</strong> Decentralized multi-sig key agreements for high-value
              operations.
            </li>
            <li>
              <strong>Q4 2026:</strong> Fully homomorphic query support over encrypted index
              structures.
            </li>
            <li>
              <strong>Q1 2027:</strong> Hardware Security Module (HSM) direct integrations (Yubikey,
              Nitrokey).
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "changelog",
      category: "Resources",
      title: "Changelog",
      icon: History,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed font-sans">
          <div>
            <h5 className="font-semibold text-ink">v1.1.0 (July 2026)</h5>
            <p className="text-xs text-muted-foreground">
              Introduced client-side chunk parallelization. Performance upload speed increased by
              3.2x.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-ink">v1.0.0 (June 2026)</h5>
            <p className="text-xs text-muted-foreground">
              Initial stable release. Full WebCrypto integration, dashboard panel, and PostgreSQL
              prisma backing.
            </p>
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
                <p className="text-center text-xs text-muted-foreground py-4">
                  No documentation matches your search.
                </p>
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
                  <span className="font-mono text-[10px] font-semibold tracking-wider text-muted-foreground uppercase bg-mist px-2 py-0.5 rounded flex items-center gap-1.5 w-fit">
                    {section.icon && <section.icon className="h-3 w-3" />}
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
