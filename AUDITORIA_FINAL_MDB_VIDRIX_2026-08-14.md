# Relatório final de auditoria funcional e de paridade — MDB legado × Vidrix

**Data:** 14 de agosto de 2026  
**Sistema auditado:** Vidrix ERP publicado no Azure  
**Referência funcional:** `Vidracaria2026pdv.mdb`  
**Versão auditada:** publicação posterior ao checkpoint `475c97be`

## Parecer executivo

O **Vidrix está operacionalmente apto para o fluxo comercial simples de uma vidraçaria**: cadastro de clientes e produtos, atendimento de balcão, orçamento, conversão de orçamento, venda concluída, movimentação de estoque, compras, relatórios básicos e rastreabilidade. A auditoria confirmou **61 testes automatizados aprovados**, compilação de produção bem-sucedida, reconciliação de dados históricos no Azure e inspeção visual autenticada da versão publicada.[1] [2]

O sistema **não é uma reprodução integral do Microsoft Access**. A equivalência alcançada é controlada para vidros e complementos comerciais com preço explícito, medidas em centímetros e estoque de produto. O MDB ainda possui domínios que não foram reproduzidos como regras operacionais: modalidades e vigência de preço, motor de corte, composição de Box/kits, financeiro de pendências e documentos especializados de produção. Esses limites devem ser mantidos explícitos em qualquer decisão de substituição do legado.[3] [4]

> **Conclusão.** O Vidrix pode ser utilizado no atendimento comercial simples, desde que a operação valide um cenário de escrita controlado no Azure e defina a matriz de permissões de utilizadores. Não deve ser anunciado como equivalente integral ao MDB enquanto os domínios especializados e financeiros abaixo permanecerem fora do escopo.

| Dimensão | Situação | Síntese |
|---|---|---|
| Integridade técnica | Conforme | Regressão, compilação, bootstrap e publicação concluídos. |
| Atendimento comercial simples | Conforme com condição | Orçamento e venda compartilham um atendimento; cliente obrigatório no encerramento; cálculos em cm. |
| Estoque e compras | Conforme controlado | Baixas, entradas, cancelamentos, referências e recebimento idempotente cobertos. |
| Cadastro de clientes | Conforme | CPF/CNPJ, telefone, WhatsApp, CEP e endereço presentes no sistema publicado. |
| Relatórios básicos | Conforme com condição | Faturamento filtrado, estoque e movimentos; sem equivalência aos documentos especializados do Access. |
| Paridade integral com o MDB | Não equivalente | Faltam regras especializadas de produção, preço e financeiro. |
| Segregação por papel | Pendente de decisão operacional | O sistema ainda não aplica matriz de autorização entre consulta, operação e administração. |

## Evidências reunidas

| Evidência | Resultado | Abrangência |
|---|---|---|
| Regressão automatizada | 61 testes aprovados | Autenticação, contratos, cálculos, clientes, balcão, estoque, compras, UI e relatórios. |
| Compilação de produção | Aprovada | Frontend e backend compilados para a implantação Azure. |
| Reconciliação autenticada de dados | Aprovada | 118.295 registros históricos e 118.144 regras preservados sem duplicação. |
| Inspeção visual autenticada | Aprovada em modo de consulta | Barra lateral, balcão, clientes, estoque e relatórios renderizados no Azure. |
| Cenários de escrita em produção | Não executados nesta etapa | Requerem autorização explícita para criar orçamento, venda ou recebimento de teste. |

## Fluxo comercial unificado de balcão

O formulário de balcão foi reorganizado para refletir a regra operacional indicada pela referência enviada: o atendimento começa pelos itens, não pelo cliente. Ao finalizar, o operador decide se o mesmo atendimento será **salvo como orçamento** ou **concluído como venda**.

| Etapa | Regra atual | Controle validado |
|---|---|---|
| Início do atendimento | Cliente não é exigido para inserir vidros e complementos. | Interface publicada e contrato de entrada. |
| Itens de vidro | Largura e altura em centímetros; área calculada no servidor; preço por m². | Regras comerciais e integrações de estoque. |
| Complementos | Acessórios, massa, tarugo, moldura e montagem entram no total; um complemento pode apontar para produto quando deve baixar estoque. | Persistência, totalização e integração de venda. |
| Orçamento | No encerramento, exige cliente escolhido ou criado rapidamente; grava rascunho comercial. | Contrato e integração do atendimento unificado. |
| Venda | No encerramento, exige cliente; cria pedido entregue, baixa saldo e grava movimento `counter_sale`. | Integração transacional e histórico de estoque. |
| Cliente rápido | Após o cadastro, o cliente recém-criado é selecionado, a busca é limpa e o encerramento é mantido aberto. | Teste comportamental do callback de sucesso. |

## Paridade atualizada com o MDB

| Domínio do MDB | Situação no Vidrix | Classificação |
|---|---|---|
| Vidro simples por área | Área centralizada em centímetros e preço explícito por m². | Conforme com condição. |
| Orçamento, conversão e pedido | Rascunho, conversão idempotente, cancelamento auditável e estorno único. | Conforme controlado. |
| Balcão | Orçamento e venda no mesmo atendimento, com cliente no encerramento. | Conforme controlado. |
| Acessórios, massa, tarugo, moldura e montagem | Complementos persistentes no atendimento unificado, com totalização auditável e baixa opcional vinculada a produto. | Parcial — campos e cálculos especializados do Access não foram reproduzidos literalmente. |
| Compra e entrada de estoque | Recebimento transacional, bloqueio e repetição idempotente. | Conforme controlado. |
| Modalidades de venda e preço vigente | Não há tabela de vigência, modo de venda ou precificação automática por modalidade. | Não equivalente. |
| Corte→venda | Regras do Access foram preservadas, mas não alimentam o cálculo comercial. | Arquivado, não equivalente operacionalmente. |
| Box Frontal, Box Canto e kits/BOM | Nomes podem existir no catálogo, mas não há motor de composição, medidas ou produção. | Não equivalente. |
| Pendências, crédito e conta-corrente | Não há financeiro, saldo por cliente ou bloqueio de venda. | Não equivalente. |
| Segunda via e documentos de produção | Há PDF de orçamento, sem documentos especializados por modalidade. | Parcial. |

## Correções concluídas durante a auditoria

| Achado | Correção aplicada | Estado |
|---|---|---|
| Recebimento de compra duplicava saldo em reenvios | Transação, bloqueio de pedido e produtos, verificação de status e retorno idempotente; UI bloqueia repetição. | Encerrado. |
| Atendimento de balcão só concluía venda | Novo desfecho unificado para orçamento ou venda, com vínculo de cliente no encerramento. | Encerrado. |
| Não havia suporte operacional a complementos | Tabela, contrato, cálculo no servidor, UI e testes para complementos comerciais. | Encerrado. |
| Filtro de faturamento não era consumido | Filtro publicado, validação de período e contrato de receita normalizado. | Encerrado. |
| Origem de movimentos exibia códigos técnicos | Rótulos comerciais adicionados para venda, balcão, compra, ajustes, remoção e cancelamento. | Encerrado. |
| Navegação lateral plana | Módulos agrupados por Visão geral, Atendimento comercial, Cadastros, Suprimentos e estoque e Gestão. | Encerrado. |

## Pendências e recomendações

| Prioridade | Pendência | Recomendação objetiva |
|---|---|---|
| Alta | Matriz de permissões | Definir quem consulta, vende, cadastra, recebe compra, ajusta estoque e administra. Só então restringir routers e interface por papel. |
| Alta | Aceite de escrita no Azure | Criar um cliente de teste, um orçamento e uma venda de valor controlado; verificar pedido, saldo e movimento; depois decidir sobre manter ou limpar esses registros. |
| Média | Paridade avançada do MDB | Priorizar conforme o uso real: modalidade/preço, Box/kits, corte ou financeiro. Cada domínio precisa de modelo e regra próprios. |
| Média | Relatórios de produção | Definir quais documentos e indicadores do Access são indispensáveis para emitir os relatórios equivalentes. |
| Baixa | Desempenho inicial | Dividir dinamicamente módulos de PDF e relatórios para reduzir o pacote principal acima de 500 kB. |

## Decisão de operação recomendada

Para operação comercial corrente, recomenda-se iniciar com o escopo de **vidros e complementos comercialmente simples**, utilizando o atendimento unificado de balcão. A entrada em produção deve ser acompanhada de uma política simples de utilizadores e de uma primeira venda controlada. Processos de fabricação por Box, composição de kits, cálculo baseado nas regras de corte ou gestão de pendência financeira devem permanecer no MDB até que sejam formalmente especificados e implementados no Vidrix.

## Referências

[1]: ./AUDITORIA_FUNCIONAL_MDB_VIDRIX_2026-08-14.md "Auditoria funcional e evidências técnicas"
[2]: ./UNIFIED_COUNTER_FLOW_SPEC.md "Especificação do atendimento unificado"
[3]: ./MDB_RULE_EVENT_MATRIX.md "Matriz de regras e eventos do MDB"
[4]: ./MDB_PARITY_FINAL_REPORT.md "Relatório anterior de paridade MDB–Vidrix"
