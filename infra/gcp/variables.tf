variable "project_id" {
  description = "Google Cloud project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud region"
  type        = string
  default     = "us-central1"
}

variable "github_owner" {
  description = "GitHub organization or user that owns the repository"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "artifact_registry_repository_id" {
  description = "Artifact Registry repository ID for container images"
  type        = string
  default     = "tcv2-containers"
}

variable "api_image" {
  description = "Container image URI for the API service"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "web_image" {
  description = "Container image URI for the public web app"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "admin_image" {
  description = "Container image URI for the admin app"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "teamchords_connection_string" {
  description = "PostgreSQL connection string for the API"
  type        = string
  sensitive   = true
}

variable "redis_connection_string" {
  description = "Redis connection string for SignalR backplane"
  type        = string
  sensitive   = true
}

variable "auth0_domain" {
  description = "Auth0 tenant domain for API validation"
  type        = string
}

variable "auth0_audience" {
  description = "Auth0 audience for API validation"
  type        = string
}

variable "auth0_client_id" {
  description = "Auth0 client ID used by the API"
  type        = string
}

variable "auth0_client_secret" {
  description = "Auth0 client secret used by the API"
  type        = string
  sensitive   = true
}

variable "web_auth0_domain" {
  description = "Auth0 domain exposed to the SPA"
  type        = string
}

variable "web_auth0_client_id" {
  description = "Auth0 client ID exposed to the SPA"
  type        = string
}

variable "web_auth0_audience" {
  description = "Auth0 audience exposed to the SPA"
  type        = string
}

variable "admin_auth0_domain" {
  description = "Auth0 domain exposed to the admin app"
  type        = string
}

variable "admin_auth0_client_id" {
  description = "Auth0 client ID exposed to the admin app"
  type        = string
}

variable "admin_auth0_audience" {
  description = "Auth0 audience exposed to the admin app"
  type        = string
}

variable "customer_app_base_url" {
  description = "Public customer app base URL used by the API and admin UI"
  type        = string
  default     = ""
}

variable "web_app_base_url" {
  description = "Fallback public web app base URL used by the API and admin UI"
  type        = string
  default     = ""
}

variable "dodo_secret_key" {
  description = "Dodo Payments secret key"
  type        = string
  sensitive   = true
}

variable "dodo_base_url" {
  description = "Dodo Payments API base URL"
  type        = string
  default     = "https://test.dodopayments.com"
}

variable "dodo_webhook_secret" {
  description = "Dodo Payments webhook secret"
  type        = string
  sensitive   = true
}

variable "dodo_launch_discount_code" {
  description = "Discount code to apply during launch"
  type        = string
  default     = "LAUNCH20"
}

variable "chatwoot_base_url" {
  description = "Chatwoot base URL"
  type        = string
  default     = ""
}

variable "chatwoot_website_token" {
  description = "Chatwoot website token"
  type        = string
  default     = ""
  sensitive   = true
}

variable "chatwoot_position" {
  description = "Chatwoot widget position"
  type        = string
  default     = "right"
}

variable "chatwoot_hide_message_bubble" {
  description = "Hide the Chatwoot message bubble"
  type        = bool
  default     = false
}

variable "chatwoot_locale" {
  description = "Chatwoot widget locale"
  type        = string
  default     = "en"
}

variable "zeptomail_api_key" {
  description = "ZeptoMail API key"
  type        = string
  sensitive   = true
}

variable "zeptomail_template_key" {
  description = "ZeptoMail template key"
  type        = string
  sensitive   = true
}

variable "zeptomail_from_email_address" {
  description = "From address used for ZeptoMail"
  type        = string
}

variable "zeptomail_from_name" {
  description = "From display name used for ZeptoMail"
  type        = string
  default     = "noreply"
}

variable "zeptomail_base_url" {
  description = "Base URL or path used in ZeptoMail invite links"
  type        = string
  default     = ""
}

