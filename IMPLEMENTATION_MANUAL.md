# Manual de Implementação, Operação e Implantação — Vidrix

## Propósito e limite de uso

O Vidrix é um ERP comercial para vidraçaria. A versão atualmente homologada atende ao fluxo de **vidro simples**: cadastro, orçamento, cálculo em centímetros, PDF, conversão em pedido, reserva de estoque, ajustes, cancelamento auditável e relatórios básicos. O sistema não deve ser usado ainda como substituição do legado para Box, composição de acessórios, massa, tarugo, moldura, modalidades de preço ou financeiro; a matriz de paridade define esses limites em [`MDB_PARITY_FINAL_REPORT.md`](./MDB_PARITY_FINAL_REPORT.md).

| Ambiente | Endereço ou comando | Finalidade |
|---|---|---|
| Produção | `https://vidrix-erp-final.azurewebsites.net` | Operação controlada do ERP. |
| Desenvolvimento | `pnpm dev` | Servidor local com recarga de código. |
| Testes | `pnpm test` | Suíte Vitest de contratos, regras e integrações. |
| Compilação | `pnpm build` | Gera a aplicação web e os pontos de entrada do servidor. |

## Arquitetura e fluxo de dados

O cliente é uma aplicação React, organizada por páginas e componentes. A comunicação interna utiliza procedimentos tRPC; o servidor Express monta esses procedimentos em `/api/trpc` e o Drizzle ORM persiste os dados no MySQL Azure. A autenticação é local, com palavra-passe derivada por PBKDF2 e sessão JWT em cookie seguro. O navegador não calcula o valor oficial de um pedido: ele envia as entradas e o servidor executa a validação e o cálculo antes de gravar.

> **Regra de ouro:** largura e altura são informadas em **centímetros**. A área em metros quadrados é `largura × altura ÷ 10.000`; a quantidade multiplica o subtotal, não a área unitária persistida.

| Camada | Arquivos principais | Responsabilidade |
|---|---|---|
| Interface | `client/src/pages/*.tsx`, `client/src/components/DashboardLayout.tsx` | Formularios, indicadores, tabelas, PDF de orçamento e navegação. |
| Contratos | `shared/schemas.ts`, `shared/product-contract.ts` | Validação e normalização do payload entre tela e router. |
| Regras comerciais | `server/commercial-rules.ts`, `server/order-lifecycle.ts`, `server/stock-history.ts` | Cálculo de área/preço, transição de estado, referências de estoque e formato do histórico. |
| Operação | `server/routers/*.ts` | Procedimentos autenticados de clientes, produtos, orçamentos, pedidos, compras, estoque e relatórios. |
| Persistência | `drizzle/schema.ts`, `server/db.ts` | Esquema, bootstrap idempotente e acesso MySQL. |
| Autenticação | `server/local-auth.ts`, `server/_core/context.ts` | Login local, hash PBKDF2, JWT, papéis `user`, `admin` e `superadmin`. |
| Produção | `server/azure-startup.ts` | Express, assets estáticos, tRPC e inicialização do banco no App Service. |

## Mapa comentado dos módulos centrais

### 1. Cálculo comercial e validação

O arquivo `server/commercial-rules.ts` concentra os cálculos que não podem depender de formatação visual. A função de normalização aceita vírgula decimal brasileira; as funções de validação rejeitam valores vazios, não finitos, zero e negativos; e `calculateCommercialItem` retorna as dimensões normalizadas, a área unitária, o preço e o subtotal arredondado. Esse resultado é reutilizado por orçamento e pedido.

```ts
// Entradas em cm e preço por m².
const item = calculateCommercialItem({
  width: "100", height: "80", quantity: "2", unitPrice: "100",
});

// item.squareMeters = 0.8; item.subtotal = 160
```

A justificativa de manter esse código no servidor é evitar divergência entre tela, PDF, API e estoque. Os testes `server/commercial-rules.test.ts` e `server/commercial-input.test.ts` são a referência de regressão para esta regra.

### 2. Orçamentos

`server/routers/quotes.ts` cria o cabeçalho, adiciona/edita/remove itens e recalcula `quotes.totalAmount` a partir dos subtotais persistidos. Na conversão, o router abre uma transação, bloqueia o orçamento, procura pedido já associado e devolve o mesmo identificador quando ele existir. Somente um orçamento aprovado, com item e estoque suficiente, pode gerar um pedido.

| Etapa | Procedimento | Efeito persistido |
|---|---|---|
| Criar | `quotes.create` | Cabeçalho em `quotes`. |
| Adicionar item | `quotes.addItem` | Item em `quoteItems` e total recalculado. |
| Alterar/remover | `quotes.updateItem` / `deleteItem` | Item e total recalculados. |
| Converter | `quotes.convertToOrder` | Pedido, itens, saída de estoque e mudança para `convertido`. |

O PDF de orçamento é gerado no cliente, usando os mesmos itens retornados pelo contrato. Antes de enviar um orçamento ao cliente, a operação deve conferir dimensões em cm, quantidade, preço e validade.

### 3. Pedidos e estoque auditável

`server/routers/orders.ts` trata o pedido como registro operacional permanente. A exclusão física é recusada; o cancelamento ocorre somente por `orders.updateStatus`, registra data, utilizador e motivo, e cria estorno uma única vez. As funções abaixo se complementam:

| Elemento | Comentário de implementação |
|---|---|
| `changeStock(...)` | Bloqueia o produto, atualiza saldo de modo atômico e cria o movimento no mesmo contexto transacional. |
| `orderStockReference(...)` | Distingue `order`, `order_adjust`, `order_item_remove` e `order_cancel`. |
| `resolveOrderStatusTransition(...)` | Impede dupla execução da mesma transição e decide se há estorno. |
| `toStockMovementReportRow(...)` | Padroniza a resposta que aparece no histórico e no relatório. |

O saldo reduz na conversão de orçamento e quando se adiciona item a pedido. Ao aumentar quantidade, há saída de ajuste; ao reduzir/remover, há entrada; ao cancelar, somente os itens ainda reservados são estornados. A evidência executada em produção está registrada em [`OPERATIONAL_ACCEPTANCE_EVIDENCE_2026-08-13.md`](./OPERATIONAL_ACCEPTANCE_EVIDENCE_2026-08-13.md).

### 4. Produtos e o contrato de catálogo

A ficha de produto é um catálogo. Por isso, a tela `Products.tsx` mostra nome, tipo, espessura, cor, preço e estoque, e `shared/product-contract.ts` completa `width` e `height` com `"0"` ao serializar o formulário. Essas dimensões base não representam a peça vendida: dimensão e área são informadas no item do orçamento ou pedido.

```ts
// A tela omite dimensões de catálogo; o contrato preserva a exigência do schema.
return {
  name: form.name.trim(),
  width: "0",
  height: "0",
  unitPrice: form.unitPrice,
  stockQuantity: String(form.stockQuantity),
};
```

O produto deve ser editado pela tela, e não diretamente pelo banco. O contrato é coberto em `server/product-contract.test.ts` e `server/product-router.contract.test.ts`.

### 5. Autenticação e perfis

O endpoint de login utiliza `server/local-auth.ts`. A palavra-passe não é armazenada em texto claro; o servidor deriva um hash PBKDF2 e assina uma sessão JWT. Os papéis são:

| Papel | Uso previsto |
|---|---|
| `user` | Operador com acesso às funcionalidades permitidas pelos routers protegidos. |
| `admin` | Administração comercial, cadastros, migração e operação comum. |
| `superadmin` | Administração reforçada; a credencial temporária deve permanecer fora do repositório. |

Não envie palavras-passe por mensagem, não as insira em documentação e não as mantenha em arquivos versionados. A troca de credencial de administrador deve ocorrer pelo procedimento seguro de administração antes de ampliar o número de utilizadores.

### 6. Migração e paridade MDB

`server/routers/legacyMigration.ts` processa lotes autenticados e idempotentes. Clientes, kits simples e regras de corte são materializados nos destinos adequados; os demais dados são guardados como arquivo histórico em `legacyImportRecords`. O mapa regra a regra, as limitações do VBA e a sequência de evolução estão em:

| Documento | Quando consultar |
|---|---|
| `MIGRATION_MDB_ANALYSIS.md` | Volume, reconciliação e decisões de importação. |
| `MDB_RULE_EVENT_MATRIX.md` | Origem, classificação e destino de cada regra/evento identificado. |
| `MDB_PARITY_FINAL_REPORT.md` | Decisão de uso, limites de paridade e ondas de evolução. |

## Implantação no Azure App Service

O App Service em produção é `vidrix-erp-final`, no grupo de recursos `vidrix-prod-rg`, conectado ao MySQL Flexible Server `vidrix-mysql-server`. A publicação é acionada pela ramificação `release/azure-auth-fix` no repositório GitHub configurado. O pipeline usa autenticação OIDC, sem gravar perfil de publicação no código.

| Passo | Ação | Conferência |
|---|---|---|
| 1 | Execute `pnpm test` e `pnpm build`. | Todos os testes passam e a compilação termina sem erro. |
| 2 | Salve um checkpoint do projeto. | A versão pode ser restaurada pela interface de gestão. |
| 3 | Envie a mudança revisada para `release/azure-auth-fix`. | GitHub Actions inicia a publicação. |
| 4 | Aguarde a execução concluir com sucesso. | O workflow informa `success`. |
| 5 | Acesse o endereço publicado e faça login. | Confirme tela, contrato e fluxo afetado. |

O ponto de entrada de produção é `server/azure-startup.ts`. Ele recebe a porta da variável `PORT`, inicializa esquema e administrador de forma idempotente, monta `/api/trpc` e serve os arquivos construídos. A base MySQL exige TLS; segredos e conexão devem continuar configurados no ambiente Azure, nunca em `.env` ou no repositório.

## Rotina de manutenção segura

Antes de alterar regra comercial, primeiro escreva ou atualize o teste em `server/*.test.ts`. Após qualquer mudança de schema, atualize `drizzle/schema.ts`, gere a migração, revise o SQL e aplique em ambiente controlado. Para mudanças que mexem em estoque, execute o roteiro de aceitação usando registros prefixados `TESTE`, registre saldo antes/depois e cancele — nunca apague — o pedido de teste.

| Situação | Ação segura |
|---|---|
| Erro de cálculo | Suspenda o lançamento afetado, registre entrada/resultado esperado e acrescente regressão antes de publicar. |
| Falha em estoque | Preserve o pedido, não execute correção manual sem movimento e verifique o histórico. |
| Necessidade de nova modalidade | Siga a Onda 1 da paridade; não reutilize `unitPrice` manualmente como substituto definitivo. |
| Box ou componente | Não lançar em produção até a homologação do motor de composição. |
| Falha de publicação | Use o último checkpoint aprovado e o histórico do pipeline; não apague banco para recuperar a aplicação. |

## Evidência de qualidade desta versão

Na validação final, a suíte Vitest executou **31 testes em 14 arquivos**, todos aprovados, e a compilação de produção foi concluída. A aceitação publicada confirmou visualmente criação e edição de produto e, pelo contrato autenticado, os cenários de orçamento, conversão idempotente, ajustes, remoção, cancelamento e histórico de estoque.[1]

## Referências

[1]: ./OPERATIONAL_ACCEPTANCE_EVIDENCE_2026-08-13.md "Evidências de aceitação operacional"
[2]: ./MDB_PARITY_FINAL_REPORT.md "Relatório final de paridade MDB × Vidrix"
