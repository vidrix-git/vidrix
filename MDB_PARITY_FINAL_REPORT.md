# Relatório Final de Paridade — Vidracaria2026pdv.mdb × Vidrix

## Conclusão executiva

O Vidrix já é uma **substituição operacional controlada para orçamento e pedido de vidro simples**, quando a operação utiliza centímetros, preço explícito por m² e o fluxo de conversão/cancelamento atualmente homologado. A aceitação publicada confirmou cálculo de 0,80 m² para uma peça de 100 × 80 cm, conversão idempotente, movimentos de ajuste e remoção, cancelamento auditável e recomposição integral do saldo de teste.[3]

Por outro lado, o Vidrix **ainda não substitui integralmente o MDB** nas modalidades de preço, composição de acessórios, massa, tarugo, moldura, Box, kits compostos, financeiro e emissão de documentos por modalidade. A migração preservou esses domínios de maneira segura, mas não os materializou como pedidos ou movimentos artificiais.[2]

| Decisão de uso | Situação | Condição |
|---|---|---|
| Orçamento e pedido de vidro simples | Permitido de forma controlada | Medidas em cm, preço conferido, estoque disponível e operação treinada. |
| Cancelamento e correção de pedido simples | Permitido de forma controlada | Usar alteração de status e motivo; não há exclusão de pedido operacional. |
| Consulta ao histórico legado | Permitido | Usar o arquivo migrado como fonte de consulta, sem converter automaticamente linhas incompletas em vendas. |
| Box, Kit composto, acessórios, massa, tarugo, moldura | Não liberar como substituição do MDB | Depende do motor de composição e dos módulos especializados. |
| Venda por modalidade e controle financeiro | Não liberar como substituição do MDB | Depende de preços por modalidade, pendência e documentos próprios. |

## Base de evidências e cobertura da migração

O levantamento identificou no MDB 19 tabelas de negócio, 77 formulários, 33 relatórios, 6 macros e 8 módulos VBA. O conteúdo de VBA compilado constitui limite técnico: consultas, campos e nomes de eventos podem ser inventariados, mas uma fórmula armazenada apenas em módulo VBA não deve ser presumida sem exportação via Access/ACE.[1]

| Domínio legado | Tratamento efetivamente aplicado | Resultado verificável |
|---|---|---:|
| Clientes em `Erros ao colar` | Normalização para `clients` com preservação de dados disponíveis. | 54 clientes. |
| Kits `KIt_Fontal` e `Kit_Canto` | Catálogo simples em `products`; composição não inferida. | 34 produtos. |
| `Larguras*` e `Alturas` | Regras corte→venda em `cuttingRules`. | 118.144 regras. |
| `Venda`, `TempBox`, preços, Box, acessórios e massa | Arquivo idempotente em `legacyImportRecords`. | 118.295 linhas distintas. |

Essa separação evita alterar faturamento, estoque ou indicadores com linhas que não possuem cliente, produto, quantidade e data suficientes para formar uma venda legítima.[2]

## Mapa de paridade para o Vidrix atual

| Área atual | Esquema, router e tela associados | Cobertura do legado | Limite objetivo |
|---|---|---|---|
| Clientes | `clients`; `server/routers/clients.ts`; `Clients.tsx`. | Cadastro e seleção básica. | Não há pendência, conta corrente ou política de crédito. |
| Produtos | `products`; `server/routers/products.ts`; `Products.tsx`. | Catálogo simples e estoque unitário. | Não há preço por modalidade, BOM de kit ou componentes. |
| Orçamentos | `quotes`, `quoteItems`; `quotesRouter`; `Quotes.tsx`. | Área em cm, preço por m², PDF e conversão. | Não há modo de venda, corte→venda, acessórios, desconto aplicado ou composição. |
| Pedidos | `orders`, `orderItems`; `ordersRouter`; `Orders.tsx`. | Estados, reserva, ajuste, remoção e cancelamento rastreável. | Não há pedido/produção de Box e não há referência de movimento por item. |
| Estoque | `products.stockQuantity`, `stockMovements`; `Stock.tsx`; `stockMovementsRouter`. | Saldo e movimentos de entrada/saída por produto. | Não controla chapa, corte, massa, tarugo, kit ou lotes. |
| Relatórios e documentos | `reportsRouter`; `Reports.tsx`; PDF de orçamento. | Indicadores comerciais e histórico de estoque simples. | Não substitui segunda via, relatórios por modalidade, financeiro ou produção. |
| Arquivo de migração | `legacyImportRecords`, `cuttingRules`; `legacyMigrationRouter`. | Preserva dados e regras recuperáveis do MDB. | Não converte regras arquivadas em cálculo operacional ainda. |

O mapa completo, com 24 regras de negócio e 5 grupos de eventos, está em [`MDB_RULE_EVENT_MATRIX.md`](./MDB_RULE_EVENT_MATRIX.md).[1]

## Regras críticas encerradas nesta versão

| Regra | Evidência de correção | Situação atual |
|---|---|---|
| Unidade comercial | Cálculo central `largura × altura ÷ 10.000`, campos e documentação em cm. | Homologada no cenário de 100 × 80 cm. |
| Conversão de orçamento | Transação, bloqueio de orçamento, verificação de pedido prévio e retorno `alreadyConverted`. | Homologada com dupla chamada. |
| Cancelamento | Data, utilizador e motivo persistidos; pedido preservado. | Homologado com retorno inalterado na repetição. |
| Estoque | Referências `order`, `order_adjust`, `order_item_remove` e `order_cancel`. | Homologado com saldo final igual ao inicial. |
| Histórico | Conversão para formato de relatório e consulta de movimentos persistidos. | Homologado em produção e coberto por integração. |

## Sequência de evolução recomendada

### Onda 1 — Modelo comercial básico antes de ampliar as vendas

Criar modalidades de venda e tabelas de preço com vigência. Cada item deve gravar a modalidade, a origem do preço, a unidade comercial e a memória do cálculo aplicada naquele momento. Desconto deve ser explícito, autorizado e refletido tanto no orçamento quanto no pedido.

| Entrega | Resultado de negócio | Critério de aceite |
|---|---|---|
| `sales_modes` e `product_prices` | À Vista, 15 Dias, 30 Dias, Revenda, Colocado e Cortado. | Mesmo produto retorna preço correto por modalidade e período. |
| Desconto auditável | Total líquido e justificativa. | PDF, pedido e relatório exibem o mesmo desconto. |
| Catálogo por modalidade | Produto/preço adequados na seleção. | Não é possível escolher preço incompatível com a modalidade. |

### Onda 2 — Motor parametrizado de corte e composição

Transformar as regras já preservadas em `cuttingRules` em um serviço de cálculo versionado. Depois, introduzir componentes de item (moldura, acessórios, massa e tarugo), registrando quantidade, unidade, preço e resultado por componente. Nenhuma fórmula de Access deve ser copiada sem homologação do responsável comercial.

| Entrega | Resultado de negócio | Dependência |
|---|---|---|
| Serviço corte→venda | Medida de produção separada da medida faturada. | Homologação de exemplos reais. |
| Componentes normalizados | Itens compostos e totais rastreáveis. | Catálogo de acessórios/massa/tarugo. |
| Memória de cálculo | Reprodução de qualquer total histórico. | Regras e preços com vigência. |

### Onda 3 — Módulos especializados

Implementar Box Frontal e Box Canto como tipos de pedido próprios, incluindo duas larguras no Box Canto, regras de moldura, componentes e produção. Recriar Kit Frontal e Kit Canto como BOM, para que a venda respeite componentes e estoque. A homologação deve usar uma amostra de documentos do negócio, não somente fórmulas inferidas.

### Onda 4 — Financeiro, documentos e relatórios de substituição total

Adicionar pendência de cliente, conta corrente, políticas de aprovação, segunda via de pedido, relatórios por modalidade, cancelamento, período, Box, produção e componentes. Essa onda encerra a principal diferença funcional entre o PDF de orçamento atual e os relatórios/segunda via do Access.

## Critério para retirar o MDB de operação diária

O MDB somente deve deixar de ser necessário quando as quatro ondas estiverem homologadas pela operação, quando uma amostra histórica de cada modalidade tiver totais reproduzidos no Vidrix e quando os relatórios financeiros e de produção forem reconciliados. Até lá, o arquivo legado deve permanecer preservado como fonte histórica e a operação deve limitar o Vidrix ao fluxo simples já aceito.

## Referências

[1]: ./MDB_VIDRIX_PARITY_AUDIT.md "Inventário e evidências da auditoria MDB"
[2]: ./MIGRATION_MDB_ANALYSIS.md "Resultados e reconciliação da migração"
[3]: ./OPERATIONAL_ACCEPTANCE_EVIDENCE_2026-08-13.md "Aceitação operacional publicada"
