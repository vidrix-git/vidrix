# Política de permissões operacionais do Vidrix

**Vigência técnica:** versão posterior ao commit de segregação por papel de 14/08/2026.  
**Objetivo:** separar consulta e atendimento comercial das ações que alteram catálogo, suprimentos, saldo de estoque ou situação auditável de pedidos.

| Papel | Atividades autorizadas | Restrições aplicadas no servidor |
|---|---|---|
| `user` | Consultar módulos, atender clientes, registrar e editar clientes, criar orçamentos e concluir atendimento de balcão como orçamento ou venda. | Não pode criar, editar ou excluir produtos/fornecedores; criar, alterar, excluir ou receber compras; lançar ajuste manual de estoque; nem alterar status, cancelar ou alterar itens de pedidos que movimentem estoque. |
| `admin` | Todas as atividades de `user` e a gestão de catálogo, fornecedores, compras, recebimento, ajuste manual de estoque e ciclo de pedidos. | Não pode ignorar as transações, validações e trilhas de auditoria já existentes. |
| `superadmin` | Mesmas permissões administrativas e criação de contas `superadmin`. | Continua sujeito às regras transacionais de estoque e cancelamento auditável. |

> A regra é aplicada nas procedures do servidor, não apenas na interface. Uma chamada direta autenticada por um utilizador comum recebe `FORBIDDEN` antes de qualquer leitura ou escrita operacional de alto impacto.

## Superfícies protegidas

| Domínio | Mutações exclusivas de `admin` ou `superadmin` |
|---|---|
| Catálogo | Criar, editar e excluir produtos e fornecedores. |
| Suprimentos | Criar, alterar, excluir itens/pedidos de compra e receber mercadoria. |
| Estoque | Ajuste manual de entrada ou saída. |
| Pedidos | Alteração de status, cancelamento e inclusão, edição ou remoção de itens com reflexo de estoque. |
| Administração | Criação de superadministrador. |

## Evidência automatizada

O arquivo [`server/role-segregation.test.ts`](./server/role-segregation.test.ts) comprova que um `user` recebe bloqueio para recebimento de compra, ajuste manual de estoque, cancelamento de pedido e alteração de catálogo, preservando o acesso autenticado ao fluxo de balcão. A regressão consolidada totalizou **79 testes aprovados**.
