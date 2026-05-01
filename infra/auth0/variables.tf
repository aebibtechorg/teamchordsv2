variable "auth0_domain" {
  description = "Auth0 tenant domain, for example tenant.us.auth0.com"
  type        = string
}

variable "auth0_management_client_id" {
  description = "Auth0 Machine-to-Machine application client ID used by Terraform to manage the tenant"
  type        = string
}

variable "auth0_management_client_secret" {
  description = "Auth0 Machine-to-Machine application client secret used by Terraform to manage the tenant"
  type        = string
  sensitive   = true
}

variable "api_audience" {
  description = "Audience/identifier for the Team Chords API resource server"
  type        = string
}

variable "api_base_url" {
  description = "Public API base URL used by the post-login registration action"
  type        = string
}

variable "customer_app_base_url" {
  description = "Public base URL for the customer web app, for example https://teamchords.com"
  type        = string
}

variable "admin_app_base_url" {
  description = "Public base URL for the admin app, for example https://admin.teamchords.com or https://teamchords.com/admin"
  type        = string
}

variable "database_connection_name" {
  description = "Database connection name expected by the customer app and API"
  type        = string
  default     = "Username-Password-Authentication"
}

variable "google_oauth_client_id" {
  description = "Google OAuth client ID used by the Auth0 Google social connection"
  type        = string
}

variable "google_oauth_client_secret" {
  description = "Google OAuth client secret used by the Auth0 Google social connection"
  type        = string
  sensitive   = true
}

variable "friendly_name" {
  description = "Friendly tenant/app name shown in Auth0"
  type        = string
  default     = "Team Chords"
}

variable "logo_url" {
  description = "Logo URL used for Auth0 branding"
  type        = string
  default     = "https://teamchords.com/favicon.png"
}

variable "support_email" {
  description = "Support email shown in the Auth0 tenant"
  type        = string
  default     = "support@teamchords.com"
}

variable "support_url" {
  description = "Support URL shown in the Auth0 tenant"
  type        = string
  default     = "https://teamchords.com"
}

variable "customer_app_name" {
  description = "Display name for the customer SPA application"
  type        = string
  default     = "Team Chords Web"
}

variable "admin_app_name" {
  description = "Display name for the admin SPA application"
  type        = string
  default     = "Team Chords Admin"
}

variable "backend_m2m_app_name" {
  description = "Display name for the backend Auth0 Management API machine-to-machine app"
  type        = string
  default     = "Team Chords API Management"
}

variable "roles_namespace" {
  description = "URL-formatted namespace used for custom role claims"
  type        = string
  default     = "https://teamchordsapp.io"
}

variable "auth0_actions_runtime" {
  description = "Runtime to use for Auth0 Actions, for example node18 or node22 depending on tenant support"
  type        = string
  default     = "node22"
}

variable "post_login_trigger_version" {
  description = "Auth0 post-login trigger version"
  type        = string
  default     = "v3"
}

variable "management_api_scopes" {
  description = "Scopes granted to the backend machine-to-machine app for Auth0 Management API access"
  type        = list(string)
  default = [
    "create:users",
    "read:users",
    "update:users",
    "delete:users"
  ]
}

variable "customer_extra_callbacks" {
  description = "Extra callback URLs to allow for the customer SPA"
  type        = list(string)
  default     = []
}

variable "customer_extra_logout_urls" {
  description = "Extra logout URLs to allow for the customer SPA"
  type        = list(string)
  default     = []
}

variable "admin_extra_callbacks" {
  description = "Extra callback URLs to allow for the admin SPA"
  type        = list(string)
  default     = []
}

variable "admin_extra_logout_urls" {
  description = "Extra logout URLs to allow for the admin SPA"
  type        = list(string)
  default     = []
}

