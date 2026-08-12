# Azure Deploy Plan - Vidrix ERP

## Estado Atual (12/08/2026)
- Projeto: /home/ubuntu/vidrix-platform
- Build feito com sucesso: dist/ contém index.js + public/
- site.zip pronto: /home/ubuntu/azure-deploy/site.zip (759KB)
- URL CDN do zip: https://files.manuscdn.com/user_upload_by_module/session_file/310519663070672708/hBdqiedScslxAoQM.zip

## Infraestrutura Azure
- Resource Group: vidrix-prod-rg
- Subscription ID: ecaa4647-592d-4fd9-9742-fe68a122c2ce
- Web App: vidrix-erp-final (vidrix-erp-final.azurewebsites.net)
- App Service Plan: vidrix-plan-final (F1, Linux, Node 22-lts)
- MySQL: vidrix-mysql-202608051030.mysql.database.azure.com
- MySQL DB: flexibleserverdb
- MySQL User: vidrix_admin
- MySQL Password: vidrix-admin-2026-xyz (a confirmar)
- JWT_SECRET: vidrix-secret-2026-xyz

## Problema
- Cloud Shell modal não responde a cliques no navegador My Browser
- Modal "Bem-vindo ao Azure Cloud Shell" com botões Bash/PowerShell
- Os cliques coordenados não estão funcionando no modal

## Próximo Passo
1. Tentar clicar no botão Bash com coordenadas (647, 601) - JÁ TENTADO
2. Alternativa: usar Kudu API com deployment credentials
   - URL: https://vidrix-erp-final.scm.azurewebsites.net/api/zipdeploy
   - Precisa de: username=$vidrix-erp-final, password=deployment-creds
   - Deployment creds podem ser obtidos via: az webapp deployment list-publishing-credentials
3. Alternativa: usar Azure CLI na Cloud Shell se conseguir abrir

## Kudu Deploy Command (para executar no Cloud Shell ou via curl)
```bash
cd ~/upload && wget "https://files.manuscdn.com/user_upload_by_module/session_file/310519663070672708/hBdqiedScslxAoQM.zip" -O site.zip
az webapp deploy --resource-group vidrix-prod-rg --name vidrix-erp-final --src-path site.zip --type zip
```

## Env vars para configurar no Azure App Service
- DATABASE_URL=mysql2://vidrix_admin:vidrix-admin-2026-xyz@vidrix-mysql-202608051030.mysql.database.azure.com:3306/flexibleserverdb?ssl={"rejectUnauthorized":false}
- JWT_SECRET=vidrix-secret-2026-xyz
- PORT=8080 (ou 3000)
- NODE_ENV=production
