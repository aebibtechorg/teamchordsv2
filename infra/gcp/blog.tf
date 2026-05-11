resource "google_service_account" "blog_runtime" {
  account_id   = "tcv2-blog-runtime"
  display_name = "TeamChords blog runtime"
}

resource "google_cloud_run_v2_service" "blog" {
  name     = local.blog_service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.blog_runtime.email

    containers {
      image = var.blog_image

      ports {
        container_port = 8080
      }

      env {
        name  = "APP_SITE_URL"
        value = var.app_site_url
      }

      env {
        name  = "PUBLIC_SITE_URL"
        value = var.public_site_url
      }

      env {
        name  = "SANITY_PROJECT_ID"
        value = var.sanity_project_id
      }

      env {
        name  = "SANITY_DATASET"
        value = var.sanity_dataset
      }

      env {
        name  = "SANITY_API_TOKEN"
        value = var.sanity_api_token
      }

      env {
        name  = "SANITY_API_VERSION"
        value = var.sanity_api_version
      }
    }
  }

  depends_on = [
    google_project_service.required,
    google_artifact_registry_repository.containers,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "blog_public" {
  project  = var.project_id
  location = google_cloud_run_v2_service.blog.location
  name     = google_cloud_run_v2_service.blog.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
