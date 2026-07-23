import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { gsap } from "@/lib/gsap";
import {
  ArchitectureDiagram,
  ComplianceMarquee,
  FeaturesBento,
  Footer,
  HeroVisualization,
  LoadSequence,
  MagneticButton,
  Metrics,
  Nav,
  PrivacyEngine,
  ProblemSection,
  ProductDemo,
  Reveal,
  ScrollProgress,
  Section,
  Spotlight,
  Testimonials,
  WordReveal,
} from "@/components/secureshare";
import { useLenis } from "@/lib/use-lenis";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  useLenis();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  useEffect(() => {
    // Parallax background blobs using GSAP
    gsap.to(".blob-parallax", {
      y: 250,
      x: 100,
      ease: "none",
      scrollTrigger: {
        trigger: "#top",
        start: "top top",
        end: "bottom top",
        scrub: 1.5,
      },
    });

    gsap.to(".blob-parallax-2", {
      y: -350,
      x: -150,
      ease: "none",
      scrollTrigger: {
        trigger: "#top",
        start: "top top",
        end: "bottom top",
        scrub: 2,
      },
    });

    gsap.to(".blob-parallax-3", {
      y: -200,
      x: 80,
      ease: "none",
      scrollTrigger: {
        trigger: "#top",
        start: "top top",
        end: "bottom top",
        scrub: 1.2,
      },
    });

    // Staggered Page-Load Hero Timeline
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.fromTo(
      ".hero-eyebrow",
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.2 }
    )
      .fromTo(
        ".hero-title-line",
        { opacity: 0, y: 35 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 },
        "-=0.5"
      )
      .fromTo(
        ".hero-description",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8 },
        "-=0.6"
      )
      .fromTo(
        ".hero-buttons",
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.6 },
        "-=0.5"
      )
      .fromTo(
        ".hero-badges > div",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 },
        "-=0.4"
      )
      .fromTo(
        ".hero-visual",
        { opacity: 0, scale: 0.94, rotateX: -8 },
        { opacity: 1, scale: 1, rotateX: 0, duration: 1.2, ease: "power3.out" },
        "-=0.6"
      );
  }, []);

  return (
    <div id="top" className="relative min-h-screen bg-background text-foreground grain overflow-hidden">
      {/* Background Parallax Blobs */}
      <div className="blob-parallax absolute top-[-5%] left-[-5%] w-[500px] h-[500px] rounded-full bg-signal/10 blur-[120px] pointer-events-none z-0" />
      <div className="blob-parallax-2 absolute top-[25%] right-[-10%] w-[650px] h-[650px] rounded-full bg-accent/15 blur-[150px] pointer-events-none z-0" />
      <div className="blob-parallax-3 absolute bottom-[15%] left-[2%] w-[450px] h-[450px] rounded-full bg-signal/8 blur-[130px] pointer-events-none z-0" />

      <LoadSequence />
      <ScrollProgress />
      <Spotlight />
      <Nav />

      {/* ============ HERO ============ */}
      <section ref={heroRef} className="relative overflow-hidden pt-32 md:pt-40 pb-16">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            {/* Left Column (Text & CTAs) */}
            <div className="flex flex-col items-start text-left">
              <div className="hero-eyebrow opacity-0 eyebrow flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                Privacy Infrastructure · v1.0
              </div>

              <h1 className="mt-6 max-w-[15ch] font-display text-[10vw] leading-[0.92] tracking-tight md:text-[6.5vw] lg:text-[4.85rem]">
                <span className="hero-title-line inline-block opacity-0">
                  Data <span className="bg-gradient-to-r from-foreground to-signal bg-clip-text text-transparent">sharing</span>
                </span>
                <br />
                <span className="hero-title-line inline-block italic text-muted-foreground opacity-0">
                  without trusting
                </span>
                <br />
                <span className="hero-title-line inline-block opacity-0">anyone.</span>
              </h1>

              <p className="hero-description opacity-0 mt-6 max-w-xl text-lg text-muted-foreground text-balance md:text-xl">
                Securely share sensitive information with built-in encryption, automated privacy enforcement,
                compliance validation, audit trails, and enterprise-grade access control.
              </p>

              <div className="hero-buttons opacity-0 mt-8 flex flex-wrap items-center gap-3">
                <MagneticButton variant="primary">
                  Request access <ArrowRight className="h-4 w-4" />
                </MagneticButton>
                <MagneticButton variant="ghost">
                  See how it works
                </MagneticButton>
              </div>

              <div className="hero-badges mt-10 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" /> SOC 2 Type II
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" /> ISO 27001
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" /> HIPAA
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" /> GDPR
                </div>
              </div>
            </div>

            {/* Right Column (Vault Visualization) */}
            <div className="hero-visual opacity-0 lg:mt-0 mt-8 w-full">
              <HeroVisualization />
            </div>
          </div>
        </motion.div>

        <div className="mt-12">
          <ComplianceMarquee />
        </div>
      </section>

      {/* ============ PROBLEM ============ */}
      <Section
        id="problem"
        eyebrow="The problem"
        title={<>Once a file leaves your <span className="italic text-muted-foreground">walls</span>, it's gone.</>}
        intro="Traditional sharing depends on trust. Trust the recipient. Trust their inbox. Trust their laptop. SecureShare replaces trust with cryptographic control."
      >
        <ProblemSection />
      </Section>

      {/* ============ PRODUCT DEMO ============ */}
      <Section
        id="product"
        eyebrow="The product"
        title={<>Share sensitive data <span className="italic text-muted-foreground">in six moves</span>.</>}
        intro="Upload. Choose recipients. Apply a policy. Share. Monitor every access. Revoke at any time."
      >
        <Reveal delay={0.1} y={40}>
          <ProductDemo />
        </Reveal>
      </Section>

      {/* ============ PRIVACY ENGINE ============ */}
      <Section
        id="privacy"
        eyebrow="Privacy Engine"
        title={<>Enforcement at every <span className="italic text-muted-foreground">stage</span>.</>}
        intro="Privacy isn't a checkbox at the end. It's compiled into the payload before it leaves the browser."
      >
        <PrivacyEngine />
      </Section>

      {/* ============ FEATURES ============ */}
      <Section
        id="features"
        eyebrow="Capabilities"
        title={<>Built for the teams that <span className="italic text-muted-foreground">cannot</span> afford a leak.</>}
        intro="Ten capabilities. One control plane. Every action provable."
      >
        <FeaturesBento />
      </Section>

      {/* ============ METRICS ============ */}
      <Section
        eyebrow="By the numbers"
        title={<>Trusted with the data that <span className="italic text-muted-foreground">matters most</span>.</>}
      >
        <Metrics />
      </Section>

      {/* ============ ARCHITECTURE ============ */}
      <Section
        id="security"
        eyebrow="Security architecture"
        title={<>Six layers. <span className="italic text-muted-foreground">One</span> guarantee.</>}
        intro="Defense in depth from the identity that requests access to the audit log that records it."
      >
        <ArchitectureDiagram />
      </Section>

      {/* ============ TESTIMONIALS ============ */}
      <Section
        id="customers"
        eyebrow="Field notes"
        title={<>From security teams who <span className="italic text-muted-foreground">stopped worrying</span>.</>}
      >
        <Testimonials />
      </Section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative overflow-hidden border-t border-border">
        <div className="mx-auto max-w-[1400px] px-6 py-20 md:px-10 md:py-32">
          <Reveal>
            <div className="eyebrow flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              Get started
            </div>
          </Reveal>
          <h2 className="mt-8 font-display text-[14vw] leading-[0.95] tracking-tight md:text-[10vw] lg:text-[9rem]">
            <WordReveal text="Privacy shouldn't" />
            <br />
            <span className="italic text-muted-foreground">
              <WordReveal text="be optional." />
            </span>
          </h2>
          <Reveal delay={0.2}>
            <p className="mt-10 max-w-xl text-lg text-muted-foreground text-balance md:text-xl">
              Protect sensitive data with automated privacy infrastructure designed for modern organizations.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <MagneticButton variant="primary">
                Request access <ArrowRight className="h-4 w-4" />
              </MagneticButton>
              <MagneticButton variant="ghost">Talk to security</MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
