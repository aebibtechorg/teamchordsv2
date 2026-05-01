locals {
  github_repository  = "${var.github_owner}/${var.github_repo}"
  api_service_name   = "tcv2-api"
  admin_service_name = "tcv2-admin"
}

resource "google_project_service" "required" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "run.googleapis.com",
    "sts.googleapis.com",
    "firebase.googleapis.com",
    "firebasehosting.googleapis.com"
  ])

  project = var.project_id
  service = each.key
}

resource "google_artifact_registry_repository" "containers" {
  location      = var.region
  repository_id = var.artifact_registry_repository_id
  format        = "DOCKER"
  description   = "TeamChords container images"

  depends_on = [google_project_service.required]
}

resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id

  depends_on = [google_project_service.required]
}

resource "google_iam_workload_identity_pool" "github" {
  count = var.manage_github_identity ? 1 : 0

  workload_identity_pool_id = "github-actions"
  display_name              = "GitHub Actions"
  description               = "OIDC federation for TeamChords GitHub Actions"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  count = var.manage_github_identity ? 1 : 0

  workload_identity_pool_id          = google_iam_workload_identity_pool.github[0].workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub repository provider"
  description                        = "Allow TeamChords GitHub Actions to impersonate the deployer service account"
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.owner"      = "assertion.repository_owner"
    "attribute.ref"        = "assertion.ref"
  }
  attribute_condition = "assertion.repository_owner == '${var.github_owner}' && assertion.repository == '${local.github_repository}'"
  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account" "github_deployer" {
  count = var.manage_github_identity ? 1 : 0

  account_id   = "tcv2-github-deployer"
  display_name = "TeamChords GitHub deployer"
}

resource "google_project_iam_member" "github_run_admin" {
  count = var.manage_github_identity ? 1 : 0

  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.github_deployer[0].email}"
}

resource "google_project_iam_member" "github_artifact_writer" {
  count = var.manage_github_identity ? 1 : 0

  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_deployer[0].email}"
}

resource "google_project_iam_member" "github_serviceusage" {
  count = var.manage_github_identity ? 1 : 0

  project = var.project_id
  role    = "roles/serviceusage.serviceUsageConsumer"
  member  = "serviceAccount:${google_service_account.github_deployer[0].email}"
}

resource "google_service_account_iam_member" "github_wif" {
  count = var.manage_github_identity ? 1 : 0

  service_account_id = google_service_account.github_deployer[0].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github[0].name}/attribute.repository/${local.github_repository}"
}

resource "google_service_account" "api_runtime" {
  account_id   = "tcv2-api-runtime"
  display_name = "TeamChords API runtime"
}

resource "google_service_account" "admin_runtime" {
  account_id   = "tcv2-admin-runtime"
  display_name = "TeamChords admin runtime"
}

resource "google_service_account_iam_member" "api_runtime_user" {
  count = var.manage_github_identity ? 1 : 0

  service_account_id = google_service_account.api_runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_deployer[0].email}"
}

resource "google_service_account_iam_member" "admin_runtime_user" {
  count = var.manage_github_identity ? 1 : 0

  service_account_id = google_service_account.admin_runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_deployer[0].email}"
}

resource "google_cloud_run_v2_service" "api" {
  name     = local.api_service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.api_runtime.email

    containers {
      image = var.api_image

      ports {
        container_port = 8080
      }

      env {
        name  = "ASPNETCORE_URLS"
        value = "http://0.0.0.0:8080"
      }

      env {
        name  = "ConnectionStrings__TeamChords"
        value = var.teamchords_connection_string
      }

      env {
        name  = "ConnectionStrings__Redis"
        value = var.redis_connection_string
      }

      env {
        name  = "Auth0__Domain"
        value = var.auth0_domain
      }

      env {
        name  = "Auth0__Audience"
        value = var.auth0_audience
      }

      env {
        name  = "Auth0__ClientId"
        value = var.auth0_client_id
      }

      env {
        name  = "Auth0__ClientSecret"
        value = var.auth0_client_secret
      }

      env {
        name  = "WebAuth0__Domain"
        value = var.web_auth0_domain
      }

      env {
        name  = "WebAuth0__ClientId"
        value = var.web_auth0_client_id
      }

      env {
        name  = "WebAuth0__Audience"
        value = var.web_auth0_audience
      }

      env {
        name  = "AdminAuth0__Domain"
        value = var.admin_auth0_domain
      }

      env {
        name  = "AdminAuth0__ClientId"
        value = var.admin_auth0_client_id
      }

      env {
        name  = "AdminAuth0__Audience"
        value = var.admin_auth0_audience
      }

      env {
        name  = "CustomerApp__BaseUrl"
        value = var.customer_app_base_url
      }

      env {
        name  = "WebApp__BaseUrl"
        value = var.web_app_base_url
      }

      env {
        name  = "Dodo__SecretKey"
        value = var.dodo_secret_key
      }

      env {
        name  = "Dodo__BaseUrl"
        value = var.dodo_base_url
      }

      env {
        name  = "Dodo__WebhookSecret"
        value = var.dodo_webhook_secret
      }

      env {
        name  = "Dodo__LaunchDiscountCode"
        value = var.dodo_launch_discount_code
      }

      dynamic "env" {
        for_each = trimspace(var.chatwoot_base_url) == "" ? [] : [1]
        content {
          name  = "Chatwoot__BaseUrl"
          value = var.chatwoot_base_url
        }
      }

      dynamic "env" {
        for_each = trimspace(var.chatwoot_website_token) == "" ? [] : [1]
        content {
          name  = "Chatwoot__WebsiteToken"
          value = var.chatwoot_website_token
        }
      }

      env {
        name  = "Chatwoot__Position"
        value = var.chatwoot_position
      }

      env {
        name  = "Chatwoot__HideMessageBubble"
        value = tostring(var.chatwoot_hide_message_bubble)
      }

      env {
        name  = "Chatwoot__Locale"
        value = var.chatwoot_locale
      }

      env {
        name  = "ZeptoMail__ApiKey"
        value = var.zeptomail_api_key
      }

      env {
        name  = "ZeptoMail__TemplateKey"
        value = var.zeptomail_template_key
      }

      env {
        name  = "ZeptoMail__FromEmailAddress"
        value = var.zeptomail_from_email_address
      }

      env {
        name  = "ZeptoMail__FromName"
        value = var.zeptomail_from_name
      }

      env {
        name  = "ZeptoMail__BaseUrl"
        value = var.zeptomail_base_url
      }
    }
  }

  depends_on = [
    google_project_service.required,
    google_artifact_registry_repository.containers,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "api_public" {
  project  = var.project_id
  location = google_cloud_run_v2_service.api.location
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service" "admin" {
  name     = local.admin_service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.admin_runtime.email

    containers {
      image = var.admin_image

      ports {
        container_port = 3000
      }

      env {
        name  = "API_TARGET"
        value = google_cloud_run_v2_service.api.uri
      }
    }
  }

  depends_on = [
    google_project_service.required,
    google_artifact_registry_repository.containers,
    google_cloud_run_v2_service.api,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "admin_public" {
  project  = var.project_id
  location = google_cloud_run_v2_service.admin.location
  name     = google_cloud_run_v2_service.admin.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
