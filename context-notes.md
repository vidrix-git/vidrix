# Notas de Contexto - Vidrix ERP

## Infraestrutura Azure (criada anteriormente)
- Grupo: vidrix-prod-rg, Região: westus2
- MySQL: vidrix-mysql-202608051030.mysql.database.azure.com / flexibleserverdb / vidrix_admin
- App Service: vidrix-erp-final.azurewebsites.net, Plano: vidrix-plan-final (F1), Runtime: NODE|22-lts
- JWT_SECRET: vidrix-secret-2026-xyz, PORT: 3000
- Problema: GitHub Actions falhando no login → usar Publish Profile como secret

## Status Backend (completo)
- Todos os routers criados: clients, products, suppliers, quotes, orders, purchaseOrders, stockMovements, dashboard, reports
- Sem erros de TypeScript
- Schema Drizzle: 11 tabelas aplicadas no banco

## Próximos passos frontend
- Customizar DashboardLayout com menu do Vidrix
- Criar todas as páginas
- Criar Dockerfile para Azure
- Configurar GitHub Actions com Publish Profile
