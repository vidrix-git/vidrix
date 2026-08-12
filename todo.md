# Vidrix ERP - TODO Completo

## Backend
- [x] Corrigir erros de TypeScript em todos os routers
- [x] Router: clients (list, get, create, update, delete)
- [x] Router: products (list, get, create, update, delete)
- [x] Router: suppliers (list, get, create, update, delete)
- [x] Router: quotes (list, get, getItems, create, update, delete, addItem, updateItem, deleteItem, convertToOrder)
- [x] Router: quoteItems (integrado no quotes router)
- [x] Router: orders (list, get, create, update, delete, updateStatus)
- [x] Router: orderItems (integrado no orders router)
- [x] Router: purchaseOrders (list, get, create, update, delete, receive)
- [x] Router: purchaseOrderItems (integrado no purchaseOrders router)
- [x] Router: stockMovements (list, get)
- [x] Router: dashboard (stats, faturamento por período, pedidos por status, estoque crítico, comissões)
- [x] Router: reports (faturamento, comissões, análise de estoque)
- [x] Registrar todos os routers no server/routers.ts
- [x] Atualizar server/db.ts com helpers de query

## Frontend - Estrutura
- [x] index.html com Google Fonts (Inter)
- [x] index.css com tema limpo e profissional
- [x] App.tsx com DashboardLayout e roteamento completo
- [x] DashboardLayout com sidebar (Dashboard, Orçamentos, Pedidos, Compras, Estoque, Relatórios)

## Frontend - Módulos
- [x] Dashboard com recharts (faturamento, pedidos por status, estoque crítico, comissões)
- [x] Módulo Clientes (CRUD completo)
- [x] Módulo Produtos (CRUD completo)
- [x] Módulo Fornecedores (CRUD completo)
- [x] Módulo Orçamentos (CRUD + cálculo metragem L×H/10000)
- [x] Módulo Pedidos de Venda (Kanban + conversão de orçamento)
- [x] Módulo Pedidos de Compra (CRUD + recebimento com entrada automática)
- [x] Módulo Movimentos de Estoque (histórico)
- [x] Módulo Relatórios (faturamento, comissões, estoque + export CSV)

## Azure
- [x] Dockerfile para Node 22 no Azure
- [x] GitHub Actions workflow com publish profile
- [x] .dockerignore configurado
- [ ] Push para GitHub (remote github)
- [ ] Configurar Publish Profile secret no GitHub
- [x] Deploy no Azure App Service

## Qualidade
- [x] Build sem erros

## Autenticação Local (sem Manus)
- [x] Remover dependência do Manus OAuth (OAuth routes removidas, vite-plugin removido, analytics removido, JWT local testado com admin/admin123)
- [x] Implementar login local com username/senha + JWT
- [x] Criar tabela de usuários locais (admin/password no DB)
- [x] Tela de login local (sem referência Manus)
- [x] Remover debug-collector e analytics do index.html
- [x] Redeploy no Azure
- [x] Aplicar de forma segura a coluna de senha na base de dados Azure existente e validar o login publicado
- [x] Corrigir o fallback do administrador sem senha e tornar a migração da coluna password idempotente
- [x] Cobrir a autenticação local com testes de regressão e validar o login em produção
- [x] Inicializar o esquema completo do ERP na base de dados MySQL Azure e criar o administrador padrão
- [x] Confirmar e documentar a base de dados Azure de produção correta e a inexistência de dados legados a reconciliar
- [x] Validar novamente o login publicado após registar a reconciliação da base de dados Azure
- [x] Executar uma nova validação HTTP do login publicado após o registo final de reconciliação
