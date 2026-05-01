output "artifact_registry_repository" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.containers.repository_id}"
}

output "github_workload_identity_pool" {
  value = null
}

output "github_workload_identity_provider" {
  value = null
}

output "github_deployer_service_account" {
  value = null
}

output "api_url" {
  value = google_cloud_run_v2_service.api.uri
}

output "admin_url" {
  value = google_cloud_run_v2_service.admin.uri
}
