import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
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
    details: [
      "JWT Validation",
      "Session Verification",
      "Device Trust",
      "Identity Confirmed",
    ],
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
    details: [
      "Download Limit",
      "Expiration Rules",
      "Password Protection",
      "Geo Restrictions",
    ],
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

// Helper for nodes position
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
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [inspectedNode, setInspectedNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const width = dimensions.width;
    const isMobile = width < 768;
    
    const margin = { top: 60, right: isMobile ? 40 : 80, bottom: 60, left: isMobile ? 40 : 80 };
    
    // We want the SVG to fit exactly inside the container without scrolling
    const innerWidth = width - margin.left - margin.right;
    const rowHeight = 160;
    const innerHeight = isMobile ? NODES.length * 100 : rowHeight * 2;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 

    svg.attr("width", width);
    svg.attr("height", innerHeight + margin.top + margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate node positions
    const nodesData = NODES.map((n, i) => {
      const pos = getNodePos(i, innerWidth, rowHeight, isMobile);
      return { ...n, ...pos };
    });

    // Generate Path
    let pathString = "";
    if (isMobile) {
      pathString = `M ${nodesData[0].x},${nodesData[0].y} L ${nodesData[8].x},${nodesData[8].y}`;
    } else {
      const p2 = nodesData[2]; // Row 1 Right
      const p3 = nodesData[3]; // Row 2 Right
      const p5 = nodesData[5]; // Row 2 Left
      const p6 = nodesData[6]; // Row 3 Left
      
      const r = 40; // Bend radius
      const bendXRight = innerWidth + 50; 
      const bendXLeft = -50; 
      
      pathString = `M ${nodesData[0].x},${nodesData[0].y} `;
      
      // Top right curve (downwards)
      pathString += `L ${bendXRight - r},${p2.y} `;
      pathString += `Q ${bendXRight},${p2.y} ${bendXRight},${p2.y + r} `;
      pathString += `L ${bendXRight},${p3.y - r} `;
      pathString += `Q ${bendXRight},${p3.y} ${bendXRight - r},${p3.y} `;
      
      // Bottom left curve (downwards)
      pathString += `L ${bendXLeft + r},${p5.y} `;
      pathString += `Q ${bendXLeft},${p5.y} ${bendXLeft},${p5.y + r} `;
      pathString += `L ${bendXLeft},${p6.y - r} `;
      pathString += `Q ${bendXLeft},${p6.y} ${bendXLeft + r},${p6.y} `;
      
      // End
      pathString += `L ${nodesData[8].x},${nodesData[8].y}`;
    }

    // Base line
    const path = g
      .append("path")
      .attr("d", pathString)
      .attr("fill", "none")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 2);

    // Active line
    const activePath = g
      .append("path")
      .attr("d", pathString)
      .attr("fill", "none")
      .attr("stroke", "#10b981")
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", function () {
        const l = (this as SVGPathElement).getTotalLength();
        return `${l} ${l}`;
      })
      .attr("stroke-dashoffset", function () {
        return (this as SVGPathElement).getTotalLength();
      });

    // Stream of Data Particles
    const particlePaths = [
      // Folder
      ["M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"],
      // File
      ["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", "M14 2v4a2 2 0 0 0 2 2h4"],
      // Image (secureshare.png)
      ["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", "M9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"],
      // Database (Data)
      ["M21 5c0 1.657-4.03 3-9 3S3 6.657 3 5s4.03-3 9-3 9 1.343 9 3z", "M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5", "M3 12c0 1.66 4 3 9 3s9-1.34 9-3"]
    ];

    const particlesGroup = g.append("g").attr("class", "particles");
    const numParticles = 8;
    for(let i = 0; i < numParticles; i++) {
        const iconPaths = particlePaths[i % particlePaths.length];
        const p = particlesGroup
            .append("g")
            .attr("class", `particle-${i}`)
            .attr("opacity", 0.9);

        p.append("circle")
            .attr("r", 11)
            .attr("fill", "#ffffff")
            .attr("stroke", "#10b981")
            .attr("stroke-width", 1.5)
            .attr("filter", "drop-shadow(0 2px 4px rgba(16, 185, 129, 0.2))");
            
        const icon = p.append("g")
            .attr("fill", "none")
            .attr("stroke", "#10b981")
            .attr("stroke-width", 2)
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .attr("transform", "translate(-7.5, -7.5) scale(0.62)");

        iconPaths.forEach(d => icon.append("path").attr("d", d));
    }

    // Main Packet
    const packetGroup = g.append("g").attr("class", "packet-group").attr("opacity", 0);
    
    packetGroup
      .append("rect")
      .attr("width", 36)
      .attr("height", 24)
      .attr("rx", 12)
      .attr("x", -18)
      .attr("y", -12)
      .attr("fill", "#10b981")
      .attr("stroke", "#047857")
      .attr("stroke-width", 1)
      .attr("filter", "drop-shadow(0 4px 6px rgba(16, 185, 129, 0.4))");

    packetGroup
      .append("path")
      .attr(
        "d",
        "M12 11h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2zm-2-4a2 2 0 0 1 2 2v2H8V9a2 2 0 0 1 2-2z"
      )
      .attr("fill", "white")
      .attr("transform", "translate(-8, -9) scale(0.8)");
  }, [dimensions]); // Just draw the static D3 once

  // Re-implement animation with a ref so it reads the latest inspectedNode
  const inspectedNodeRef = useRef(inspectedNode);
  const hoveredNodeRef = useRef(hoveredNode);
  useEffect(() => {
    inspectedNodeRef.current = inspectedNode;
    hoveredNodeRef.current = hoveredNode;
  }, [inspectedNode, hoveredNode]);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;
    
    const pathNode = d3.select(svgRef.current).select("path").node() as SVGPathElement;
    if (!pathNode) return;
    
    const totalLength = pathNode.getTotalLength();
    let currentT = 0;
    let lastTime = performance.now();
    
    const packetGroup = d3.select(svgRef.current).select(".packet-group");
    const activePath = d3.select(svgRef.current).select("path:nth-child(2)");
    const particles = d3.select(svgRef.current).selectAll(".particles > g");

    const timer = d3.timer((elapsed) => {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;

      // If paused by click or hover, do not advance T
      if (!inspectedNodeRef.current && !hoveredNodeRef.current) {
         currentT += delta / 12000; // 12 seconds per loop
         if (currentT > 1) currentT = currentT % 1;
      }

      // We still update graphics even if paused
      packetGroup.attr("opacity", 1);
      const p = pathNode.getPointAtLength(currentT * totalLength);
      packetGroup.attr("transform", `translate(${p.x},${p.y})`);
      activePath.attr("stroke-dashoffset", (1 - currentT) * totalLength);

      // Animate particles
      particles.each(function(d, i) {
          const particleT = (currentT + (i * 0.125)) % 1;
          const pt = pathNode.getPointAtLength(particleT * totalLength);
          d3.select(this).attr("transform", `translate(${pt.x},${pt.y})`);
      });

      // Determine active node (if not paused)
      if (!inspectedNodeRef.current && !hoveredNodeRef.current) {
        let currentActive = null;
        
        const width = dimensions.width;
        const isMobile = width < 768;
        const margin = { top: 60, right: isMobile ? 40 : 80, bottom: 60, left: isMobile ? 40 : 80 };
        const innerWidth = width - margin.left - margin.right;
        const rowHeight = 160;
        
        for (let i = 0; i < NODES.length; i++) {
          const pos = getNodePos(i, innerWidth, rowHeight, isMobile);
          const x = pos.x + margin.left;
          const y = pos.y + margin.top;
          
          const dist = Math.sqrt(Math.pow(p.x + margin.left - x, 2) + Math.pow(p.y + margin.top - y, 2));
          if (dist < 50) {
            currentActive = NODES[i].id;
            break;
          }
        }
        setActiveNodeId(currentActive);
      }
    });

    return () => timer.stop();
  }, [dimensions]);

  const width = dimensions.width;
  const isMobile = width > 0 && width < 768;
  const isTablet = width >= 768 && width < 1024;
  const margin = { top: 60, right: isMobile ? 40 : 80, bottom: 60, left: isMobile ? 40 : 80 };
  const innerWidth = width - margin.left - margin.right;
  const rowHeight = 160;
  const innerHeight = isMobile ? NODES.length * 100 : rowHeight * 2;

  // Actual active node for UI
  const displayNodeId = inspectedNode || activeNodeId;

  return (
    <div className="relative w-full mx-auto py-12" ref={containerRef}>
      {/* Container no longer needs overflow-x-auto because SVG is perfectly constrained to width */}
      <div className="relative w-full" style={{ minHeight: isMobile ? innerHeight + 120 : innerHeight + 180 }}>
        {/* D3 SVG Background */}
        <svg
          ref={svgRef}
          className="absolute top-0 left-0 pointer-events-none z-0"
        />

        {/* React HTML Nodes */}
        {dimensions.width > 0 && (
          <div 
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
          >
            {NODES.map((node, i) => {
              const pos = getNodePos(i, innerWidth, rowHeight, isMobile);
              
              // Adjust for margin in HTML overlay
              const x = pos.x + margin.left;
              const y = pos.y + margin.top;

              const isHovered = hoveredNode === node.id;
              const isInspected = inspectedNode === node.id || isHovered;
              const isActive = displayNodeId === node.id || isHovered;
              const showCard = isActive || isInspected;
              
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
                    zIndex: showCard ? 50 : 10,
                  }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setInspectedNode(isInspected ? null : node.id)}
                >
                  {/* Node Card */}
                  <div
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-2xl border transition-all duration-300 bg-white cursor-pointer select-none",
                      isMobile ? "w-56 p-4" : (isTablet ? "w-24 p-3" : "w-28 p-4"),
                      isActive
                        ? "border-signal shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-105"
                        : "border-border shadow-sm hover:border-ink/20",
                      isInspected ? "ring-2 ring-signal ring-offset-2" : ""
                    )}
                  >
                    <div className={cn("flex items-center gap-2", isMobile ? "mb-1" : "mb-2")}>
                      <Icon
                        className={cn(
                          "transition-colors duration-300",
                          isMobile ? "w-5 h-5" : "w-6 h-6",
                          isActive ? "text-signal" : "text-ink"
                        )}
                        strokeWidth={isMobile ? 1.5 : 1.2}
                      />
                      {isMobile && (
                        <span className="font-display text-sm leading-tight text-ink">
                          {node.title}
                        </span>
                      )}
                    </div>
                    
                    {!isMobile && (
                      <div className="text-center">
                        <div className="font-display text-xs leading-tight mb-1 whitespace-nowrap text-ink">
                          {node.title}
                        </div>
                        <div className="font-kelly text-[10px] text-muted-foreground tracking-wide leading-tight px-1">
                          {node.desc}
                        </div>
                      </div>
                    )}
                    
                    {isMobile && (
                      <div className="font-kelly text-xs text-muted-foreground tracking-wide leading-tight px-1 text-center">
                         {node.desc}
                      </div>
                    )}

                    {/* Verification Indicator */}
                    <div
                      className={cn(
                        "absolute -top-1.5 -right-1.5 w-5 h-5 bg-signal rounded-full flex items-center justify-center border-2 border-white transition-all duration-300",
                        isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
                      )}
                    >
                      <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  </div>

                  {/* Floating Hover Card (More engineering focused) */}
                  <div
                    className={cn(
                      "absolute z-50 transition-all duration-300 w-56 bg-surface-elevated border border-border rounded-xl shadow-xl overflow-hidden",
                      showCard ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
                      isMobile 
                        ? "left-full ml-4 top-1/2 -translate-y-1/2" 
                        : (i < 3 ? "top-full mt-4 left-1/2 -translate-x-1/2" : (i < 6 ? "bottom-full mb-4 left-1/2 -translate-x-1/2" : "top-full mt-4 left-1/2 -translate-x-1/2"))
                    )}
                  >
                    <div className="px-4 py-3 border-b border-border bg-mist/50">
                      <div className="font-display text-sm text-ink flex items-center justify-between">
                        {node.title}
                        {isInspected && <span className="text-[9px] font-mono bg-signal/20 text-signal px-1.5 py-0.5 rounded-sm">INSPECTING</span>}
                      </div>
                    </div>
                    <div className="p-4">
                      <ul className="space-y-2 mb-4">
                        {node.details.map((detail, idx) => (
                          <li key={idx} className="flex items-center gap-2 font-kelly text-xs tracking-wide text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-signal/60" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                      {/* Live Processing Log Mockup */}
                      <div className="mt-3 pt-3 border-t border-border font-mono text-[9px] text-muted-foreground flex gap-2">
                        <Terminal className="w-3 h-3 shrink-0" />
                        <span className="leading-tight">
                          {isActive ? (
                            <span className="text-signal type-animation">{node.log}</span>
                          ) : (
                            <span className="opacity-50">Waiting for payload...</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Global styles for tiny animations */}
      <style>{`
        .type-animation {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          animation: typing 1s steps(30, end);
        }
        @keyframes typing {
          from { max-width: 0 }
          to { max-width: 100% }
        }
      `}</style>
    </div>
  );
}
