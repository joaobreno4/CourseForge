# ─── Input variables ────────────────────────────────────────────────────────

variable "aws_region" {
  description = "AWS region where the S3 bucket will be created."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Unique slug used to name every AWS resource (e.g. courseforge-prod)."
  type        = string
  default     = "courseforge-prod"
}

variable "spa_root_object" {
  description = "Default root object served by CloudFront."
  type        = string
  default     = "index.html"
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_100 = US+EU only (cheapest)."
  type        = string
  default     = "PriceClass_100"

  validation {
    condition = contains(
      ["PriceClass_All", "PriceClass_200", "PriceClass_100"],
      var.price_class
    )
    error_message = "Must be PriceClass_All, PriceClass_200 or PriceClass_100."
  }
}

variable "tags" {
  description = "Tags applied to every resource."
  type        = map(string)
  default = {
    Project     = "CourseForge"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
