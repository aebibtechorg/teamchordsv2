locals {
  api_service_name   = "tcv2-api"
  admin_service_name = "tcv2-admin"
  help_site_id       = trimspace(var.help_firebase_site) != "" ? trimspace(var.help_firebase_site) : "${var.project_id}-help"
  blog_connection_id = "teamchords-github"
  blog_repo_link_id  = "teamchordsv2-blog"
}

resource "google_project_service" "required" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "developerconnect.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "sts.googleapis.com",
    "firebase.googleapis.com",
    "firebaseapphosting.googleapis.com",
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

resource "google_firebase_hosting_site" "help" {
  provider = google-beta
  project  = var.project_id
  site_id  = local.help_site_id

  depends_on = [google_firebase_project.default]
}

resource "google_firebase_web_app" "blog" {
  provider = google-beta
  project  = var.project_id
  display_name     = "TeamChords Blog"
  deletion_policy  = "ABANDON"

  depends_on = [google_firebase_project.default]
}

resource "google_project_service_identity" "developerconnect" {
  provider = google-beta
  project  = var.project_id
  service  = "developerconnect.googleapis.com"

  depends_on = [google_project_service.required]
}

resource "google_project_iam_member" "developerconnect_secret_admin" {
  provider = google-beta
  project  = var.project_id
  role     = "roles/secretmanager.admin"
  member   = google_project_service_identity.developerconnect.member
}

resource "google_service_account" "firebase_app_hosting_compute" {
  project                     = var.project_id
  account_id                  = "firebase-app-hosting-compute"
  display_name                = "Firebase App Hosting compute service account"
  create_ignore_already_exists = true
}

resource "google_project_iam_member" "firebase_app_hosting_compute_runner" {
  project = var.project_id
  role    = "roles/firebaseapphosting.computeRunner"
  member  = google_service_account.firebase_app_hosting_compute.member
}

resource "google_project_iam_member" "firebase_app_hosting_compute_repo_reader" {
  project = var.project_id
  role    = "roles/developerconnect.readTokenAccessor"
  member  = google_service_account.firebase_app_hosting_compute.member
}

resource "google_developer_connect_connection" "blog" {
  provider      = google-beta
  project       = var.project_id
  location      = var.region
  connection_id = local.blog_connection_id

  github_config {
    github_app = "FIREBASE"
  }

  depends_on = [google_project_iam_member.developerconnect_secret_admin]
}

resource "google_developer_connect_git_repository_link" "blog" {
  provider               = google-beta
  project                = var.project_id
  location               = var.region
  git_repository_link_id = local.blog_repo_link_id
  parent_connection      = google_developer_connect_connection.blog.connection_id
  clone_uri              = "https://github.com/${var.github_owner}/${var.github_repo}.git"
}

resource "google_firebase_app_hosting_backend" "blog" {
  provider          = google-beta
  project           = var.project_id
  location          = var.region
  backend_id        = var.blog_app_hosting_backend_id
  display_name      = "TeamChords Blog"
  app_id            = google_firebase_web_app.blog.app_id
  serving_locality  = "GLOBAL_ACCESS"
  service_account   = google_service_account.firebase_app_hosting_compute.email

  codebase {
    repository     = google_developer_connect_git_repository_link.blog.name
    root_directory = var.blog_app_hosting_root_directory
  }

  depends_on = [
    google_project_iam_member.firebase_app_hosting_compute_runner,
    google_project_iam_member.firebase_app_hosting_compute_repo_reader,
    google_developer_connect_git_repository_link.blog,
  ]
}

// Stop managing one-time GitHub bootstrap resources in the routine deploy state.
removed {
  from = google_iam_workload_identity_pool.github

  lifecycle {
    destroy = false
  }
}

removed {
  from = google_iam_workload_identity_pool_provider.github

  lifecycle {
    destroy = false
  }
}

removed {
  from = google_service_account.github_deployer

  lifecycle {
    destroy = false
  }
}

removed {
  from = google_project_iam_member.github_run_admin

  lifecycle {
    destroy = false
  }
}

removed {
  from = google_project_iam_member.github_artifact_writer

  lifecycle {
    destroy = false
  }
}

removed {
  from = google_project_iam_member.github_serviceusage

  lifecycle {
    destroy = false
  }
}

removed {
  from = google_service_account_iam_member.github_wif

  lifecycle {
    destroy = false
  }
}

resource "google_service_account" "api_runtime" {
  account_id   = "tcv2-api-runtime"
  display_name = "TeamChords API runtime"
}

resource "google_service_account" "admin_runtime" {
  account_id   = "tcv2-admin-runtime"
  display_name = "TeamChords admin runtime"
}

removed {
  from = google_service_account_iam_member.api_runtime_user

  lifecycle {
    destroy = false
  }
}

removed {
  from = google_service_account_iam_member.admin_runtime_user

  lifecycle {
    destroy = false
  }
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
        name  = "ConnectionStrings__AzureSignalR"
        value = var.azure_signalr_connection_string
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
