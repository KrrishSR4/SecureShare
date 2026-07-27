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
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

const NODES = [
  {
    id: "browser",
    title: "Browser",
    desc: "Initiates request",
    icon: Globe,
    details: ["TLS 1.3", "Certificate Pinning"],
  },
  {
    id: "api",
    title: "API Gateway",
    desc: "Routes & rates",
    icon: Server,
    details: ["Rate Limiting", "DDoS Protection", "WAF"],
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
  },
  {
    id: "authz",
    title: "Authorization",
    desc: "Checks permissions",
    icon: Key,
    details: ["RBAC / ABAC", "Token Scopes", "Context Aware"],
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
  },
  {
    id: "enc",
    title: "Encryption",
    desc: "Secures payload",
    icon: Lock,
    details: ["AES-256-GCM", "Signed URL", "Secure Keys"],
  },
  {
    id: "storage",
    title: "Secure Storage",
    desc: "Saves safely",
    icon: Database,
    details: ["Sharded", "Replicated", "Immutable"],
  },
  {
    id: "audit",
    title: "Audit Logging",
    desc: "Records event",
    icon: Activity,
    details: ["WORM Storage", "SIEM Export"],
  },
  {
    id: "recipient",
    title: "Recipient",
    desc: "Receives data",
    icon: User,
    details: ["Decrypted in browser", "Zero Trust"],
  },
];

export function ArchitectureVisualization() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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
    const isTablet = width >= 768 && width < 1024;
    
    const nodeWidth = isMobile ? 220 : (isTablet ? 100 : 120);
    const nodeHeight = isMobile ? 60 : 100;
    
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    
    // Ensure minimum width on desktop to prevent squishing
    const minDesktopWidth = 1000;
    const innerWidth = isMobile 
      ? width - margin.left - margin.right 
      : Math.max(width, minDesktopWidth) - margin.left - margin.right;
    const innerHeight = isMobile ? NODES.length * 100 : 250;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 

    svg.attr("width", isMobile ? width : innerWidth + margin.left + margin.right);
    svg.attr("height", isMobile ? innerHeight + margin.top + margin.bottom : innerHeight);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${isMobile ? margin.top : innerHeight / 2})`);

    const nodesData = NODES.map((n, i) => {
      let x, y;
      if (isMobile) {
        x = innerWidth / 2;
        y = i * 100;
      } else {
        x = (i / (NODES.length - 1)) * innerWidth;
        y = 0;
      }
      return { ...n, x, y };
    });

    const lineGenerator = d3
      .line<{ x: number; y: number }>()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveMonotoneX);

    const pathString = lineGenerator(nodesData);

    const path = g
      .append("path")
      .attr("d", pathString)
      .attr("fill", "none")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 2);

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

    const pathNode = path.node() as SVGPathElement;
    if (!pathNode) return;
    const totalLength = pathNode.getTotalLength();
    
    let isAnimating = true;

    function animatePacket() {
      if (!isAnimating) return;
      packetGroup.attr("opacity", 1);
      
      packetGroup
        .transition()
        .duration(12000)
        .ease(d3.easeLinear)
        .tween("pathTween", function () {
          return function (t) {
            const p = pathNode.getPointAtLength(t * totalLength);
            packetGroup.attr("transform", `translate(${p.x},${p.y})`);
            
            activePath.attr("stroke-dashoffset", (1 - t) * totalLength);

            let currentActive = null;
            for (let i = 0; i < nodesData.length; i++) {
              const node = nodesData[i];
              const dist = Math.sqrt(Math.pow(p.x - node.x, 2) + Math.pow(p.y - node.y, 2));
              if (dist < 40) {
                currentActive = node.id;
                break;
              }
            }
            setActiveNodeId(currentActive);
          };
        })
        .on("end", animatePacket);
    }

    animatePacket();

    return () => {
      isAnimating = false;
      d3.select(svgRef.current).selectAll("*").interrupt(); 
    };
  }, [dimensions]);

  const width = dimensions.width;
  const isMobile = width > 0 && width < 768;
  const isTablet = width >= 768 && width < 1024;
  const margin = { top: 40, right: 40, bottom: 40, left: 40 };
  const minDesktopWidth = 1000;
  const innerWidth = isMobile ? width - margin.left - margin.right : Math.max(width, minDesktopWidth) - margin.left - margin.right;
  const innerHeight = isMobile ? NODES.length * 100 : 250;

  return (
    <div className="relative w-full max-w-[1200px] mx-auto py-12" ref={containerRef}>
      <div className="overflow-x-auto pb-16 no-scrollbar relative min-h-[400px]">
        <div style={{ width: isMobile ? "100%" : Math.max(width, minDesktopWidth) }} className="relative mx-auto">
          {/* D3 SVG Background */}
          <svg
            ref={svgRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
            style={{ minHeight: isMobile ? innerHeight + margin.top + margin.bottom : innerHeight }}
          />

          {/* React HTML Nodes */}
          {dimensions.width > 0 && (
            <div 
              className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
              style={{ transform: `translate(${margin.left}px, ${isMobile ? margin.top : innerHeight / 2}px)` }}
            >
              {NODES.map((node, i) => {
                let x, y;
                if (isMobile) {
                  x = innerWidth / 2;
                  y = i * 100;
                } else {
                  x = (i / (NODES.length - 1)) * innerWidth;
                  y = 0;
                }

                const isActive = activeNodeId === node.id;
                const isHovered = hoveredNode === node.id;
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
                    }}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Node Card */}
                    <div
                      className={cn(
                        "relative flex flex-col items-center justify-center rounded-2xl border transition-all duration-300 bg-white",
                        isMobile ? "w-56 p-4" : (isTablet ? "w-24 p-3" : "w-28 p-4"),
                        isActive
                          ? "border-signal shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-105"
                          : "border-border shadow-sm hover:border-ink/20"
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

                    {/* Floating Hover Card */}
                    <div
                      className={cn(
                        "absolute z-50 transition-all duration-300 w-48 bg-surface-elevated border border-border rounded-xl p-4 shadow-xl",
                        isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
                        isMobile 
                          ? "left-full ml-4 top-1/2 -translate-y-1/2" 
                          : "top-full mt-4 left-1/2 -translate-x-1/2"
                      )}
                    >
                      <div className="font-display text-sm mb-3 border-b border-border pb-2 text-ink">
                        {node.title}
                      </div>
                      <ul className="space-y-2">
                        {node.details.map((detail, idx) => (
                          <li key={idx} className="flex items-center gap-2 font-kelly text-xs tracking-wide text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-signal/60" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
