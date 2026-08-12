# Azure Info - Vidrix ERP

## Infraestrutura
- Resource Group: vidrix-prod-rg
- Subscription: Azure subscription 1 (ecaa4647-592d-4fd9-9742-fe68a122c2ce)
- Web App: vidrix-erp-final (vidrix-erp-final.azurewebsites.net)
- Plan: vidrix-plan-final (F1, Linux)
- Region: West US 2
- Runtime: Node 22-lts
- MySQL: vidrix-mysql-202608051030.mysql.database.azure.com
- DB: flexibleserverdb
- MySQL User: vidrix_admin

## Workflow GitHub Actions (already created)
- File: .github/workflows/azure-deploy.yml
- Uses webapps-deploy with publish-profile
- Secrets needed: AZURE_PUBLISH_PROFILE, AZURE_SUBSCRIPTION_ID, AZURE_RESOURCE_GROUP, AZURE_APP_NAME, DATABASE_URL, JWT_SECRET

## GitHub Repo
- https://github.com/vidrix-git/vidrix.git
- Remote already added
