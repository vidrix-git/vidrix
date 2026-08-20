# Política de permissões operacionais — Vidrix ERP

**Vigência técnica:** versão white label e matriz de três perfis de 20/08/2026.  
**Objetivo:** garantir que atendimento comercial, cadastros administrativos, suprimentos, estoque e identidade institucional sejam acessados somente pelos papéis aprovados, com validação também no servidor.

| Papel | Atividades autorizadas | Restrições aplicadas no servidor |
|---|---|---|
| `seller` — **Vendedor** | Atender no **Balcão**, consultar produtos, consultar/criar/editar clientes e criar, consultar, editar ou excluir os seus próprios orçamentos. Pode consultar somente as próprias vendas e os seus itens. | Não acessa compras, estoque, relatórios, fornecedores, catálogo administrativo, tipos de produto, funcionários ou marca. Cada consulta de orçamento, pedido e venda de balcão recebe filtro obrigatório por `userId`; registros de outros vendedores retornam “não encontrado”. |
| `admin` — **Administrador** | Executar toda a operação comercial e administrativa: clientes, catálogo, fornecedores, pedidos, compras, recebimento, estoque, relatórios, funcionários e tipos de produto. | Não pode alterar a identidade white label. As regras transacionais, validações comerciais e trilha de estoque continuam obrigatórias. |
| `superadmin` — **Superadministrador** | Possui todas as permissões de Administrador e administra a configuração institucional da marca. | É o único perfil que pode modificar nome de exibição, razão social, logotipo, cor primária, contatos e endereço da marca. Continua sujeito às regras transacionais de estoque e cancelamento auditável. |

> A regra é aplicada nas procedures do servidor, não apenas na interface. Uma chamada direta autenticada por um utilizador comum recebe `FORBIDDEN` antes de qualquer leitura ou escrita operacional de alto impacto.

## Superfícies protegidas

| Domínio | Mutações exclusivas de `admin` ou `superadmin` |
|---|---|
| Catálogo | Criar, editar e excluir produtos e fornecedores. |
| Suprimentos | Criar, alterar, excluir itens/pedidos de compra e receber mercadoria. |
| Estoque | Ajuste manual de entrada ou saída. |
| Pedidos | Alteração de status, cancelamento e inclusão, edição ou remoção de itens com reflexo de estoque. |
| Administração | Cadastro de funcionários e manutenção de tipos de produto. |
| Identidade institucional | Exclusiva de `superadmin`: manutenção da configuração white label da marca. |

## Escopo comercial do Vendedor

O papel **Vendedor** substitui o perfil independente Caixa · Balcão. Ele pode usar o atendimento comercial completo, sem receber acesso às áreas administrativas. O servidor registra o `userId` de quem cria o orçamento, pedido ou resultado do Balcão e o utiliza como critério de visibilidade em consultas posteriores.

> Não basta ocultar um item do menu: uma chamada tRPC direta é recusada pelo middleware de Vendedor quando a procedure não estiver na lista permitida. Nas procedures comerciais autorizadas, a leitura individual também confere a propriedade do registro.

## Evidência automatizada

Os arquivos [`server/role-segregation.test.ts`](./server/role-segregation.test.ts), [`server/counter-sales.visibility.test.ts`](./server/counter-sales.visibility.test.ts) e [`server/brand-settings.router.test.ts`](./server/brand-settings.router.test.ts) comprovam, respectivamente, o bloqueio de ações administrativas, o filtro de propriedade da venda de Balcão e a atualização exclusiva da marca por Superadministrador. A regressão consolidada desta versão totaliza **145 testes aprovados**.
