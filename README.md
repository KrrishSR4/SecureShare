# SecureShare: Enterprise-Grade Zero-Knowledge File Sharing Platform

SecureShare is a privacy-first, enterprise-grade secure data sharing platform that enables organizations to upload, encrypt, govern, and distribute sensitive files with absolute control. Built with a zero-knowledge architecture, the platform encrypts files on the client side using AES-GCM-256 before transit, ensuring that service hosts and unauthorized third parties have zero access to raw payload data. The system provides real-time access monitoring, instant link revocation, automated compliance validation (SOC 2, GDPR, HIPAA), and dynamic policy enforcement.

---

## Roadmap

The development trajectory of SecureShare is structured into chronological milestones:

- **Phase 1: Core Architecture & Zero-Knowledge Pipeline** (Completed)
  - Configure root monorepo architecture using npm workspaces.
  - Implement client-side cryptographic engine (Web Crypto API) for local encryption.
  - Build standalone secure sharing route `/share` with access configurations.
- **Phase 2: Backend Persistence Layer** (In Progress)
  - Initialize PostgreSQL database hosting and establish connections via Prisma ORM.
  - Build JWT-based enterprise authentication routes with HttpOnly cookies.
  - Define schema structures for tracking file metadata, access logs, and active shares.
- **Phase 3: Granular Access Control & Revocation** (Planned)
  - Implement IP-range restrictions and geo-fencing for shared links.
  - Integrate single-use download tokens that self-destruct upon request completion.
  - Bind WebSocket events for instant real-time access revocation.
- **Phase 4: Compliance Auditing & Log Engine** (Planned)
  - Establish immutable append-only audit logs for compliance tracking.
  - Build automated webhook alerts for policy violations.
  - Develop regulatory PDF report generation (SOC 2, ISO 27001 readiness).

---

## Implementation Plan

SecureShare processes files locally, uploads encrypted ciphertexts, and distributes access links where the decryption key remains strictly on the client side:

```mermaid
graph TD
    A["Source File (diligence_report.pdf)"] --> B["Client Cryptographic Engine"]
    B --> C["Derive Ephemeral AES-256 Key"]
    B --> D["Generate Ciphertext Block"]
    D --> E["Upload Ciphertext to Express Server"]
    C --> F["Client-Side Key Hash Fragment (#key)"]
    F --> G["Generate Secure Link (secureshare.io/share#key)"]
    E --> H["Store Encrypted Payload (PostgreSQL)"]
    G --> I["Recipient Access Request"]
    I --> J["Security Verification Pipeline (IP / Expiry / Password)"]
    J -- "Valid" --> K["Download Ciphertext & Decrypt in Browser"]
    J -- "Invalid / Revoked" --> L["Access Denied (403 Forbidden)"]
```

---

## Features

- **Zero-Knowledge Encryption:** Files are encrypted locally using AES-GCM-256 in the browser. The encryption key is appended to the URL as a hash fragment (`#`), ensuring it is never transmitted to the network or stored in database systems.
- **Dedicated File Sharing Page:** A standalone `/share` route providing drag-and-drop uploads, access password requirements, expiration configurations, and download limit restrictions.
- **Real-Time Revocation:** Instantly terminate active download permissions. Revocation updates propagate immediately, denying access to active sessions.
- **Compliance Guardrails:** Interactive checks for GDPR and HIPAA compliance, automatically screening file metadata and enforcing regulatory residency rules.
- **High-Performance Motion UI:** Scroll-progress tracking, 3D perspective vector elements, and cursor-interactive neon spotlight text masking rendered at 120fps using direct DOM-level GSAP bindings.

---

## Tech Stack

- **Frontend client:** React 18, Vite, TypeScript, Tailwind CSS, TanStack Router, Framer Motion, GSAP (ScrollTrigger, MotionPathPlugin).
- **Backend API:** Node.js, Express, TypeScript, Zod.
- **Database & ORM:** PostgreSQL, Prisma ORM (v5.22.0).
- **Package Manager:** npm workspaces (Monorepo structure).

---

## System Architecture

### 1. Data Encryption Boundary (Security Architecture)

This diagram outlines how raw data remains isolated within the client trust boundary, transmitting only encrypted outputs and maintaining keys client-side.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client Browser
    participant Server as Express Server
    participant DB as PostgreSQL Database
    
    Client->>Client: Load File & Generate AES-GCM-256 Key
    Client->>Client: Encrypt File locally to Ciphertext
    Client->>Server: Send Ciphertext + Access Policies (No Key)
    Server->>DB: Store Ciphertext & Policy Metadata
    DB-->>Server: Confirm Storage Status
    Server-->>Client: Return Unique File ID
    Client->>Client: Generate URL containing File ID + Key Fragment (#)
```

### 2. Deployment Workspaces (Network Architecture)

This diagram shows the communication flow between the frontend application, the API backend, and the database storage layers.

```mermaid
graph LR
    subgraph Client Space
        A["Vite SPA Client (Port 5173)"]
    end
    subgraph Services Space
        B["Express API Server (Port 3000)"]
    end
    subgraph Database Space
        C["PostgreSQL DB (Port 5432)"]
    end
    
    A -- "REST / JSON" --> B
    B -- "Prisma Client TCP" --> C
```

---

## Project Folder Structure

SecureShare is structured as a monorepo containing decoupled client and server workspaces:

```
SecureShare/
├── client/                  # Frontend Single Page Application (Vite SPA)
│   ├── src/
│   │   ├── components/      # UI components and interactive elements
│   │   ├── routes/          # TanStack Router page routes (index.tsx, share.tsx)
│   │   ├── lib/             # Configuration utilities (gsap.ts)
│   │   ├── main.tsx         # Application entry point
│   │   └── router.tsx       # Routing logic definitions
│   ├── index.html           # Document template and asset loader
│   ├── package.json         # Client specific scripts and dependencies
│   └── vite.config.ts       # SPA build configuration
├── server/                  # Backend API Server (Node/Express)
│   ├── src/
│   │   └── index.ts         # Server entry point and routing middleware
│   ├── prisma/
│   │   └── schema.prisma    # Database schema model definition
│   ├── package.json         # Server dependencies and workspace setup
│   └── tsconfig.json        # TypeScript server configuration
├── package.json             # Root monorepo workspace configurations
└── .gitignore               # Global git exclusions
```

---

## Installation

### Prerequisites

Ensure you have Node.js (v18 or higher) and npm installed.

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/KrrishSR4/SecureShare.git
   cd SecureShare
   ```

2. Install dependencies for all workspaces:
   ```bash
   npm install
   ```

3. Configure environment variables inside `server/.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/secureshare"
   JWT_SECRET="your_jwt_secret_key"
   ```

4. Push the database schema:
   ```bash
   npm run db:push --workspace=server
   ```

5. Run the client development server:
   ```bash
   npm run dev --workspace=client
   ```

---

## Documentation

### Cryptographic Mechanism

1. **Key Generation:** The client uses the Web Crypto API to generate a cryptographically strong 256-bit symmetric key:
   ```javascript
   window.crypto.subtle.generateKey(
     { name: "AES-GCM", length: 256 },
     true,
     ["encrypt", "decrypt"]
   )
   ```
2. **IV Assignment:** A unique 12-byte Initialization Vector (IV) is generated for each encryption operation.
3. **Decryption URL:** Decryption credentials are built using `window.location.hash`, which browser clients do not send to servers during HTTP requests:
   ```
   https://secureshare.io/share/[file_id]#[key_hex]
   ```

---

## Security

- **Zero-Knowledge Architecture:** No plain-text data or decryption keys are processed or cached on server instances.
- **Zod Payload Validation:** All API endpoints validate schemas at runtime, preventing injection attacks.
- **Secure Transport:** Recommended deployment configuration forces TLS v1.3 with strict transport security headers (HSTS).

---

## Performance Optimizations

- **Direct DOM Manipulation:** Animations like scroll tracking and wordmark cursor spotlight write values directly to element attributes via GSAP. This bypasses React's diffing algorithms, guaranteeing 120fps performance on high-refresh displays.
- **Workspaces Dependency Resolution:** Shared libraries are cached at the monorepo root level, optimizing lock files and reducing development build times.
- **SVG Vector Assets:** Graphic visuals and large branding elements are designed using vector paths, minimizing image payload sizes.

---

## Challenges & Learning

- **Prisma Integration Compatibility:** Downgraded Prisma dependencies to `5.22.0` to preserve compatibility with standard database connection strings in server environments.
- **React Hydration Compliance:** Refactored compound controls to resolve React nesting errors (nested anchor configurations), preventing hydration violations and restoring standard DOM event listener executions.
- **Vector Transformation Mapping:** Calculated viewport boundaries against SVG coordinate grids dynamically to bind coordinates without layout drift.
