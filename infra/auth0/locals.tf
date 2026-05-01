locals {
  customer_app_base_url = trimsuffix(var.customer_app_base_url, "/")
  admin_app_base_url    = trimsuffix(var.admin_app_base_url, "/")
  api_base_url          = trimsuffix(var.api_base_url, "/")

  customer_app_origin = regexall("^https?://[^/]+", local.customer_app_base_url)[0]
  admin_app_origin    = regexall("^https?://[^/]+", local.admin_app_base_url)[0]

  customer_callbacks = distinct(concat([
    "${local.customer_app_base_url}/callback",
    "${local.customer_app_base_url}/auth/callback",
  ], var.customer_extra_callbacks))

  customer_logout_urls = distinct(concat([
    local.customer_app_base_url,
  ], var.customer_extra_logout_urls))

  admin_callbacks = distinct(concat([
    "${local.admin_app_base_url}/dashboard",
  ], var.admin_extra_callbacks))

  admin_logout_urls = distinct(concat([
    local.admin_app_base_url,
    "${local.admin_app_base_url}/dashboard",
  ], var.admin_extra_logout_urls))

  tenant_allowed_logout_urls = distinct(concat(
    local.customer_logout_urls,
    local.admin_logout_urls,
  ))

  management_api_audience = "https://${var.auth0_domain}/api/v2/"
}

