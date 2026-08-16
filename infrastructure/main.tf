# 1. Cloudflare Pages Project for SecureShare Frontend
resource "cloudflare_pages_project" "frontend" {
  account_id        = var.cloudflare_account_id
  name              = var.project_name
  production_branch = var.production_branch

  build_config {
    build_command   = "npm run build"
    destination_dir = "dist"
    root_dir        = "client"
  }

  deployment_configs {
    production {
      environment_variables = {
        NODE_VERSION = "22"
        ENVIRONMENT  = var.environment
      }
    }
    preview {
      environment_variables = {
        NODE_VERSION = "22"
        ENVIRONMENT  = "preview"
      }
    }
  }
}

# 2. Cloudflare Worker for SecureShare Backend
resource "cloudflare_workers_script" "backend" {
  account_id = var.cloudflare_account_id
  name       = "${var.project_name}-backend"
  content    = "export default { async fetch(request, env) { return new Response('SecureShare Cloudflare Worker running'); } };"
  module     = true

  compatibility_date  = "2024-01-01"
  compatibility_flags = ["nodejs_compat"]
}
