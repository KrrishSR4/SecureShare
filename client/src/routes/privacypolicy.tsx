import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Shield, Lock, Key, Users, EyeOff, Activity, ShieldCheck, Database, FileText, Globe, CheckCircle2, Server, Cloud, Zap, Fingerprint } from "lucide-react";
import { Footer } from "@/components/secureshare";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/privacypolicy")({
  component: PrivacyPolicyPage,
});

const SECTIONS = [
  { id: "introduction", label: "Introduction" },
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "how-we-use-data", label: "How We Use Data" },
  { id: "file-privacy", label: "File Privacy" },
  { id: "encryption", label: "Encryption" },
  { id: "authentication", label: "Authentication" },
  { id: "cookies", label: "Cookies" },
  { id: "third-party", label: "Third Party Services" },
  { id: "data-retention", label: "Data Retention" },
  { id: "user-rights", label: "User Rights" },
  { id: "security", label: "Security" },
  { id: "compliance", label: "Compliance" },
  { id: "principles", label: "Privacy Principles" },
  { id: "contact", label: "Contact" },
];

function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>("introduction");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by how close they are to the top of the viewport
          visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      { rootMargin: "-10% 0px -80% 0px", threshold: 0 }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 100,
        behavior: "smooth",
      });
    }
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate({ to: ".." });
    } else {
      navigate({ to: "/" });
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-primary/20 selection:text-primary">
      {/* Top Bar with Back Button */}
      <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center">
          <button
            onClick={handleBack}
            className="group flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-16 items-start">
        {/* Sticky Table of Contents (Desktop) */}
        <aside className="hidden lg:block sticky top-32 max-h-[calc(100vh-8rem)] overflow-y-auto pr-6 custom-scrollbar">
          <nav className="flex flex-col space-y-1">
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={cn(
                  "text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  activeSection === id
                    ? "bg-primary/10 text-primary"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                )}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="max-w-[800px] w-full mx-auto lg:mx-0">
          
          {/* Hero Section */}
          <header className="mb-20">
            <span className="inline-block px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold tracking-widest mb-6">
              LEGAL
            </span>
            <h1 className="font-display text-5xl md:text-6xl tracking-tight text-zinc-900 mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-zinc-600 leading-relaxed mb-10">
              Your privacy matters. SecureShare is built with a privacy-first philosophy and every feature is designed to protect your information, your files and your identity.
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-8 border-t border-zinc-100">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Last Updated</p>
                <p className="font-medium text-zinc-900">July 2026</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Version</p>
                <p className="font-medium text-zinc-900">v1.0.0</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Effective Date</p>
                <p className="font-medium text-zinc-900">July 2026</p>
              </div>
            </div>
          </header>

          <div className="space-y-24 text-zinc-600 leading-relaxed text-lg">
            
            {/* Section 1: Introduction */}
            <section id="introduction" className="scroll-mt-32">
              <h2 className="font-display text-3xl text-zinc-900 mb-6">1. Introduction</h2>
              <p className="mb-4">
                This Privacy Policy describes how SecureShare collects, uses, and protects your personal data. SecureShare is a platform designed to provide highly secure <span className="font-semibold text-zinc-900">Data Sharing</span> infrastructure for modern organizations and individuals.
              </p>
              <p>
                We believe that <span className="font-semibold text-primary">Privacy</span> and <span className="font-semibold text-primary">Security</span> are fundamental human rights. By employing advanced <span className="font-semibold text-zinc-900">Encryption</span>, we ensure that both <span className="font-semibold text-zinc-900">Users</span> and the <span className="font-semibold text-zinc-900">Platform</span> operate in a zero-trust environment where your data remains exclusively yours.
              </p>
            </section>

            {/* Section 2: Information We Collect */}
            <section id="information-we-collect" className="scroll-mt-32">
              <h2 className="font-display text-3xl text-zinc-900 mb-6">2. Information We Collect</h2>
              <p className="mb-8">
                To provide our services efficiently, we collect minimal amounts of data. The table below outlines exactly what we collect and why.
              </p>
              <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-900">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Information</th>
                      <th className="px-6 py-4 font-semibold">Purpose</th>
                      <th className="px-6 py-4 font-semibold">Examples</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <tr className="bg-white">
                      <td className="px-6 py-4 font-medium text-zinc-900">Profile Data</td>
                      <td className="px-6 py-4">Account identification and display</td>
                      <td className="px-6 py-4 text-zinc-500">Name, Email, Profile Picture</td>
                    </tr>
                    <tr className="bg-zinc-50/50">
                      <td className="px-6 py-4 font-medium text-zinc-900">Authentication</td>
                      <td className="px-6 py-4">Verifying user identity securely</td>
                      <td className="px-6 py-4 text-zinc-500">Authentication Provider, Login History</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-6 py-4 font-medium text-zinc-900">Service Usage</td>
                      <td className="px-6 py-4">Facilitating core platform features</td>
                      <td className="px-6 py-4 text-zinc-500">Uploaded Files, Shared Links</td>
                    </tr>
                    <tr className="bg-zinc-50/50">
                      <td className="px-6 py-4 font-medium text-zinc-900">Security Metrics</td>
                      <td className="px-6 py-4">Preventing abuse and monitoring security</td>
                      <td className="px-6 py-4 text-zinc-500">Access Logs, Audit Logs, IP Address</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-6 py-4 font-medium text-zinc-900">Device Info</td>
                      <td className="px-6 py-4">Optimizing experience and security heuristics</td>
                      <td className="px-6 py-4 text-zinc-500">Browser, Operating System, Device Information</td>
                    </tr>
                    <tr className="bg-zinc-50/50">
                      <td className="px-6 py-4 font-medium text-zinc-900">Preferences</td>
                      <td className="px-6 py-4">Personalizing user experience</td>
                      <td className="px-6 py-4 text-zinc-500">Timezone, Language Preference</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 3: How We Use Data */}
            <section id="how-we-use-data" className="scroll-mt-32">
              <h2 className="font-display text-3xl text-zinc-900 mb-6">3. How We Use Your Information</h2>
              <p className="mb-6">We strictly use your information to operate and improve SecureShare. Specifically, we utilize data for:</p>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                  <span>Providing strict <span className="font-semibold text-zinc-900">Authentication</span> and <span className="font-semibold text-zinc-900">Authorization</span> to ensure only you access your account.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                  <span>Facilitating Secure File Sharing and generating <span className="font-semibold text-primary">Secure Links</span>.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                  <span>Maintaining immutable <span className="font-semibold text-zinc-900">Audit Logs</span> for Security Monitoring and Fraud Detection.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                  <span>Delivering Customer Support and Performance Improvements.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                  <span>Ensuring <span className="font-semibold text-zinc-900">Compliance</span> with legal obligations.</span>
                </li>
              </ul>
            </section>

            {/* Section 4: File Privacy */}
            <section id="file-privacy" className="scroll-mt-32">
              <h2 className="font-display text-3xl text-zinc-900 mb-6">4. File Privacy</h2>
              <p className="mb-4">
                Your files are strictly <span className="font-semibold text-primary">Private</span> and <span className="font-semibold text-primary">Encrypted</span>. They are never publicly indexed by search engines and are only accessible to authorised recipients.
              </p>
              <p className="mb-4">
                SecureShare operates on a <span className="font-semibold text-zinc-900">Zero Trust</span> model with <span className="font-semibold text-zinc-900">Least Privilege</span> access. This means users always remain in complete control. 
              </p>
              <p>
                Using granular <span className="font-semibold text-zinc-900">Access Control</span>, you can instantly <span className="font-semibold text-red-500">Revoke Access</span> to any file, forcefully expire links, or change permissions retroactively.
              </p>
            </section>

            {/* Section 5: Encryption */}
            <section id="encryption" className="scroll-mt-32">
              <h2 className="font-display text-3xl text-zinc-900 mb-6">5. Encryption</h2>
              <p className="mb-4">
                We employ military-grade <span className="font-semibold text-zinc-900">AES-256</span> encryption for all data at rest. During transit, all communication is secured using <span className="font-semibold text-primary">HTTPS</span> and modern <span className="font-semibold text-zinc-900">TLS</span> protocols.
              </p>
              <p>
                Our End-to-End inspired architecture relies on sophisticated <span className="font-semibold text-primary">Encryption</span> Keys and <span className="font-semibold text-zinc-900">Signed URLs</span> to guarantee <span className="font-semibold text-zinc-900">Integrity</span>. Secure Download Links are cryptographically tied to the recipient's identity.
              </p>
            </section>

            {/* Section 6: Authentication & Identity */}
            <section id="authentication" className="scroll-mt-32">
              <h2 className="font-display text-3xl text-zinc-900 mb-6">6. Authentication & Identity</h2>
              <p className="mb-4">
                SecureShare handles your <span className="font-semibold text-primary">Identity</span> with paramount care. We support Email Sign Up/Login as well as <span className="font-semibold text-zinc-900">OAuth</span> integrations (Google OAuth & GitHub OAuth). 
              </p>
              <p>
                Session Management is governed by secure <span className="font-semibold text-zinc-900">JWT</span> (JSON Web Tokens). Short-lived access tokens work in tandem with long-lived HttpOnly <span className="font-semibold text-primary">Refresh Tokens</span> to keep your sessions safe. Password Reset and Email <span className="font-semibold text-zinc-900">Verification</span> flows ensure strict account recovery processes.
              </p>
            </section>

            {/* Section 7: Cookies */}
            <section id="cookies" className="scroll-mt-32">
              <h2 className="font-display text-3xl text-zinc-900 mb-6">7. Cookies</h2>
              <p className="mb-4">
                We use strict HttpOnly <span className="font-semibold text-primary">Cookies</span> to manage your <span className="font-semibold text-zinc-900">Session</span> and provide <span className="font-semibold text-zinc-900">Security</span> guarantees (such as CSRF protection). 
              </p>
              <p>
                Additionally, minimal <span className="font-semibold text-zinc-900">Preferences</span> cookies may be stored to remember your timezone or theme. Analytics cookies are only utilized if explicitly enabled. SecureShare strictly avoids unnecessary tracking cookies.
              </p>
            </section>

            {/* Section 8: Third Party Services */}
            <section id="third-party" className="scroll-mt-32">
              <h2 className="font-display text-3xl text-zinc-900 mb-6">8. Third Party Services</h2>
              <p className="mb-4">
                We integrate with industry-leading third-party services to provide reliable infrastructure:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><span className="font-semibold text-zinc-900">Google OAuth & GitHub OAuth</span>: For seamless, passwordless identity verification.</li>
                <li><span className="font-semibold text-zinc-900">Supabase</span>: For robust Postgres database management and authentication edge functions.</li>
                <li><span className="font-semibold text-zinc-900">Cloudflare</span>: For DNS routing, DDoS protection, and global CDN delivery.</li>
                <li><span className="font-semibold text-zinc-900">Vercel</span>: For secure edge hosting of our frontend interfaces.</li>
              </ul>
            </section>

            {/* Section 9: Data Retention */}
            <section id="data-retention" className="scroll-mt-32">
              <h2 className="font-display text-3xl text-zinc-900 mb-6">9. Data Retention</h2>
              <p className="mb-4">
                Our <span className="font-semibold text-zinc-900">Retention</span> policy is strict and user-centric. Files remain in our secure storage only as long as you dictate. 
              </p>
              <p>
                Upon <span className="font-semibold text-primary">Expiration</span> of a link, or manual <span className="font-semibold text-red-500">Deletion</span> of a file, data is permanently purged from our primary stores. If an account is removed, all associated files and audit logs are securely scrubbed without possibility of <span className="font-semibold text-zinc-900">Recovery</span>.
              </p>
            </section>

            {/* Section 10: User Rights */}
            <section id="user-rights" className="scroll-mt-32">
              <h2 className="font-display text-3xl text-zinc-900 mb-6">10. User Rights</h2>
              <p className="mb-6">
                You retain complete <span className="font-semibold text-primary">Ownership</span> of your data. At any time, you have the right to:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50">
                  <span className="font-semibold text-red-500 block mb-1">Delete</span>
                  <span className="text-sm">Permanently delete your account and all files.</span>
                </div>
                <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50">
                  <span className="font-semibold text-primary block mb-1">Download</span>
                  <span className="text-sm">Download an archive of all your personal data.</span>
                </div>
                <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50">
                  <span className="font-semibold text-zinc-900 block mb-1">Update</span>
                  <span className="text-sm">Update your profile or change your password instantly.</span>
                </div>
                <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50">
                  <span className="font-semibold text-zinc-900 block mb-1">Revoke</span>
                  <span className="text-sm">Revoke access to any file you've shared.</span>
                </div>
              </div>
            </section>

            {/* Section 11: Security Measures */}
            <section id="security" className="scroll-mt-32">
              <h2 className="font-display text-3xl text-zinc-900 mb-6">11. Security Measures</h2>
              <p className="mb-8">
                Security is embedded into every layer of our platform. Our infrastructure relies on industry-leading paradigms to keep your data safe.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: Lock, title: "AES-256 Encryption", desc: "Military-grade encryption at rest." },
                  { icon: Shield, title: "Zero Trust", desc: "Never trust, always verify every request." },
                  { icon: Users, title: "Role Based Access Control", desc: "Granular permissions for teams." },
                  { icon: Key, title: "JWT Authentication", desc: "Stateless, secure session tokens." },
                  { icon: Activity, title: "Refresh Tokens", desc: "Rotated securely via HttpOnly cookies." },
                  { icon: FileText, title: "Audit Logs", desc: "Immutable records of file interactions." },
                  { icon: Globe, title: "Signed URLs", desc: "Cryptographically verified download links." },
                  { icon: Database, title: "Secure File Storage", desc: "Isolated and encrypted storage buckets." },
                  { icon: ShieldCheck, title: "Policy Enforcement", desc: "Strict adherence to sharing rules." },
                  { icon: Zap, title: "Rate Limiting", desc: "Protection against brute-force attacks." },
                  { icon: CheckCircle2, title: "Input Validation", desc: "Sanitization of all incoming payloads." },
                  { icon: EyeOff, title: "Password Hashing", desc: "Argon2 / bcrypt standard hashing." },
                  { icon: Server, title: "HTTPS", desc: "Encrypted transit everywhere." },
                  { icon: Fingerprint, title: "Security Headers", desc: "Strict CSP and HSTS enforcement." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-5 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-colors bg-white shadow-sm">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 text-base">{item.title}</h3>
                      <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 12: Compliance */}
            <section id="compliance" className="scroll-mt-32">
              <h2 className="font-display text-3xl text-zinc-900 mb-6">12. Compliance</h2>
              <p className="mb-8">
                SecureShare operates on principles derived from the world's most stringent compliance frameworks. While we do not claim official certification unless obtained, our architecture adheres to industry best practices.
              </p>
              <div className="flex flex-wrap gap-4">
                {["GDPR Ready", "HIPAA Aligned", "SOC 2 Inspired", "ISO 27001 Principles", "Privacy by Design"].map((badge, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 bg-white shadow-sm font-medium text-sm text-zinc-700">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    {badge}
                  </div>
                ))}
              </div>
            </section>

            {/* Section 13: Privacy Principles */}
            <section id="principles" className="scroll-mt-32">
              <h2 className="font-display text-3xl text-zinc-900 mb-6">13. Our Privacy Principles</h2>
              <div className="p-8 md:p-10 rounded-2xl bg-zinc-950 text-zinc-400">
                <ul className="space-y-6">
                  {[
                    { title: "Privacy by Design", desc: "Privacy is not an afterthought; it is built into the foundation of every feature." },
                    { title: "Secure by Default", desc: "The highest level of security configurations are active immediately for all users." },
                    { title: "Zero Trust Architecture", desc: "No request is trusted implicitly, regardless of network origin." },
                    { title: "Least Privilege", desc: "Users and systems only have access to the exact data they need to function." },
                    { title: "Transparent Access Logs", desc: "You maintain visibility into exactly when and how your data was accessed." },
                    { title: "Encryption First", desc: "Data is protected cryptographically before it is stored on disk." },
                    { title: "User Ownership", desc: "You own your data. We merely act as a secure conduit." },
                    { title: "Minimal Data Collection", desc: "We only ask for what we absolutely need to provide the service." }
                  ].map((item, i) => (
                    <li key={i} className="flex gap-4">
                      <div className="mt-1">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <div>
                        <strong className="text-white block mb-1">{item.title}</strong>
                        <span className="text-zinc-400 leading-relaxed text-sm">{item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Section 14: Contact */}
            <section id="contact" className="scroll-mt-32 pb-24 border-b border-zinc-200">
              <h2 className="font-display text-3xl text-zinc-900 mb-6">14. Contact</h2>
              <div className="p-8 rounded-2xl border border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 mb-2">Need help or have questions?</h3>
                  <p className="text-zinc-600">Our privacy team is available to assist you with any concerns.</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <a href="mailto:privacy@secureshare.dev" className="text-primary hover:underline font-medium">privacy@secureshare.dev</a>
                  <a href="mailto:support@secureshare.dev" className="text-primary hover:underline font-medium">support@secureshare.dev</a>
                  <p className="text-xs text-zinc-500 mt-2 font-medium">Expected response time: within 48 hours</p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
