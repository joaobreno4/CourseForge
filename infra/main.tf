terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # ── Remote state (substitua pelo seu bucket de estado) ────────────────────
  # backend "s3" {
  #   bucket         = "my-terraform-state-bucket"
  #   key            = "courseforge/production/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# ─── S3 Bucket ──────────────────────────────────────────────────────────────

resource "aws_s3_bucket" "spa" {
  bucket = var.project_name

  # Impede destruição acidental em produção.
  # Remova temporariamente só se precisar destruir o bucket.
  lifecycle {
    prevent_destroy = true
  }
}

# Versioning — permite rollback de qualquer deploy anterior via S3
resource "aws_s3_bucket_versioning" "spa" {
  bucket = aws_s3_bucket.spa.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Criptografia em repouso com chave gerenciada pela AWS (SSE-S3)
resource "aws_s3_bucket_server_side_encryption_configuration" "spa" {
  bucket = aws_s3_bucket.spa.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    # Garante que objetos carregados sem header de criptografia também sejam cifrados
    bucket_key_enabled = true
  }
}

# Bloqueia TODO acesso público direto ao bucket.
# O único caminho para os arquivos é via CloudFront + OAC.
resource "aws_s3_bucket_public_access_block" "spa" {
  bucket = aws_s3_bucket.spa.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ─── Bucket Policy — permite somente o CloudFront via OAC ───────────────────
# O Principal é o service principal do CloudFront (cloudfront.amazonaws.com).
# A condição aws:SourceArn amarra a permissão EXATAMENTE à nossa distribuição,
# impedindo que qualquer outra distribuição CloudFront acesse o bucket.
resource "aws_s3_bucket_policy" "spa" {
  bucket = aws_s3_bucket.spa.id

  # Garante que o block_public_access seja aplicado antes da policy
  depends_on = [aws_s3_bucket_public_access_block.spa]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOACReadOnly"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.spa.arn}/*"
        Condition = {
          StringEquals = {
            # Restringe ao ARN específico desta distribuição CloudFront
            "AWS:SourceArn" = aws_cloudfront_distribution.spa.arn
          }
        }
      }
    ]
  })
}

# ─── CloudFront Origin Access Control (OAC) ─────────────────────────────────
# OAC é o sucessor do OAI (Origin Access Identity) — mais seguro porque
# usa SigV4 para assinar as requisições ao S3, sem credenciais de longa duração.
resource "aws_cloudfront_origin_access_control" "spa" {
  name                              = "${var.project_name}-oac"
  description                       = "OAC for ${var.project_name} SPA"
  origin_access_control_origin_type = "s3"

  # ALWAYS = todas as requisições ao S3 são assinadas com SigV4
  signing_behavior = "always"
  signing_protocol = "sigv4"
}

# ─── CloudFront Distribution ─────────────────────────────────────────────────
resource "aws_cloudfront_distribution" "spa" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = var.spa_root_object
  price_class         = var.price_class
  comment             = "${var.project_name} SPA distribution"

  # Origem: o bucket S3 privado. Usamos o endpoint regional (não o website endpoint)
  # para que o OAC funcione corretamente com SigV4.
  origin {
    domain_name              = aws_s3_bucket.spa.bucket_regional_domain_name
    origin_id                = "S3-${var.project_name}"
    origin_access_control_id = aws_cloudfront_origin_access_control.spa.id
  }

  # Comportamento padrão: cache agressivo para assets estáticos
  default_cache_behavior {
    target_origin_id       = "S3-${var.project_name}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    # Cache Policy gerenciada "CachingOptimized" (ID fixo da AWS)
    # TTL padrão: 86400s (1 dia). O CI/CD invalida o cache em cada deploy.
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  # ── Roteamento SPA ─────────────────────────────────────────────────────────
  # Quando o usuário acessa uma rota direta (ex: /courses/1) o S3 retorna 403
  # porque o objeto não existe. O CloudFront intercepta e serve o index.html,
  # deixando o Angular Router fazer o trabalho correto no cliente.
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Certificado padrão do CloudFront (*.cloudfront.net).
  # Para domínio customizado, substitua por viewer_certificate com acm_certificate_arn.
  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }
}
