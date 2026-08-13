# Evidências de Aceitação Controlada — 13 de agosto de 2026

## Escopo e rastreabilidade

Esta execução foi realizada no ambiente publicado `https://vidrix-erp-final.azurewebsites.net`, depois da publicação bem-sucedida da revisão `7ca89955` pelo GitHub Actions, execução `31731533643`. A autenticação local de administrador foi aceita em produção. Os cenários de negócio foram exercitados por chamadas autenticadas ao contrato público da aplicação e, depois de restaurada a sessão do Chrome, o cadastro de produto também foi confirmado visualmente pela interface publicada.

| Elemento | Identificador | Estado final |
|---|---:|---|
| Cliente de teste | 55 | Ativo, nomeado com o prefixo `TESTE ACEITACAO`. |
| Produto de teste | 35 | Saldo final de 10 unidades, igual ao saldo inicial. |
| Orçamento de teste | 1 | Convertido, total de R$ 160,00. |
| Pedido de teste | 1 | Cancelado e preservado para auditoria. |
| Movimentos de estoque | 1 a 6 | Persistidos e exibidos no relatório. |

## Resultado dos cenários

| Cenário | Procedimento executado | Evidência observada | Resultado |
|---|---|---|---|
| Cadastro de produto | Criação e edição do produto de catálogo com largura e altura base `0`. | Produto 35 persistiu com `width=0,00`, `height=0,00`, saldo 10 e mínimo 1. | Aprovado. |
| Cadastro pela interface | Formulário `Novo Produto` preenchido e salvo no Chrome autenticado. | Produto `TESTE UI - Cadastro de Produto - 2026-08-13` apareceu na tabela com espessura 4, preço R$ 100,00 e saldo 1; a tela apresentou a confirmação de sucesso. | Aprovado. |
| Edição pela interface | O produto de teste foi filtrado, aberto pelo botão de edição, alterado de R$ 100,00 para R$ 101,00 e salvo. | A tabela exibiu o preço atualizado de R$ 101,00 e a confirmação visual `Produto atualizado com sucesso`. | Aprovado. |
| Cálculo de metragem | Item do orçamento: 100 cm × 80 cm, quantidade 2, R$ 100,00/m². | Área calculada: `0,8000 m²`; subtotal e total: R$ 160,00. | Aprovado. |
| Conversão idempotente | Conversão do orçamento 1 efetuada duas vezes. | Primeira chamada criou o pedido 1; segunda devolveu o mesmo pedido com `alreadyConverted=true`. | Aprovado. |
| Reserva inicial | Conversão e inclusão temporária de item no pedido. | Duas saídas com origem `order`: quantidades 2 e 1. | Aprovado. |
| Ajuste de quantidade | Item principal alterado de 2 para 3 e restaurado para 2. | Uma saída e uma entrada de quantidade 1, ambas com origem `order_adjust`. | Aprovado. |
| Remoção de item | Segundo item temporário removido. | Uma entrada de quantidade 1 com origem `order_item_remove`. | Aprovado. |
| Cancelamento auditável | Pedido 1 cancelado com motivo de teste; tentativa repetida de cancelamento. | `cancelledAt`, utilizador 1 e motivo foram persistidos; uma única entrada de quantidade 2 com origem `order_cancel`; repetição retornou `unchanged=true`. | Aprovado. |
| Saldo e relatório | Consulta do produto e do relatório de movimentos após o cancelamento. | Saldo voltou de 8 para 10; relatório apresentou as seis movimentações e a referência `#1`. | Aprovado. |

## Histórico de estoque confirmado

| Movimento | Tipo | Quantidade | Origem | Referência |
|---:|---|---:|---|---|
| 1 | Saída | 2 | `order` | Pedido #1 |
| 2 | Saída | 1 | `order` | Pedido #1 |
| 3 | Saída | 1 | `order_adjust` | Pedido #1 |
| 4 | Entrada | 1 | `order_adjust` | Pedido #1 |
| 5 | Entrada | 1 | `order_item_remove` | Pedido #1 |
| 6 | Entrada | 2 | `order_cancel` | Pedido #1 |

O efeito líquido dos seis movimentos foi **zero**, de modo que o saldo inicial de 10 unidades foi restaurado. O pedido não foi excluído, permanecendo em estado `cancelado` como registro de auditoria.

## Cobertura automatizada associada

Após a execução, a suíte local foi ampliada para **31 testes em 14 arquivos**. Os testes de integração agora exercitam o router de cancelamento auditável, o ciclo de estoque com ajuste e remoção, e a transformação do histórico persistido para o relatório. A compilação de produção também foi concluída sem erros.

## Pendência controlada

Os cenários técnicos e as conferências visuais de cadastro e edição foram concluídos. Os registos identificados como `TESTE` foram preservados como trilha de aceitação; a decisão de mantê-los como evidência ou removê-los por procedimento administrativo cabe à operação.
