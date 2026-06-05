# CourseForge

Plataforma de gerenciamento de cursos construída com **Angular 18** (Standalone Components + Reactive Forms avançados) e infraestrutura AWS provisionada via **Terraform**.

---

## Desenvolvimento local

```bash
# Instale as dependências
npm install

# Inicia a API mock (json-server :3000) + Angular dev server (:4200) em paralelo
npm run dev

# Ou separadamente:
npm run api   # → http://localhost:3000
npm start     # → http://localhost:4200
```

---

## Build de produção

```bash
npm run build
# Artefatos gerados em: dist/course-forge/browser/
```

---

## Infraestrutura AWS (Terraform)

O diretório `infra/` provisiona:
- **S3 bucket** privado (versionamento + SSE-AES256 + bloqueio total de acesso público)
- **CloudFront OAC** (Origin Access Control com SigV4 — substituto seguro do OAI)
- **Distribuição CloudFront** com roteamento SPA (403/404 → index.html)
- **Bucket Policy** que permite `s3:GetObject` exclusivamente ao CloudFront desta distribuição

```bash
cd infra
terraform init
terraform plan -var="project_name=courseforge-prod"
terraform apply
```

Após o `apply`, capture as saídas:

```bash
terraform output -json
# s3_bucket_name, cloudfront_distribution_id, cloudfront_domain_name
```

---

## CI/CD — GitHub Actions

O pipeline em `.github/workflows/ci-cd.yml` executa automaticamente a cada push na `main`:

```
push → main
  └─ Job: ci  (lint + test + build → upload artifact)
       └─ Job: deploy  (download artifact → S3 sync → CloudFront invalidation)
```

PRs contra a `main` executam apenas o job `ci` (sem deploy).

### Configuração dos GitHub Secrets

Acesse: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Onde encontrar | Exemplo |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | IAM → Users → Security credentials | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Gerado junto com a Access Key | `wJalr...` |
| `AWS_REGION` | Região onde provisionou o Terraform | `us-east-1` |
| `S3_BUCKET_NAME` | `terraform output s3_bucket_name` | `courseforge-prod` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `terraform output cloudfront_distribution_id` | `E1A2B3C4D5E6F7` |
| `CLOUDFRONT_DOMAIN` | `terraform output cloudfront_domain_name` (sem `https://`) | `d1abc.cloudfront.net` |

> **Segurança:** Crie um usuário IAM dedicado ao CI com a política mínima abaixo — nunca use credenciais de root ou de admin pessoal.

#### Política IAM mínima para o usuário de deploy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3SyncPermissions",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::courseforge-prod",
        "arn:aws:s3:::courseforge-prod/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
    }
  ]
}
```

Substitua `ACCOUNT_ID` e `DISTRIBUTION_ID` pelos valores reais após o `terraform apply`.

### Configuração do Environment de produção (recomendado)

Em **Settings → Environments → New environment → `production`**:
- Adicione **Required reviewers** para exigir aprovação humana antes de cada deploy
- Configure **Wait timer** (ex: 5 min) como janela de cancelamento

---

## Estrutura do projeto

```
CourseForge/
├── .github/workflows/ci-cd.yml   ← Pipeline CI/CD
├── infra/
│   ├── main.tf                   ← S3 + CloudFront OAC + Bucket Policy
│   ├── variables.tf
│   └── outputs.tf
├── src/app/
│   ├── core/
│   │   ├── models/course.model.ts
│   │   └── services/course.service.ts
│   ├── features/courses/
│   │   ├── components/
│   │   │   ├── course-list/
│   │   │   ├── course-form/
│   │   │   ├── course-detail/
│   │   │   └── module-form/      ← Sub-componente do FormArray
│   │   └── courses.routes.ts
│   └── shared/
│       ├── components/validation-message/
│       └── pipes/duration.pipe.ts
├── db.json                        ← Mock data para json-server
└── server.js                      ← json-server com rota /courses/search
```
