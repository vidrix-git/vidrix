# Vidrix ERP - Sistema de Gestão Comercial para Vidraçaria

## Fase 1: Schema e Banco de Dados
- [x] Criar schema completo com tabelas: users, clients, products, suppliers, supplier_prices, quotes, quote_items, orders, order_items, purchase_orders, purchase_order_items, stock_movements
- [x] Aplicar migrations ao banco de dados

## Fase 2: Autenticação e Controle de Acesso
- [x] Extender schema de users com campos de perfil (admin/vendedor)
- [x] Criar router de autenticação com controle de acesso por perfil
- [x] Criar tela de login customizada
- [x] Proteger rotas com middleware de perfil

## Fase 3: CRUD de Clientes
- [x] Procedures tRPC para clientes (list, create, update, delete)
- [x] Página de listagem de clientes com filtros
- [x] Formulário de criação/edição com validação
- [x] Excluir clientes com validação

## Fase 4: CRUD de Produtos
- [x] Procedures tRPC para produtos (list, create, update, delete)
- [x] Página de listagem de produtos com filtros
- [x] Formulário com especificações técnicas
- [x] Controle de estoque mínimo

## Fase 5: CRUD de Fornecedores
- [x] Procedures tRPC para fornecedores (list, create, update, delete)
- [x] Página de listagem de fornecedores
- [x] Tabela de preços associada por fornecedor
- [x] Formulário de criação/edição

## Fase 6: Sistema de Orçamentos
- [x] Procedures tRPC para orçamentos (list, create, update, delete, approve)
- [x] Página de listagem com filtros
- [x] Formulário com cálculo automático: largura × altura / 10000 = m²
- [x] Cálculo automático de valor total (quantidade × m² × preço unitário)
- [x] Geração de PDF para orçamentos

## Fase 7: Pedidos de Venda
- [x] Procedures tRPC para pedidos (list, create, update, delete, changeStatus)
- [x] Conversão de orçamento aprovado em pedido
- [x] Kanban com status: aprovado, produção, pronto, entregue, cancelado
- [x] Atualização automática de estoque ao entregar

## Fase 8: Pedidos de Compra
- [x] Procedures tRPC para pedidos de compra (list, create, update, delete, receive)
- [x] Página de listagem e formulário
- [x] Recebimento com atualização automática de estoque na entrada

## Fase 9: Histórico de Movimentos de Estoque
- [x] Procedures tRPC para movimentos (list)
- [x] Página de visualização com filtros por produto, tipo, período

## Fase 10: Dashboard com Indicadores
- [x] Indicadores: faturamento do período, pedidos por status, estoque crítico, comissões
- [x] Gráficos e visualizações

## Fase 11: Relatórios Exportáveis
- [x] Relatório de faturamento com exportação CSV
- [x] Relatório de comissões com exportação CSV
- [x] Relatório de análise de estoque com exportação CSV

## Fase 12: Design e Layout
- [x] Configurar tema visual do sistema
- [x] Layout com sidebar de navegação (DashboardLayout)
- [x] Estilo profissional e consistente

## Fase 13: Testes
- [x] Testes unitários para procedures tRPC (26 testes passando)
- [x] Testes para cálculos de metragem

## Fase 14: Entrega
- [x] Revisar todas as funcionalidades
- [x] Salvar checkpoint final
- [x] Entregar ao usuário
