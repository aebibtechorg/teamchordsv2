output "artifact_registry_repository" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.containers.repository_id}"
}

output "github_workload_identity_pool" {
  value = var.manage_github_identity ? google_iam_workload_identity_pool.github[0].name : null
}

output "github_workload_identity_provider" {
  value = var.manage_github_identity ? google_iam_workload_identity_pool_provider.github[0].name : null
}

output "github_deployer_service_account" {
  value = var.manage_github_identity ? google_service_account.github_deployer[0].email : null
}

output "api_url" {
  value = google_cloud_run_v2_service.api.uri
}

output "admin_url" {
  value = google_cloud_run_v2_service.admin.uri
}
