# Evidências de validação visual — Azure

**Ambiente:** `https://vidrix-erp-final.azurewebsites.net`  
**Data da validação:** 14/08/2026  
**Sessão:** autenticada como utilizador administrativo no navegador do responsável.

## Resultados observados

| Área | Evidência observada | Resultado |
|---|---|---|
| Disponibilidade | A raiz pública respondeu `HTTP 200` e o painel autenticado carregou indicadores, pedidos, alertas e a navegação lateral. | Aprovado |
| Navegação lateral | Os grupos **Visão Geral**, **Atendimento Comercial**, **Cadastros**, **Suprimentos e Estoque** e **Gestão** estavam visíveis. O grupo Atendimento Comercial foi preservado. | Aprovado |
| Balcão | A tela apresentou apenas o fluxo unificado de itens, complementos e decisão final por orçamento ou venda. Não havia bloco inicial separado de atendimento. | Aprovado |
| Navegação por teclado | No Balcão, `Enter` transferiu o foco de Largura para Altura. No modal de Clientes, `Enter` transferiu o foco de Nome para Tipo; `Escape` fechou o diálogo sem alterar dados. | Aprovado |
| Orçamentos | Lista exibiu orçamentos convertidos e em rascunho, com comando de novo orçamento. | Aprovado |
| Pedidos | As visões Lista e Kanban carregaram status, cliente, totais e colunas do fluxo comercial. | Aprovado |
| Estoque | O histórico mostrou rótulos legíveis para Pedido de Venda, Ajuste de Pedido, Remoção de Item, Cancelamento de Pedido e Venda de Balcão. | Aprovado |
| Relatórios | A aba Faturamento exibiu seletor de período e exportação CSV. | Aprovado |
| Clientes | A listagem exibiu a coluna WhatsApp. O formulário apresentou CPF/CNPJ, telefone, WhatsApp, CEP, busca de CEP, UF, endereço, bairro e cidade. | Aprovado |

## Cenário operacional em andamento

Foi preparado o produto de teste **TESTE UI - Cadastro de Produto - 2026-08-13**, com saldo inicial de uma unidade e preço de R$ 101,00 por m². O orçamento controlado foi criado como **Orçamento #4**, vinculado ao cliente de aceite. A venda controlada foi preparada com o mesmo produto e cliente para demonstrar, em sequência, a baixa de estoque, a criação do pedido entregue e o estorno por cancelamento.

## Conclusão do cenário controlado

| Ordem | Ação realizada no Azure | Evidência observada | Resultado |
|---:|---|---|---|
| 1 | Salvar o atendimento como orçamento | Mensagem de confirmação: **Orçamento #4 salvo — total R$ 101,00**. O cliente de aceite foi exigido somente no encerramento. | Aprovado |
| 2 | Concluir o mesmo tipo de atendimento como venda | Mensagem de confirmação: **Venda #3 concluída — total R$ 101,00**. | Aprovado |
| 3 | Consultar o histórico de estoque | Saída de **-1 un**, referência **#3**, origem **Venda de Balcão**, para o produto de teste. | Aprovado |
| 4 | Cancelar o pedido #3 | A confirmação alertou que o pedido seria preservado para auditoria e que o estorno único não poderia ser desfeito. Após a atualização, o pedido exibiu status **Cancelado**. | Aprovado |
| 5 | Consultar o histórico após o cancelamento | Entrada de **+1 un**, referência **#3**, origem **Cancelamento de Pedido**, registrada uma única vez. | Aprovado |

> O cenário deixou apenas registros identificados como **TESTE** e foi executado com autorização prévia do responsável. A venda foi integralmente compensada pelo cancelamento, preservando o saldo inicial do produto de teste e a trilha de auditoria de pedido e movimentos.
