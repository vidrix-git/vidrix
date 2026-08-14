# Encerramento das pendências documentais de paridade — MDB legado × Vidrix

**Data:** 14 de agosto de 2026  
**Referências:** [`MDB_RULE_EVENT_MATRIX.md`](./MDB_RULE_EVENT_MATRIX.md), [`AUDITORIA_FINAL_MDB_VIDRIX_2026-08-14.md`](./AUDITORIA_FINAL_MDB_VIDRIX_2026-08-14.md) e [`AUDITORIA_FUNCIONAL_MDB_VIDRIX_2026-08-14.md`](./AUDITORIA_FUNCIONAL_MDB_VIDRIX_2026-08-14.md).

## Decisão de encerramento

As pendências de paridade abertas no checklist foram reavaliadas contra a matriz nominal do MDB, os routers, os testes automatizados e os cenários controlados no Azure. O fechamento não afirma equivalência integral ao Access: registra, de forma rastreável, quais regras são equivalentes sob controle, quais foram preservadas somente como histórico e quais permanecem explicitamente fora de escopo.

| Grupo de evidência | Regras e eventos | Estado de encerramento | Justificativa verificável |
|---|---|---|---|
| Cálculo e preço simples | G01, G04, E02 | Encerrado como equivalente controlado/parcial | Medidas em centímetros, cálculo server-side e testes comerciais. Modalidade e vigência de preço continuam fora do escopo. |
| Pedido e estoque | O01–O04 | Encerrado como controlado | Orçamento, venda, cancelamento auditável, baixa e estorno único foram testados e confirmados no Azure. |
| Cadastros e migração | O06, O09, O10 | Encerrado como parcial/preservação | Cadastros e regras históricas foram migrados; campos e motor fiscal/produção não foram assumidos como equivalentes. |
| Atendimento de balcão | fluxo unificado e complementos | Encerrado como controlado | O mesmo atendimento salva orçamento ou venda, exige cliente no encerramento e persiste complementos comerciais. |
| Eventos de interface | E01, E04, E05 | Encerrado como arquitetura diferente | A implementação React/tRPC substitui eventos Access por estado, validação de router, foco e transações; não há transporte literal de VBA. |
| Produção, modalidades e financeiro | G02, G03, G05–G11, O05, O07, O11–O12, E03 | Reclassificado como fora de escopo | Corte, Box/kits, tabela de preços por modalidade, pendência financeira e documentos especializados requerem especificação própria. |

> Nenhuma lacuna aberta foi classificada como defeito crítico do escopo comercial simples atualmente publicado. As lacunas são produtos futuros ou dependem de fórmulas VBA não recuperáveis com segurança. O uso de equivalência integral é vedado enquanto permanecerem fora de escopo.

## Rastreabilidade das pendências do checklist

| Item do checklist | Evidência de fechamento |
|---|---|
| Revalidar estrutura, dados, regras e eventos | Matriz G01–G11, O01–O12 e E01–E05, com estado e próxima ação por linha. |
| Consolidar conclusão verificável | Parecer final e este registro delimitam a paridade controlada, parcial, arquivada e ausente. |
| Registrar regras e eventos revalidados | Matriz de regras e eventos mais cenário publicado de orçamento, venda, baixa e cancelamento. |
| Corrigir ou classificar divergências de alta prioridade | Divergências de produção/financeiro foram formalmente classificadas como fora de escopo, sem serem apresentadas como implementadas. |
| Fechar achados ou reclassificá-los | A segregação de permissões permanece como implementação técnica própria; a paridade documental está encerrada sem ocultar limites. |
