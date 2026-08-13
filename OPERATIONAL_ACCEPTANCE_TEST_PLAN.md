# Roteiro de Aceitação Operacional — Orçamento e Pedido

## Finalidade e pré-condições

Este roteiro valida o fluxo comercial simples do Vidrix após as correções de segurança publicadas. A unidade oficial de largura e altura é **centímetro (cm)**. Os testes devem ser executados no ambiente publicado apenas por utilizadores autorizados, com registos identificados como `TESTE` e sem apagar documentos; um pedido de teste deve ser **cancelado**, para que o estorno de estoque e a trilha de auditoria possam ser comprovados.

Antes de começar, o superadmin deve indicar o participante responsável, escolher um produto de teste com saldo suficiente e registrar o saldo inicial. Os cenários de Box, Kit, acessórios, venda a prazo e composição de corte permanecem fora deste roteiro porque ainda não têm paridade funcional com o MDB.

| Item de controle | Responsável | Evidência a registrar |
|---|---|---|
| Produto de teste e saldo inicial | Operação / superadmin | Nome, código/ID e quantidade antes do teste. |
| Cliente de teste | Operação / superadmin | Cliente existente autorizado ou cadastro com prefixo `TESTE`. |
| Operador | Participante | Nome de utilizador, sem compartilhar palavra-passe. |
| Valor comercial | Operação | Preço por m² e quantidade escolhidos. |
| Resultado | Operação e superadmin | IDs do orçamento e pedido, PDF e saldo final. |

## Cenário 1 — Cálculo em centímetros e PDF

O operador cria um orçamento de teste e adiciona um item com **largura 100 cm**, **altura 80 cm**, **quantidade 1** e preço por m² definido pela operação. A área esperada é **0,80 m²**. O total do item deve ser `0,80 × preço por m² × quantidade`, com arredondamento monetário normal. O PDF deve exibir a mesma área, quantidade, preço e total apresentados na tela.

> Critério de aprovação: o orçamento e o PDF registram `0,80 m²`; valores não numéricos, zero ou negativos são recusados; a criação não altera o estoque.

## Cenário 2 — Conversão única em pedido e reserva

O responsável converte o mesmo orçamento em pedido uma única vez. Deve registrar o ID do pedido criado e o saldo após a conversão. A tentativa de converter novamente o mesmo orçamento deve informar que a conversão já ocorreu e não pode gerar outro pedido nem outra baixa de estoque.

> Critério de aprovação: existe exatamente um pedido originado do orçamento; o saldo reduz uma única vez pela quantidade do item; o histórico mostra uma saída com origem `order` e referência ao pedido.

## Cenário 3 — Ajuste e remoção de item reservado

Em um pedido de teste ainda ativo, o operador altera a quantidade do item e confere o saldo. Ao aumentar a quantidade, deve haver uma saída de ajuste; ao reduzir, deve haver uma entrada de estorno. Se o item for removido, o sistema deve gerar a entrada correspondente. Esta etapa só é executada se a operação autorizar que o pedido de teste seja modificado antes do cancelamento.

> Critério de aprovação: cada ajuste reflete apenas a diferença de quantidade; o histórico usa origem `order_adjust` ou `order_item_remove`; o saldo final corresponde ao item restante no pedido.

## Cenário 4 — Cancelamento auditável e estorno único

O responsável cancela o pedido de teste, informando um motivo, por exemplo `TESTE DE ACEITAÇÃO`. O pedido deve permanecer visível como cancelado e informar data, utilizador e motivo. O saldo deve retornar pelo total ainda reservado. Uma nova tentativa de cancelar o mesmo pedido não deve criar outro estorno.

> Critério de aprovação: o histórico mostra uma única entrada com origem `order_cancel`; o saldo final é igual ao saldo inicial, considerando somente os itens e ajustes desse teste; o pedido não é apagado.

## Registro do resultado

| Cenário | Situação | IDs e valores observados | Evidência | Observação ou defeito |
|---|---|---|---|---|
| 1. Cálculo e PDF | Pendente |  |  |  |
| 2. Conversão única | Pendente |  |  |  |
| 3. Ajuste/remoção | Pendente |  |  |  |
| 4. Cancelamento | Pendente |  |  |  |

Qualquer divergência deve interromper o cenário seguinte, preservar o pedido cancelado como evidência e registrar o ID do documento antes de qualquer nova correção técnica.
