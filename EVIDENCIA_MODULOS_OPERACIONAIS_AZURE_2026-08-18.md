# Evidência de validação de módulos operacionais — Azure

**Data:** 18 de agosto de 2026  
**Ambiente:** `https://vidrix-erp-final.azurewebsites.net`  
**Método:** inspeção autenticada, sem criar, editar, excluir ou confirmar operações de negócio.

## Catálogos

| Módulo | Evidência observada | Resultado |
| --- | --- | --- |
| Produtos | A página exibiu busca por código/nome, botão **Novo Produto**, tabela com código, nome, tipo, espessura, preço, estoque, status e ações focáveis. Os códigos legados `KC-*` e `KF-*`, bem como `PRD-35` e `PRD-36`, estavam disponíveis. | Interface carregada e controles de teclado presentes. |
| Fornecedores | A página exibiu busca e botão **Novo Fornecedor**; o estado vazio **Nenhum fornecedor cadastrado** foi apresentado de forma clara e a navegação lateral permaneceu disponível. | Interface carregada, estado vazio compreensível e controles focáveis. |

## Suprimentos e estoque

| Módulo | Evidência observada | Resultado |
| --- | --- | --- |
| Pedidos de Compra | O botão **Novo Pedido de Compra** ficou disponível e o estado vazio **Nenhum pedido de compra cadastrado** foi apresentado, sem iniciar compra. | Interface carregada e ação administrativa focável. |
| Estoque | A tabela de histórico exibiu data/hora, tipo, produto, quantidade, referência e origem. Foram apresentados movimentos de saída e entrada, incluindo pedido de venda, ajuste, remoção de item, cancelamento e venda de balcão. | Rastreabilidade operacional visível e dados carregados. |

> Nenhum pedido de compra ou ajuste de estoque foi submetido durante esta inspeção.

## Gestão comercial

| Módulo | Evidência observada | Resultado |
| --- | --- | --- |
| Relatórios | Estavam disponíveis as abas **Faturamento**, **Comissões** e **Análise de Estoque**, o seletor de período e a ação **Exportar CSV**. O estado sem dados foi comunicado claramente. | Controles não textuais acessíveis e interface carregada. |
| Pedidos de Venda | A tela apresentou abas **Lista** e **Kanban**, estados de pedido em controles combobox e ação de cancelamento com identificação do pedido. | Kanban/lista e ações operacionais carregados; nenhuma mudança de status foi acionada. |

> A revisão limitou-se a carregamento, clareza dos estados e disponibilidade dos controles. Não foram submetidas exportações, alterações de status ou cancelamentos.

> Nenhum cadastro, alteração ou remoção foi submetido durante esta inspeção.

## Cobertura comportamental complementar

Além da inspeção publicada, a suíte `server/real-operational-forms.keyboard.test.ts` passou com **8 cenários DOM** sobre as próprias páginas do ERP. Ela comprova o avanço por **Enter** entre campos de formulário, retorno por **Shift+Enter** quando aplicável, preservação de diálogos, seleção por teclado nos comboboxes de Fornecedores, Compras e Orçamentos, seleção de período, abas Lista/Kanban, transição Informações/Itens de Orçamentos e cancelamento sem submissão em Clientes, Produtos, Fornecedores, Compras, Orçamentos, Relatórios e Pedidos. Nos comboboxes, **Enter** confirma a opção e o foco permanece no controle; o avanço seguinte ocorre por **Tab**, conforme a política de acessibilidade do componente.

O cenário de Compras foi reforçado para criar somente uma linha local de item e comprovar, sem submissão, que **Enter** em **Observações** desloca o foco para o seletor de Produto recém-adicionado; após confirmação do produto e Tab para **Quantidade**, **Enter** avança para **Custo Unitário** e **Shift+Enter** retorna à Quantidade. O diálogo é cancelado ao final, sem criar pedido ou item.

A tela de Estoque foi tratada deliberadamente como **consulta auditável**: a prova garante tabela disponível, contêiner de rolagem horizontal segura e ausência de ação mutável nessa página. Ajustes continuam protegidos pelo fluxo administrativo específico e por regras de servidor.

## Conclusão de fluxos e responsividade

Os fluxos publicados de Balcão, Orçamentos, Pedidos, Compras, Estoque, Relatórios e cadastros foram inspecionados em desktop sem criar, editar, receber, cancelar ou exportar dados. Em conjunto com as evidências específicas de Balcão, autenticação e Clientes, e com as verificações estruturais automatizadas de modal, grade e rolagem segura, esta revisão encerra a validação dos novos fluxos em desktop e largura móvel sem apontar regressão bloqueante.
