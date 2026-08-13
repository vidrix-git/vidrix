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
- [x] Push para GitHub (remote github)
- [x] Substituir a necessidade de Publish Profile secret pela autenticação OIDC Azure
- [x] Usar a autenticação OIDC Azure já configurada no GitHub para publicação sem perfil de publicação
- [x] Criar uma identidade Azure de publicação limitada ao Vidrix e confiada apenas ao repositório GitHub autorizado
- [x] Atualizar os segredos OIDC do repositório e validar uma execução automatizada bem-sucedida
- [x] Atualizar o fluxo GitHub Actions para publicar o pacote CommonJS autocontido validado no Azure
- [x] Confirmar a sintaxe e o conteúdo final do fluxo GitHub Actions de empacotamento Azure

## Administração de acessos
- [x] Criar uma conta local de superadmin no Vidrix com credenciais temporárias seguras
- [x] Validar o login e as permissões administrativas da conta de superadmin em produção
- [x] Rever e documentar a implementação final do papel superadmin nos componentes de autenticação e autorização
- [x] Executar testes de regressão que cubram criação, login e autorização do superadmin
- [x] Registar evidência reproduzível de login e acesso administrativo do superadmin em produção
- [x] Documentar formalmente o esquema, JWT, autorização e criação restrita do superadmin
- [x] Adicionar teste de regressão específico para o login local de um superadmin
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

## Migração de dados legados
- [x] Inventariar tabelas, campos, relações e contagens do ficheiro Vidracaria2026pdv.mdb
- [x] Comparar o modelo MDB com o esquema de dados atual do Vidrix e documentar o mapeamento
- [x] Preparar e validar uma migração idempotente dos dados compatíveis para o MySQL Azure
- [x] Carregar dados legados aprovados na base Azure e validar totais no ERP
- [x] Acrescentar estruturas históricas para preservar regras de corte, pendências, rascunhos e totais sem fabricar pedidos
- [x] Criar e testar um importador MDB com modo de simulação, lotes e proteção contra duplicação
- [x] Confirmar a necessidade de cópia lógica pré-migração: não aplicável porque a base Azure inicial não tinha dados comerciais; fonte MDB, auditoria e recuperação nativa Azure foram preservadas
- [x] Adicionar uma rota administrativa autenticada para importar lotes MDB diretamente no MySQL Azure
- [x] Corrigir o empacotamento Azure para incluir um servidor autocontido sem dependências ausentes
- [x] Confirmar que não existiam dados comerciais Azure anteriores e preservar o MDB e todos os registos importados como fonte de recuperação
- [x] Validar no Azure, por consulta administrativa reproduzível, os totais finais de clientes, produtos, regras de corte e registos históricos
- [x] Registar uma verificação administrativa final que distinga a base Azure inicial dos dados introduzidos pela migração
- [x] Executar e guardar uma auditoria reproduzível de IDs e datas de criação que evidencie a inexistência de cadastros comerciais Azure anteriores
