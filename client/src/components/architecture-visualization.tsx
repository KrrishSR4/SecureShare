import React, { useEffect, useRef, useState } from "react";
import {
  Globe,
  Server,
  ShieldCheck,
  Key,
  Settings,
  Lock,
  Database,
  Activity,
  User,
  CheckCircle2,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NODES = [
  {
    id: "browser",
    title: "Browser",
    desc: "Initiates request",
    icon: Globe,
    details: ["TLS 1.3", "Certificate Pinning"],
    log: "Establishing secure TLS connection...",
  },
  {
    id: "api",
    title: "API Gateway",
    desc: "Routes & rates",
    icon: Server,
    details: ["Rate Limiting", "DDoS Protection", "WAF"],
    log: "Rate limit check passed (12/100).",
  },
  {
    id: "authn",
    title: "Authentication",
    desc: "Verifies user",
    icon: ShieldCheck,
    details: ["JWT Validation", "Session Verification", "Device Trust", "Identity Confirmed"],
    log: "Validating JWT signature... OK.",
  },
  {
    id: "authz",
    title: "Authorization",
    desc: "Checks permissions",
    icon: Key,
    details: ["RBAC / ABAC", "Token Scopes", "Context Aware"],
    log: "Evaluating access context (device=trusted).",
  },
  {
    id: "policy",
    title: "Policy Engine",
    desc: "Enforces rules",
    icon: Settings,
    details: ["Download Limit", "Expiration Rules", "Password Protection", "Geo Restrictions"],
    log: "Compiling policy constraints into payload.",
  },
  {
    id: "enc",
    title: "Encryption",
    desc: "Secures payload",
    icon: Lock,
    details: ["AES-256-GCM", "Signed URL", "Secure Keys"],
    log: "Generating per-recipient encryption keys.",
  },
  {
    id: "storage",
    title: "Secure Storage",
    desc: "Saves safely",
    icon: Database,
    details: ["Sharded", "Replicated", "Immutable"],
    log: "Sharding and persisting to regional bucket.",
  },
  {
    id: "audit",
    title: "Audit Logging",
    desc: "Records event",
    icon: Activity,
    details: ["WORM Storage", "SIEM Export"],
    log: "Writing immutable ledger entry #499201.",
  },
  {
    id: "recipient",
    title: "Recipient",
    desc: "Receives data",
    icon: User,
    details: ["Decrypted in browser", "Zero Trust"],
    log: "Delivering payload to destination.",
  },
];

const LINKS = [
  { from: 0, to: 1 },
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 4, to: 5 },
  { from: 5, to: 6 },
  { from: 6, to: 7 },
  { from: 7, to: 8 },
];

const getNodePos = (i: number, innerWidth: number, rowHeight: number, isMobile: boolean) => {
  if (isMobile) {
    return { x: innerWidth / 2, y: i * 100 };
  }
  if (i < 3) {
    // Row 1: Left to right (0, 1, 2)
    return { x: (i / 2) * innerWidth, y: 0 };
  } else if (i < 6) {
    // Row 2: Right to left (3, 4, 5)
    return { x: ((5 - i) / 2) * innerWidth, y: rowHeight };
  } else {
    // Row 3: Left to right (6, 7, 8)
    return { x: ((i - 6) / 2) * innerWidth, y: rowHeight * 2 };
  }
};

export function ArchitectureVisualization() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-play steps
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % NODES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const width = dimensions.width;
  const isMobile = width > 0 && width < 768;
  const isTablet = width >= 768 && width < 1024;

  const cardWidth = isMobile ? 220 : isTablet ? 96 : 120;
  const cardHeight = isMobile ? 54 : isTablet ? 68 : 80;

  const margin = {
    top: 40,
    right: isMobile ? 30 : 80,
    bottom: 40,
    left: isMobile ? 30 : 80,
  };

  const innerWidth = width - margin.left - margin.right;
  const rowHeight = 160;
  const innerHeight = isMobile ? NODES.length * 100 : rowHeight * 2;

  // Actual step index to display details and highlight paths
  const displayStepIndex = hoveredStep !== null ? hoveredStep : activeStep;

  const nodesData = NODES.map((n, i) => {
    const pos = getNodePos(i, innerWidth, rowHeight, isMobile);
    return { ...n, ...pos };
  });

  const getLinkPath = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    isMobile: boolean
  ) => {
    const dx = cardWidth / 2;
    const dy = cardHeight / 2;
    const gap = 10; // gap to keep arrow tip slightly away from card borders

    if (isMobile) {
      // Mobile is vertical down
      return `M ${from.x},${from.y + dy + 2} L ${to.x},${to.y - dy - gap}`;
    }

    if (Math.abs(from.y - to.y) < 10) {
      // Horizontal link
      if (to.x > from.x) {
        return `M ${from.x + dx + 2},${from.y} L ${to.x - dx - gap},${to.y}`;
      } else {
        return `M ${from.x - dx - 2},${from.y} L ${to.x + dx + gap},${to.y}`;
      }
    } else {
      // Vertical link
      if (to.y > from.y) {
        return `M ${from.x},${from.y + dy + 2} L ${to.x},${to.y - dy - gap}`;
      } else {
        return `M ${from.x},${from.y - dy - 2} L ${to.x},${to.y + dy + gap}`;
      }
    }
  };

  const displayNode = NODES[displayStepIndex];
  const DisplayIcon = displayNode.icon;

  return (
    <div className="relative w-full mx-auto py-6" ref={containerRef}>
      {/* Flowchart Diagram Wrapper */}
      <div
        className="relative w-full"
        style={{ height: innerHeight + margin.top + margin.bottom }}
      >
        {/* SVG Flowchart Lines */}
        {width > 0 && (
          <svg
            width={width}
            height={innerHeight + margin.top + margin.bottom}
            className="absolute top-0 left-0 pointer-events-none z-0"
          >
            <defs>
              <marker
                id="flowchart-arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="currentColor" />
              </marker>
            </defs>
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {/* Background links */}
              {LINKS.map((link, idx) => {
                const fromNode = nodesData[link.from];
                const toNode = nodesData[link.to];
                const pathStr = getLinkPath(fromNode, toNode, isMobile);
                return (
                  <path
                    key={`base-${idx}`}
                    d={pathStr}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="text-zinc-200 dark:text-zinc-800 transition-colors duration-300"
                  />
                );
              })}

              {/* Active flow path links overlay */}
              {LINKS.map((link, idx) => {
                const fromNode = nodesData[link.from];
                const toNode = nodesData[link.to];
                const pathStr = getLinkPath(fromNode, toNode, isMobile);
                const isPathActive = link.to <= displayStepIndex;

                return (
                  <path
                    key={`active-${idx}`}
                    d={pathStr}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    markerEnd="url(#flowchart-arrow)"
                    className={cn(
                      "transition-all duration-300 text-signal",
                      isPathActive ? "opacity-100" : "opacity-0"
                    )}
                  />
                );
              })}
            </g>
          </svg>
        )}

        {/* HTML Cards Overlay */}
        {width > 0 && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
            {NODES.map((node, i) => {
              const pos = getNodePos(i, innerWidth, rowHeight, isMobile);
              const x = pos.x + margin.left;
              const y = pos.y + margin.top;

              const isCurrent = i === displayStepIndex;
              const isVisited = i < displayStepIndex;
              const Icon = node.icon;

              return (
                <div
                  key={node.id}
                  className="absolute"
                  style={{
                    left: x,
                    top: y,
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "auto",
                    zIndex: isCurrent ? 30 : 10,
                  }}
                  onMouseEnter={() => setHoveredStep(i)}
                  onMouseLeave={() => setHoveredStep(null)}
                  onClick={() => {
                    setActiveStep(i);
                    setIsPlaying(false);
                  }}
                >
                  <div
                    style={{ width: cardWidth, height: cardHeight }}
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-xl border transition-all duration-300 bg-surface-elevated cursor-pointer select-none",
                      isMobile ? "flex-row justify-start px-4 gap-3" : "p-2",
                      isCurrent
                        ? "border-signal shadow-[0_0_15px_rgba(16,185,129,0.25)] scale-105"
                        : isVisited
                          ? "border-signal/50 shadow-sm"
                          : "border-border shadow-sm hover:border-ink/20"
                    )}
                  >
                    <div className={cn("flex items-center gap-2", isMobile ? "" : "mb-1")}>
                      <Icon
                        className={cn(
                          "transition-colors duration-300 w-5 h-5",
                          isCurrent
                            ? "text-signal animate-pulse"
                            : isVisited
                              ? "text-signal/80"
                              : "text-muted-foreground/60"
                        )}
                        strokeWidth={1.5}
                      />
                      {isMobile && (
                        <div className="flex flex-col text-left">
                          <span
                            className={cn(
                              "font-display text-sm leading-tight font-medium",
                              isCurrent ? "text-signal font-semibold" : "text-ink"
                            )}
                          >
                            {node.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                            {node.desc}
                          </span>
                        </div>
                      )}
                    </div>

                    {!isMobile && (
                      <div className="text-center">
                        <div
                          className={cn(
                            "font-display text-xs leading-tight font-medium mb-0.5",
                            isCurrent ? "text-signal font-semibold" : "text-ink"
                          )}
                        >
                          {node.title}
                        </div>
                        <div className="font-kelly text-[9px] text-muted-foreground tracking-wide leading-tight px-1">
                          {node.desc}
                        </div>
                      </div>
                    )}

                    {/* Step indicator in corner */}
                    <div
                      className={cn(
                        "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface transition-all duration-300",
                        isCurrent
                          ? "opacity-100 scale-100 bg-signal text-white"
                          : isVisited
                            ? "opacity-100 scale-100 bg-signal/70 text-white"
                            : "opacity-100 scale-100 bg-border text-muted-foreground"
                      )}
                    >
                      <span className="text-[9px] font-bold font-mono">
                        {i + 1}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details & Interactive Control Panel */}
      <div className="mt-4 mx-auto max-w-2xl border border-border bg-surface-elevated rounded-2xl p-5 shadow-md transition-all duration-300">
        {/* Header section with controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-mist/30 border border-border">
              <DisplayIcon className="w-5 h-5 text-signal" />
            </div>
            <div>
              <span className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase">
                Step {displayStepIndex + 1} of {NODES.length}
              </span>
              <h3 className="font-display text-base text-ink font-semibold mt-0.5">
                {displayNode.title}
              </h3>
            </div>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => {
                setActiveStep((prev) => (prev - 1 + NODES.length) % NODES.length);
                setIsPlaying(false);
              }}
              className="p-1.5 rounded-lg border border-border hover:bg-mist/30 text-ink/70 hover:text-ink transition-colors"
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={cn(
                "px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-display text-xs transition-colors",
                isPlaying
                  ? "border-signal/30 bg-signal/10 text-signal hover:bg-signal/20"
                  : "border-border hover:bg-mist/30 text-ink/70 hover:text-ink"
              )}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Autoplay</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Autoplay</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setActiveStep((prev) => (prev + 1) % NODES.length);
                setIsPlaying(false);
              }}
              className="p-1.5 rounded-lg border border-border hover:bg-mist/30 text-ink/70 hover:text-ink transition-colors"
              title="Next Step"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Detailed capabilities and simulated terminal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-[9px] font-mono tracking-wider text-muted-foreground uppercase block mb-2">
              Capabilities & Security Details
            </span>
            <ul className="space-y-1.5">
              {displayNode.details.map((detail, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 font-kelly text-xs tracking-wide text-ink"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-mono tracking-wider text-muted-foreground uppercase block mb-2">
              Live Console Output
            </span>
            <div className="flex-1 bg-[#121214] text-zinc-300 dark:bg-black dark:text-emerald-400 p-3 rounded-xl font-mono text-[10px] border border-border/80 flex items-start gap-2 min-h-[64px]">
              <Terminal className="w-3.5 h-3.5 text-signal shrink-0 mt-0.5" />
              <div className="leading-relaxed break-all">
                <span className="text-zinc-500 mr-1.5">$</span>
                <span key={displayStepIndex} className="type-animation">
                  {displayNode.log}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles for caretaker blink and typewriter animation */}
      <style>{`
        .type-animation {
          display: inline-block;
          overflow: hidden;
          border-right: 2px solid #10b981;
          white-space: nowrap;
          animation: typing 0.6s steps(40, end), blink-caret 0.75s step-end infinite;
          max-width: 100%;
        }
        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }
        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: #10b981 }
        }
      `}</style>
    </div>
  );
}
