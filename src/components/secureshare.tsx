import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useScroll, useTransform, useInView, animate } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Lock,
  ShieldCheck,
  FileText,
  Users,
  Activity,
  KeyRound,
  Cloud,
  Fingerprint,
  Network,
  Eye,
  EyeOff,
  Check,
  X,
  Zap,
  Layers,
  Database,
  GitBranch,
  Terminal,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { gsap, ScrollTrigger } from "../lib/gsap";

/* ---------- Reveal ---------- */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [delay, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/* ---------- Word-by-word reveal ---------- */
export function WordReveal({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const spans = el.querySelectorAll(".word-span-inner");
      if (!spans.length) return;

      gsap.fromTo(
        spans,
        { y: "110%" },
        {
          y: "0%",
          duration: 0.8,
          stagger: 0.03,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [text]);

  const words = text.split(" ");
  return (
    <span ref={ref} className={cn("inline", className)}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <span className="word-span-inner inline-block">
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </span>
        </span>
      ))}
    </span>
  );
}

/* ---------- Spotlight Card ---------- */
export function SpotlightCard({
  children,
  className,
  glowColor = "oklch(0.62 0.16 148 / 0.12)",
}: {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-surface-elevated transition-all duration-300 hover:border-ink/80",
        className
      )}
      style={{
        "--mouse-x": `${coords.x}px`,
        "--mouse-y": `${coords.y}px`,
      } as any}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(350px circle at var(--mouse-x) var(--mouse-y), ${glowColor}, transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
}

/* ---------- Magnetic Button ---------- */
export function MagneticButton({
  children,
  variant = "primary",
  className,
  href,
}: {
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
  href?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.5 });

  const onMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.25);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.35);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const base =
    "group relative inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors";
  const styles =
    variant === "primary"
      ? "bg-ink text-background hover:bg-ink/90"
      : "border border-border-strong text-ink hover:bg-mist";

  return (
    <motion.a
      ref={ref}
      href={href ?? "#"}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={cn(base, styles, className)}
    >
      {children}
    </motion.a>
  );
}

/* ---------- Scroll Progress ---------- */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left bg-ink"
    />
  );
}

/* ---------- Mouse Spotlight ---------- */
export function Spotlight() {
  const x = useMotionValue(-500);
  const y = useMotionValue(-500);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [x, y]);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[45] hidden lg:block"
      style={{
        background: `radial-gradient(400px circle at var(--sx) var(--sy), color-mix(in oklch, var(--ink) 6%, transparent), transparent 60%)`,
      } as React.CSSProperties}
    >
      <motion.div
        aria-hidden
        style={{ x, y }}
        className="absolute h-px w-px"
      />
      <SpotlightCSS mx={x} my={y} />
    </motion.div>
  );
}
function SpotlightCSS({ mx, my }: { mx: any; my: any }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const un1 = mx.on("change", (v: number) => ref.current?.style.setProperty("--sx", `${v}px`));
    const un2 = my.on("change", (v: number) => ref.current?.style.setProperty("--sy", `${v}px`));
    return () => {
      un1();
      un2();
    };
  }, [mx, my]);
  return (
    <div
      ref={ref}
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(380px circle at var(--sx, -500px) var(--sy, -500px), color-mix(in oklch, var(--ink) 5%, transparent), transparent 65%)",
      }}
    />
  );
}

/* ---------- Nav ---------- */
export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "backdrop-blur-xl" : "",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:px-10",
          scrolled ? "border-b border-border/70" : "",
        )}
      >
        <a href="#top" className="flex items-center gap-2">
          <LogoMark />
          <span className="font-display text-xl">SecureShare</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#product" className="transition-colors hover:text-ink">Product</a>
          <a href="#privacy" className="transition-colors hover:text-ink">Privacy Engine</a>
          <a href="#features" className="transition-colors hover:text-ink">Features</a>
          <a href="#security" className="transition-colors hover:text-ink">Security</a>
          <a href="#customers" className="transition-colors hover:text-ink">Customers</a>
        </nav>
        <div className="flex items-center gap-3">
          <a href="#" className="hidden text-sm text-muted-foreground transition-colors hover:text-ink md:inline">
            Sign in
          </a>
          <MagneticButton className="!py-2 !px-4 text-xs">
            Request access <ArrowRight className="h-3.5 w-3.5" />
          </MagneticButton>
        </div>
      </div>
    </motion.header>
  );
}

export function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
      <rect x="1" y="1" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 13.5L11.5 17L18 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="13" cy="13" r="10" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="2 3" />
    </svg>
  );
}

/* ---------- Hero visualization ---------- */
export function HeroVisualization() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 3D Mouse Tilt Logic
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotateX = -(y / rect.height) * 8; // subtle rotation
      const rotateY = (x / rect.width) * 8;

      gsap.to(card, {
        rotateX,
        rotateY,
        transformPerspective: 1000,
        ease: "power2.out",
        duration: 0.5,
      });
    };

    const onMouseLeave = () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        ease: "power2.out",
        duration: 0.8,
      });
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    // Sequential Workflow Timeline
    const ctx = gsap.context(() => {
      // 1. Initial State Setting
      gsap.set([".file-node", ".core-node", ".policy-badge", ".recipient-node", ".link-node", ".audit-log-line", ".laser-left-path", ".laser-right-path"], {
        opacity: 0,
        y: 10,
        scale: 0.98,
      });
      gsap.set(".core-shield", { scale: 0.85, opacity: 0.4 });
      gsap.set(".binary-matrix", { opacity: 0 });
      gsap.set([".laser-left-pulse", ".laser-right-pulse"], { strokeDashoffset: 180 });

      const mainTl = gsap.timeline({ repeat: -1, repeatDelay: 3.5 });

      mainTl
        // Step 1: File appears on the left
        .to(".file-node", {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power3.out"
        })

        // Step 2: Connection line and core node appear in the center
        .to([".core-node", ".laser-left-path"], {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power3.out"
        }, "-=0.2")

        // Step 3: File packet (laser) travels from left to central encryption node
        .to(".laser-left-pulse", {
          strokeDashoffset: 0,
          duration: 0.8,
          ease: "power2.inOut"
        }, "-=0.3")

        // Step 4: Shield pulses once encryption starts
        .to(".core-shield", {
          scale: 1.15,
          opacity: 1,
          stroke: "oklch(0.62 0.16 148)", // subtle green
          duration: 0.35,
          ease: "power2.out"
        })
        .to(".core-shield", {
          scale: 1,
          duration: 0.25,
          ease: "power2.in"
        })

        // Step 5: File transforms into encrypted blocks (binary overlay fades in and flickers)
        .to(".binary-matrix", {
          opacity: 0.8,
          duration: 0.35,
          ease: "none"
        }, "-=0.5")

        // Step 6: Privacy Policy Enforced badge is automatically applied
        .to(".policy-badge", {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: "back.out(1.5)"
        }, "-=0.1")

        // Step 7: Encrypted packet travels along the connection lines to the right
        .to(".laser-right-path", {
          opacity: 1,
          duration: 0.3
        }, "-=0.1")
        .to(".laser-right-pulse", {
          strokeDashoffset: 0,
          duration: 0.8,
          ease: "power2.inOut"
        }, "-=0.2")

        // Step 8: Recipient verification badge appears
        .to(".recipient-node", {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: "power3.out"
        }, "-=0.4")

        // Step 9: Secure share link generated (success state green check)
        .to(".link-node", {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: "power3.out"
        }, "-=0.2")

        // Step 10: Audit log console records the transaction
        .to(".audit-log-line", {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power2.out"
        }, "-=0.1")

        // Step 11: Final State breathing animation (subtle scaling of elements to feel alive)
        .to([".file-node", ".link-node", ".core-node"], {
          scale: 1.012,
          duration: 1.5,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut"
        });

    }, card);

    return () => {
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full py-4 flex items-center justify-center [perspective:1000px] z-10">
      <div
        ref={cardRef}
        className="relative h-[400px] w-full overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-[0_15px_45px_rgba(0,0,0,0.12)] [transform-style:preserve-3d]"
      >
        {/* Subtle grid background */}
        <svg className="absolute inset-0 h-full w-full text-border/20 pointer-events-none" aria-hidden="true">
          <defs>
            <pattern id="clean-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0H0V30" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#clean-grid)" />
        </svg>

        {/* Connection Paths (SVG) */}
        <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 600 400" preserveAspectRatio="none">
          {/* Base inactive connection lines */}
          <path
            d="M 170 160 C 220 160, 240 200, 300 200"
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth="1.2"
          />
          <path
            d="M 300 200 C 350 200, 370 120, 430 120"
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth="1.2"
          />
          <path
            d="M 300 200 C 350 200, 370 240, 430 240"
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth="1.2"
          />

          {/* Left connection path (dynamic reveal line) */}
          <path
            className="laser-left-path"
            d="M 170 160 C 220 160, 240 200, 300 200"
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.25}
            strokeWidth="1.2"
          />
          {/* Right connection path (dynamic reveal line) */}
          <path
            className="laser-right-path"
            d="M 300 200 C 350 200, 370 240, 430 240"
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.25}
            strokeWidth="1.2"
          />

          {/* Glowing laser pulse segments */}
          <path
            className="laser-left-pulse text-signal"
            d="M 170 160 C 220 160, 240 200, 300 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeDasharray="20 160"
            strokeLinecap="round"
          />
          <path
            className="laser-right-pulse text-signal"
            d="M 300 200 C 350 200, 370 240, 430 240"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeDasharray="20 160"
            strokeLinecap="round"
          />
        </svg>

        {/* Source File (Left Side) */}
        <div className="file-node absolute left-[6%] top-[120px] [transform:translateZ(10px)] select-none">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className="p-2 rounded-lg bg-mist text-muted-foreground">
              <FileText className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div className="text-left font-sans">
              <div className="text-xs font-semibold text-ink">diligence_report.pdf</div>
              <div className="text-[10px] text-muted-foreground">2.4 MB · PDF Document</div>
            </div>
          </div>
        </div>

        {/* Encryption Hub (Center) */}
        <div className="core-node absolute left-1/2 top-[200px] -translate-x-1/2 -translate-y-1/2 [transform:translateZ(15px)] pointer-events-none">
          <div className="relative grid h-24 w-24 place-items-center rounded-full border border-border bg-background shadow-sm">
            {/* Ambient revolving dashed border */}
            <div
              className="absolute inset-0 rounded-full border border-dashed border-border-strong animate-spin [animation-duration:40s]"
              style={{ margin: "-3px" }}
            />
            <div className="flex flex-col items-center gap-1 z-10">
              <ShieldCheck className="core-shield h-8 w-8 text-muted-foreground transition-all duration-300" strokeWidth={1.5} />
              <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                Vault
              </span>
            </div>

            {/* Binary scramble overlay inside node */}
            <div className="binary-matrix absolute inset-2 rounded-full overflow-hidden flex flex-wrap content-center justify-center gap-1 font-mono text-[7px] text-signal/45 leading-none select-none pointer-events-none">
              <span>0</span><span>1</span><span>0</span>
              <span>1</span><span>0</span><span>1</span>
              <span>0</span><span>1</span><span>0</span>
            </div>
          </div>
        </div>

        {/* Applied Policy Badge (Center-Bottom) */}
        <div className="policy-badge absolute left-1/2 top-[275px] -translate-x-1/2 [transform:translateZ(10px)] select-none">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-[10px] font-medium text-muted-foreground shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-signal" strokeWidth={1.8} />
            <span>Policy: GDPR & SOC2 Enforced</span>
          </div>
        </div>

        {/* Recipient Verification (Right Side - Top) */}
        <div className="recipient-node absolute right-[6%] top-[75px] [transform:translateZ(10px)] select-none">
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2 shadow-sm">
            <Users className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <div className="text-left font-sans">
              <div className="text-[10px] font-semibold text-ink">Identity verified</div>
              <div className="text-[9px] text-signal flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-signal animate-pulse" /> alice@compliance.com
              </div>
            </div>
          </div>
        </div>

        {/* Generated Share Link (Right Side - Bottom) */}
        <div className="link-node absolute right-[6%] top-[180px] [transform:translateZ(10px)] select-none">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className="p-2 rounded-lg bg-signal/5 text-signal">
              <Lock className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div className="text-left font-sans">
              <div className="text-xs font-semibold text-ink flex items-center gap-1">
                secureshare.io/r/atlas
              </div>
              <div className="text-[9px] text-muted-foreground">Signed & Encrypted Link</div>
            </div>
          </div>
        </div>

        {/* Audit Log Console (Bottom) */}
        <div className="audit-log-line absolute inset-x-6 bottom-4 [transform:translateZ(10px)]">
          <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-mist/20 px-3.5 py-2.5 font-mono text-[9px] text-muted-foreground text-left shadow-inner">
            <Terminal className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="text-muted-foreground/40">audit_daemon:</span>
            <span className="text-signal font-semibold">success</span>
            <span>- file_id: 8a7c92ae | policy_hash: 2c0a | access: verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marquee ---------- */
export function ComplianceMarquee() {
  const items = [
    "GDPR",
    "HIPAA",
    "SOC 2",
    "ISO 27001",
    "AES-256",
    "RBAC",
    "SSO / SAML",
    "Audit Logs",
    "End-to-End Encryption",
    "Zero-Trust",
    "CCPA",
    "PCI-DSS",
  ];
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden py-8">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-background to-transparent" />
      <div className="flex w-max animate-marquee gap-14 whitespace-nowrap">
        {row.map((label, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            <span className="font-display text-3xl md:text-5xl">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Problem comparison ---------- */
export function ProblemSection() {
  const traditional = [
    { icon: FileText, label: "Upload" },
    { icon: ArrowRight, label: "Email" },
    { icon: EyeOff, label: "Lost Control" },
  ];
  const secureshare = [
    { icon: FileText, label: "Upload" },
    { icon: Lock, label: "Encrypt" },
    { icon: ShieldCheck, label: "Apply Policy" },
    { icon: Eye, label: "Track Access" },
    { icon: X, label: "Revoke" },
  ];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FlowCard title="Traditional Sharing" subtitle="Trust the recipient. Hope for the best." steps={traditional} tone="warn" />
      <FlowCard title="SecureShare" subtitle="Trust the system. Enforce by default." steps={secureshare} tone="ok" />
    </div>
  );
}
function FlowCard({
  title,
  subtitle,
  steps,
  tone,
}: {
  title: string;
  subtitle: string;
  steps: { icon: any; label: string }[];
  tone: "ok" | "warn";
}) {
  return (
    <SpotlightCard
      glowColor={tone === "warn" ? "oklch(0.55 0.22 27 / 0.08)" : undefined}
      className={cn(
        "p-8",
        tone === "warn"
          ? "border-destructive/30 bg-destructive/5 hover:border-destructive/50"
          : "border-border bg-surface-elevated",
      )}
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="eyebrow">{tone === "warn" ? "Before" : "After"}</div>
          <h3 className="mt-2 font-display text-3xl">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {tone === "warn" ? (
          <X className="h-6 w-6 text-destructive" />
        ) : (
          <Check className="h-6 w-6 text-signal" />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center gap-3">
              <motion.div
                whileHover={{ y: -3 }}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium",
                  tone === "warn"
                    ? "border-destructive/30 bg-background text-destructive"
                    : "border-border bg-background",
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                {s.label}
              </motion.div>
              {i < steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          );
        })}
      </div>
    </SpotlightCard>
  );
}

/* ---------- Interactive product demo ---------- */
export function ProductDemo() {
  const [step, setStep] = useState(0);
  const steps = ["Upload", "Recipients", "Policy", "Share", "Monitor", "Revoke"];
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % steps.length), 3200);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface-elevated shadow-[0_40px_120px_-40px_rgba(10,20,40,0.25)]">
      {/* window chrome */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        </div>
        <div className="rounded-full border border-border bg-background px-3 py-1 font-mono text-[11px] text-muted-foreground">
          app.secureshare.io / rooms / project-atlas
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-signal" /> live
        </div>
      </div>

      <div className="grid md:grid-cols-[220px_1fr]">
        {/* sidebar */}
        <div className="border-r border-border p-4 md:p-6">
          <div className="eyebrow mb-4">Sharing Flow</div>
          <ol className="space-y-1">
            {steps.map((s, i) => (
              <li key={s}>
                <button
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    i === step ? "bg-ink text-background" : "text-muted-foreground hover:bg-mist",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("font-mono text-[10px]", i === step ? "text-background/70" : "")}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s}
                  </span>
                  {i === step && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              </li>
            ))}
          </ol>

          <div className="mt-8 rounded-xl border border-border p-3">
            <div className="eyebrow mb-2">Room</div>
            <div className="font-display text-lg">Project Atlas</div>
            <div className="mt-1 text-xs text-muted-foreground">Q4 diligence · 8 members</div>
          </div>
        </div>

        {/* stage */}
        <div className="relative min-h-[440px] p-6 md:p-10">
          <DemoStage step={step} />
        </div>
      </div>
    </div>
  );
}

function DemoStage({ step }: { step: number }) {
  const panels = [
    <UploadPanel key="u" />,
    <RecipientsPanel key="r" />,
    <PolicyPanel key="p" />,
    <SharePanel key="s" />,
    <MonitorPanel key="m" />,
    <RevokePanel key="rv" />,
  ];
  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {panels[step]}
    </motion.div>
  );
}

function UploadPanel() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="eyebrow">Step 01</div>
        <h4 className="mt-2 font-display text-3xl">Upload sensitive files.</h4>
        <p className="mt-2 text-sm text-muted-foreground">
          Drag and drop. Client-side encryption begins the moment a file touches the browser.
        </p>
      </div>
      <div className="rounded-2xl border border-dashed border-border-strong bg-background p-8">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6" />
          <div>
            <div className="font-mono text-sm">customer_dataset_v4.parquet</div>
            <div className="text-xs text-muted-foreground">2.4 GB</div>
          </div>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-mist">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-full bg-ink"
          />
        </div>
        <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
          <span>encrypting · AES-256-GCM</span>
          <span>chunk 244 / 244</span>
        </div>
      </div>
    </div>
  );
}
function RecipientsPanel() {
  const people = [
    { n: "Ava Chen", e: "ava@equinox.co", r: "Viewer" },
    { n: "Marcus Reid", e: "marcus@northgate.io", r: "Reviewer" },
    { n: "Priya Shah", e: "priya@atlas.ai", r: "Editor" },
  ];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="eyebrow">Step 02</div>
        <h4 className="mt-2 font-display text-3xl">Select recipients.</h4>
        <p className="mt-2 text-sm text-muted-foreground">
          Identity-verified access. SSO, SAML, or magic link. Roles enforced at the file level.
        </p>
      </div>
      <ul className="space-y-2">
        {people.map((p, i) => (
          <motion.li
            key={p.e}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-mist font-mono text-[11px]">
                {p.n.split(" ").map((x) => x[0]).join("")}
              </div>
              <div>
                <div className="text-sm font-medium">{p.n}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{p.e}</div>
              </div>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-xs">{p.r}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
function PolicyPanel() {
  const items = [
    { l: "Watermark with recipient identity", on: true },
    { l: "Block download", on: true },
    { l: "Expire access after 14 days", on: true },
    { l: "Redact PII (email, SSN, phone)", on: true },
    { l: "Require device attestation", on: false },
  ];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="eyebrow">Step 03</div>
        <h4 className="mt-2 font-display text-3xl">Apply privacy policies.</h4>
        <p className="mt-2 text-sm text-muted-foreground">
          Reusable policies, versioned like code. Enforced at the encryption layer, not the UI.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-mono text-xs text-muted-foreground">policies/finance.v3.yaml</div>
          <span className="rounded-full bg-signal/15 px-2 py-0.5 font-mono text-[10px] text-signal">active</span>
        </div>
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span>{it.l}</span>
              <span
                className={cn(
                  "flex h-5 w-9 items-center rounded-full p-0.5",
                  it.on ? "bg-ink" : "bg-border",
                )}
              >
                <span
                  className={cn(
                    "h-4 w-4 rounded-full bg-background transition-transform",
                    it.on ? "translate-x-4" : "translate-x-0",
                  )}
                />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
function SharePanel() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="eyebrow">Step 04</div>
        <h4 className="mt-2 font-display text-3xl">Generate a secure link.</h4>
        <p className="mt-2 text-sm text-muted-foreground">
          Every link is unique per recipient. Signed, scoped, and reissued on demand.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="eyebrow mb-2">Secure sharing link</div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-mist/60 px-3 py-3 font-mono text-xs">
          <Lock className="h-3.5 w-3.5" />
          <span className="truncate">secureshare.io/r/8f2a…c19d?k=●●●●●●●</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[
            { k: "Recipients", v: "3" },
            { k: "Expires", v: "14d" },
            { k: "Policy", v: "finance.v3" },
          ].map((m) => (
            <div key={m.k} className="rounded-xl border border-border p-3">
              <div className="font-display text-xl">{m.v}</div>
              <div className="eyebrow mt-1 !text-[9px]">{m.k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function MonitorPanel() {
  const events = [
    { t: "12:04:22", who: "ava@equinox.co", ev: "opened", ok: true },
    { t: "12:05:11", who: "ava@equinox.co", ev: "viewed page 4", ok: true },
    { t: "12:07:42", who: "marcus@northgate.io", ev: "opened", ok: true },
    { t: "12:09:03", who: "marcus@northgate.io", ev: "download blocked", ok: false },
  ];
  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="eyebrow">Step 05</div>
          <h4 className="mt-2 font-display text-3xl">Monitor every access.</h4>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-signal" /> streaming
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-mist/60 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.12 }}
                className="border-t border-border font-mono text-[12px]"
              >
                <td className="px-4 py-3 text-muted-foreground">{e.t}</td>
                <td className="px-4 py-3">{e.who}</td>
                <td className="px-4 py-3">{e.ev}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px]",
                      e.ok ? "bg-signal/15 text-signal" : "bg-destructive/15 text-destructive",
                    )}
                  >
                    {e.ok ? "allowed" : "denied"}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function RevokePanel() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="eyebrow">Step 06</div>
        <h4 className="mt-2 font-display text-3xl">Revoke in one click.</h4>
        <p className="mt-2 text-sm text-muted-foreground">
          Access keys are cryptographically invalidated. Even downloaded files can be rendered unreadable.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-background p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive">
              <X className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium">marcus@northgate.io</div>
              <div className="font-mono text-[11px] text-muted-foreground">access revoked · 12:11:04</div>
            </div>
          </div>
          <span className="rounded-full border border-destructive/40 px-3 py-1 text-xs text-destructive">
            key rotated
          </span>
        </div>
        <div className="mt-4 rounded-lg border border-border bg-mist/40 p-3 font-mono text-[11px] text-muted-foreground">
          POST /v1/keys/rotate → 204 · propagated to 3 edges in 84ms
        </div>
      </div>
    </div>
  );
}

/* ---------- Privacy Engine flow ---------- */
export function PrivacyEngine() {
  const stages = [
    { t: "File Upload", d: "Client-side chunking begins.", icon: FileText },
    { t: "Encryption", d: "AES-256-GCM, per-recipient keys.", icon: Lock },
    { t: "Policy Enforcement", d: "Rules compiled into the payload.", icon: ShieldCheck },
    { t: "Compliance Validation", d: "GDPR, HIPAA, SOC 2 checks.", icon: Fingerprint },
    { t: "Access Control", d: "Identity + device + context.", icon: KeyRound },
    { t: "Secure Sharing", d: "Signed, scoped, revocable.", icon: Network },
  ];
  return (
    <div className="relative rounded-3xl border border-border bg-surface-elevated p-6 md:p-10">
      <div className="grid gap-4 md:grid-cols-6">
        {stages.map((s, i) => {
          const Icon = s.icon;
          return (
            <Reveal key={s.t} delay={i * 0.08} className="relative">
              <SpotlightCard className="flex h-full flex-col p-5 bg-background hover:-translate-y-1 transition-all duration-300">
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                </div>
                <div className="mt-auto text-left">
                  <div className="font-display text-lg leading-tight">{s.t}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{s.d}</div>
                </div>
              </SpotlightCard>
              {i < stages.length - 1 && (
                <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 hidden md:block z-20 pointer-events-none">
                  <ArrowRight className="h-4 w-4 text-border-strong" />
                </div>
              )}
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Features bento ---------- */
export function FeaturesBento() {
  const cards = [
    { title: "End-to-End Encryption", desc: "AES-256-GCM with per-recipient keys. Zero-knowledge by default.", icon: Lock, size: "lg" },
    { title: "Automated Privacy Policies", desc: "Reusable, versioned policies enforced at the file level.", icon: ShieldCheck },
    { title: "Compliance Monitoring", desc: "GDPR, HIPAA, SOC 2, ISO 27001 continuously validated.", icon: Fingerprint },
    { title: "Secure Data Rooms", desc: "Purpose-built spaces for diligence, M&A, and clinical trials.", icon: Layers, size: "md" },
    { title: "Fine-Grained Access Control", desc: "RBAC + ABAC. Down to the field.", icon: KeyRound },
    { title: "Real-Time Audit Logs", desc: "Streaming, immutable, exportable.", icon: Activity },
    { title: "Secure API Integrations", desc: "REST, webhooks, signed events. SDKs for Node, Python, Go.", icon: Terminal, size: "md" },
    { title: "Team Collaboration", desc: "Workspaces, comments, approvals. Never at the cost of control.", icon: Users },
    { title: "Data Governance", desc: "Classify, tag, retain, delete. Provably.", icon: Database },
    { title: "Instant Revocation", desc: "Kill access in milliseconds — even for downloaded files.", icon: Zap, size: "lg" },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-4 md:grid-rows-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        const span =
          c.size === "lg"
            ? "md:col-span-2 md:row-span-1"
            : c.size === "md"
              ? "md:col-span-2"
              : "";
        return (
          <Reveal key={c.title} delay={i * 0.04}>
            <SpotlightCard
              className={cn(
                "flex h-full min-h-[180px] flex-col justify-between p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                span
              )}
            >
              <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-ink" strokeWidth={1.6} />
              <div className="mt-8">
                <h4 className="font-display text-xl leading-tight md:text-2xl">{c.title}</h4>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">{c.desc}</p>
              </div>
            </SpotlightCard>
          </Reveal>
        );
      })}
    </div>
  );
}

/* ---------- Metrics ---------- */
function Counter({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const count = { val: 0 };
    const format = (n: number) =>
      n >= 1_000_000
        ? (n / 1_000_000).toFixed(1) + "M"
        : n >= 1_000
          ? (n / 1_000).toFixed(0) + "K"
          : Math.round(n).toString();

    const t = gsap.to(count, {
      val: to,
      duration: 2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 95%",
        toggleActions: "play none none none",
      },
      onUpdate: () => {
        el.innerText = `${prefix}${format(count.val)}${suffix}`;
      },
    });

    return () => {
      t.kill();
    };
  }, [to, prefix, suffix]);

  return (
    <span ref={ref}>
      {prefix}0{suffix}
    </span>
  );
}
export function Metrics() {
  const stats = [
    { v: 42_000_000, s: "+", label: "Files protected" },
    { v: 1_800_000_000, s: "+", label: "Access events monitored" },
    { v: 9_400_000, s: "+", label: "Compliance checks processed" },
    { v: 260_000, s: "+", label: "Policies enforced daily" },
  ];
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
      {stats.map((s, i) => (
        <div key={i} className="bg-background p-8">
          <div className="font-display text-5xl leading-none md:text-6xl">
            <Counter to={s.v} suffix={s.s} />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Architecture ---------- */
export function ArchitectureDiagram() {
  const layers = [
    { t: "Users", d: "SSO, SAML, magic link", icon: Users },
    { t: "Identity Layer", d: "Device + context attestation", icon: Fingerprint },
    { t: "Policy Engine", d: "Compiled, versioned rules", icon: GitBranch },
    { t: "Encryption Layer", d: "AES-256 · per-recipient keys", icon: Lock },
    { t: "Secure Storage", d: "Regional, sovereign, sharded", icon: Cloud },
    { t: "Audit System", d: "Immutable, streaming logs", icon: Activity },
  ];
  return (
    <div className="relative mx-auto max-w-3xl">
      {layers.map((l, i) => {
        const Icon = l.icon;
        return (
          <Reveal key={l.t} delay={i * 0.06}>
            <div className="group relative flex items-center gap-6 border-t border-border py-6 last:border-b">
              <div className="w-14 font-mono text-xs text-muted-foreground">
                L{String(i + 1).padStart(2, "0")}
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-surface-elevated">
                <Icon className="h-4 w-4" strokeWidth={1.6} />
              </div>
              <div className="flex-1">
                <div className="font-display text-2xl leading-none">{l.t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{l.d}</div>
              </div>
              <ArrowUpRight className="h-4 w-4 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

/* ---------- Testimonials ---------- */
export function Testimonials() {
  const items = [
    {
      q: "SecureShare collapsed our data-sharing review from three weeks to an afternoon. The audit trail alone was worth the migration.",
      n: "Elena Voss",
      r: "Chief Information Security Officer",
      c: "Meridian Health",
    },
    {
      q: "Policy-as-code that our legal team can actually read. Enforcement happens at the encryption layer — not the interface.",
      n: "Daniel Okafor",
      r: "Head of Data Governance",
      c: "Northgate Capital",
    },
    {
      q: "We revoked access to a leaked file in 84 milliseconds. That is the new bar.",
      n: "Priya Shah",
      r: "VP Engineering",
      c: "Atlas AI",
    },
  ];
  return (
    <div className="space-y-24">
      {items.map((t, i) => (
        <Reveal key={i} delay={0.05}>
          <figure className="mx-auto max-w-4xl">
            <blockquote className="font-display text-4xl leading-[1.15] text-balance md:text-6xl">
              <span className="text-muted-foreground">"</span>
              {t.q}
              <span className="text-muted-foreground">"</span>
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-4 border-t border-border pt-6">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-ink font-mono text-xs text-background">
                {t.n.split(" ").map((x) => x[0]).join("")}
              </div>
              <div>
                <div className="text-sm font-medium">{t.n}</div>
                <div className="text-xs text-muted-foreground">
                  {t.r} · {t.c}
                </div>
              </div>
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  );
}

/* ---------- Section wrappers ---------- */
export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("relative mx-auto max-w-[1400px] px-6 py-14 md:px-10 md:py-24", className)}>
      {(eyebrow || title || intro) && (
        <div className="mb-10 max-w-3xl">
          {eyebrow && (
            <Reveal>
              <div className="eyebrow flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                {eyebrow}
              </div>
            </Reveal>
          )}
          {title && (
            <Reveal delay={0.05}>
              <h2 className="mt-5 font-display text-5xl leading-[1.02] text-balance md:text-7xl">
                {title}
              </h2>
            </Reveal>
          )}
          {intro && (
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground text-balance">{intro}</p>
            </Reveal>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

/* ---------- Footer ---------- */
export function Footer() {
  const cols = [
    { t: "Product", l: ["Overview", "Data Rooms", "Privacy Engine", "Access Control", "Audit"] },
    { t: "Security", l: ["Architecture", "Encryption", "Zero-Trust", "Bug Bounty", "Status"] },
    { t: "Compliance", l: ["SOC 2", "ISO 27001", "GDPR", "HIPAA", "DPA"] },
    { t: "Developers", l: ["Documentation", "API Reference", "SDKs", "Changelog", "Webhooks"] },
    { t: "Company", l: ["About", "Customers", "Careers", "Press", "Contact"] },
  ];
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-[1400px] px-6 py-20 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(5,1fr)]">
          <div>
            <div className="flex items-center gap-2">
              <LogoMark />
              <span className="font-display text-2xl">SecureShare</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Privacy infrastructure for modern organizations. Encrypt, govern, and revoke sensitive data at any moment.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-signal" />
              All systems operational
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.t}>
              <div className="eyebrow">{c.t}</div>
              <ul className="mt-4 space-y-2 text-sm">
                {c.l.map((x) => (
                  <li key={x}>
                    <a href="#" className="text-muted-foreground transition-colors hover:text-ink">
                      {x}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} SecureShare, Inc.</span>
            <a href="#" className="hover:text-ink">Privacy</a>
            <a href="#" className="hover:text-ink">Terms</a>
            <a href="#" className="hover:text-ink">DPA</a>
          </div>
          <div className="font-mono">v1.0.0 · Built for regulated industries.</div>
        </div>

        {/* massive wordmark */}
        <div className="pointer-events-none mt-16 overflow-hidden">
          <div className="font-display text-[18vw] leading-none tracking-tighter text-ink/[0.05]">
            SecureShare
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Load sequence ---------- */
export function LoadSequence() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: done ? 0 : 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ pointerEvents: done ? "none" : "auto" }}
      className="fixed inset-0 z-[100] grid place-items-center bg-background"
    >
      <div className="flex flex-col items-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <LogoMark />
          <span className="font-display text-3xl">SecureShare</span>
        </motion.div>
        <div className="h-px w-40 overflow-hidden bg-border">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full bg-ink"
          />
        </div>
        <div className="eyebrow flex items-center gap-2">
          <Sparkles className="h-3 w-3" /> establishing secure session
        </div>
      </div>
    </motion.div>
  );
}
