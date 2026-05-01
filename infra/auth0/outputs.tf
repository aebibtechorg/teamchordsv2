output "auth0_domain" {
  description = "Auth0 tenant domain consumed by the API and web apps"
  value       = var.auth0_domain
}

output "auth0_audience" {
  description = "Team Chords API audience"
  value       = auth0_resource_server.teamchords_api.identifier
}

output "auth0_client_id" {
  description = "Machine-to-machine client ID used by the API to call the Auth0 Management API"
  value       = auth0_client.api_management.client_id
}

output "auth0_client_secret" {
  description = "Machine-to-machine client secret used by the API to call the Auth0 Management API"
  value       = auth0_client_credentials.api_management.client_secret
  sensitive   = true
}

output "web_auth0_domain" {
  description = "Auth0 domain exposed to the customer SPA"
  value       = var.auth0_domain
}

output "web_auth0_client_id" {
  description = "Customer SPA Auth0 client ID"
  value       = auth0_client.customer_spa.client_id
}

output "web_auth0_audience" {
  description = "Customer SPA Auth0 audience"
  value       = auth0_resource_server.teamchords_api.identifier
}

output "admin_auth0_domain" {
  description = "Auth0 domain exposed to the admin SPA"
  value       = var.auth0_domain
}

output "admin_auth0_client_id" {
  description = "Admin SPA Auth0 client ID"
  value       = auth0_client.admin_spa.client_id
}

output "admin_auth0_audience" {
  description = "Admin SPA Auth0 audience"
  value       = auth0_resource_server.teamchords_api.identifier
}

output "database_connection_name" {
  description = "Database connection name expected by the customer app and API"
  value       = auth0_connection.database.name
}

output "google_connection_name" {
  description = "Google social connection name enabled only for the customer app"
  value       = auth0_connection.google.name
}

output "platform_admin_role_id" {
  description = "Auth0 role ID for platform-admin"
  value       = auth0_role.platform_admin.id
}

output "support_role_id" {
  description = "Auth0 role ID for support"
  value       = auth0_role.support.id
}

