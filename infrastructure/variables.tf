variable "cloudflare_api_token" {
  description = "Cloudflare API token with permissions for Pages and Workers"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare DNS Zone ID (optional if custom domain is not used)"
  type        = string
  default     = null
}

variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Base project name used for resource naming"
  type        = string
  default     = "secureshare"
}

variable "domain_name" {
  description = "Custom domain name (optional)"
  type        = string
  default     = null
}

variable "production_branch" {
  description = "Git production branch for Cloudflare Pages"
  type        = string
  default     = "main"
}
