# ─── Outputs usados pelo pipeline de CI/CD ──────────────────────────────────
# Rode `terraform output -json` após o apply para capturar esses valores
# e configurar os GitHub Secrets do repositório.

output "s3_bucket_name" {
  description = "Nome do bucket S3 onde o build é sincronizado."
  value       = aws_s3_bucket.spa.id
}

output "s3_bucket_arn" {
  description = "ARN do bucket S3."
  value       = aws_s3_bucket.spa.arn
  sensitive   = false
}

output "cloudfront_distribution_id" {
  description = "ID da distribuição CloudFront (usado para criar a invalidação de cache)."
  value       = aws_cloudfront_distribution.spa.id
}

output "cloudfront_domain_name" {
  description = "URL pública do frontend (ex: d1abc123.cloudfront.net)."
  value       = "https://${aws_cloudfront_distribution.spa.domain_name}"
}

output "oac_id" {
  description = "ID do Origin Access Control criado."
  value       = aws_cloudfront_origin_access_control.spa.id
}
