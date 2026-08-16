output "pages_project_name" {
  description = "Cloudflare Pages project name"
  value       = cloudflare_pages_project.frontend.name
}

output "pages_subdomain" {
  description = "Default subdomain URL for Cloudflare Pages frontend"
  value       = cloudflare_pages_project.frontend.subdomain
}

output "worker_name" {
  description = "Cloudflare Worker backend script name"
  value       = cloudflare_workers_script.backend.name
}

output "environment" {
  description = "Current deployment environment"
  value       = var.environment
}
