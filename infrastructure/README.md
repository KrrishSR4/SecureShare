# SecureShare — Infrastructure as Code (IaC)

This directory contains production-ready Terraform configurations for managing SecureShare deployment infrastructure on Cloudflare.

---

## 1. Architecture Overview
- **Cloudflare Pages**: Hosts and automatically builds the Vite/React frontend (`client/`).
- **Cloudflare Workers**: Serverless edge runtime for backend API processing (`server/`).
- **Prisma & Supabase**: Managed PostgreSQL database, authentication, and audit logs.

---

## 2. Directory Structure
```
infrastructure/
├── main.tf                    # Cloudflare Pages and Workers resource declarations
├── variables.tf               # Variable definitions with types and descriptions
├── outputs.tf                 # Non-sensitive resource outputs
├── providers.tf               # Terraform and Cloudflare provider version constraints
├── terraform.tfvars.example   # Safe placeholder variable file
├── environments/
│   ├── dev.tfvars.example     # Development environment values template
│   └── prod.tfvars.example    # Production environment values template
├── .gitignore                 # State and secret file exclusions
└── README.md                  # Operator guide and architecture documentation
```

---

## 3. Required Variables
| Variable | Description | Example |
| :--- | :--- | :--- |
| `cloudflare_api_token` | API token with Pages and Workers permissions | Sensitive String |
| `cloudflare_account_id` | 32-character Cloudflare Account ID | `0123456789abcdef0123456789abcdef` |
| `environment` | Target environment (`dev`, `staging`, `prod`) | `dev` |
| `project_name` | Resource prefix name | `secureshare` |
| `production_branch` | Production deployment branch | `main` |

---

## 4. Operator Workflow

All Terraform operations are executed manually by the engineer.

### Step 1: Initialize Terraform
```bash
cd infrastructure
terraform init
```

### Step 2: Validate Configuration
```bash
terraform validate
```

### Step 3: Generate Execution Plan
```bash
terraform plan -var-file="environments/dev.tfvars"
```

### Step 4: Apply Changes (Only after manual review)
```bash
terraform apply -var-file="environments/dev.tfvars"
```
