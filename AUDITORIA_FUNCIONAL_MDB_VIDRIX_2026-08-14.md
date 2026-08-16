# Auditoria funcional e de paridade — MDB legado × Vidrix

**Data de início:** 14 de agosto de 2026  
**Objeto auditado:** Vidrix ERP publicado no Azure e sua base de código na versão posterior a `475c97be`  
**Referência legada:** `Vidracaria2026pdv.mdb`

## Objetivo e regra de classificação

Esta auditoria verifica duas dimensões distintas. A primeira é a **integridade funcional do Vidrix**: cada fluxo atualmente anunciado deve compilar, validar entradas, persistir dados e preservar os efeitos de estoque e rastreabilidade esperados. A segunda é a **paridade com o MDB**: cada domínio legado deve ser classificado como equivalente, equivalente com condição, parcial, não equivalente ou não verificável. Uma funcionalidade ausente não será tratada como erro do fluxo simples, mas impedirá a declaração de substituição integral do MDB.

| Situação | Critério de auditoria |
|---|---|
| Conforme | Há código, teste automatizado e/ou evidência operacional que confirma o fluxo e seus efeitos. |
| Conforme com condição | O fluxo é válido apenas dentro de limites explícitos, como vidro simples em centímetros e preço informado. |
| Parcial | A função existe, mas faltam regras, dados ou evidência necessária para equivaler ao legado. |
| Não equivalente | O modelo, módulo ou regra indispensável do MDB não existe no Vidrix. |
| Não verificável | A evidência disponível não permite concluir o comportamento sem autenticação ou amostra operacional adicional. |

## Escopo funcional do Vidrix

| Domínio | Cenários a auditar |
|---|---|
| Acesso e autorização | Login local, permissões administrativas e proteção de routers. |
| Cadastros | Cliente, CPF/CNPJ, telefone, WhatsApp, CEP, produto e fornecedor. |
| Orçamentos | Área em centímetros, preço por m², PDF, edição e conversão idempotente. |
| Pedidos | Criação, estados, alteração de itens, cancelamento auditável e estorno único. |
| Venda Direta | Criação de pedido entregue, baixa de estoque, movimento e indisponibilidade de saldo. |
| Compras | Pedido, recebimento e entrada de estoque. |
| Estoque e relatórios | Saldos, movimentos, referências e relatório de estoque. |
| Interface e publicação | Rotas, estados de erro/vazio e responsividade das telas em produção. |

## Limites de paridade provenientes do MDB

O MDB contém, entre outros domínios, modalidades de preço, Box Frontal e Canto, kits, acessórios, massa, tarugo, regras de corte, pendência financeira, segunda via e relatórios especializados. Esses domínios serão reavaliados contra o Vidrix, mas não devem ser considerados automaticamente implementados porque a migração preservou parte deles como arquivo histórico e não como transações operacionais.

## Evidências exigidas

Para encerrar um cenário como conforme, a auditoria deve reunir pelo menos uma evidência técnica reproduzível — teste automatizado, inspeção de contrato ou consulta de dados — e, quando o fluxo tem interface, uma evidência visual publicada. Operações que criem pedido, alterem estoque ou gravem dados reais serão realizadas apenas com dados de teste controlados e não serão submetidas sem confirmação explícita do utilizador.

## Revisão estrutural de paridade

A revisão do modelo atual confirma que as estruturas `cuttingRules` e `legacyImportRecords` preservam as regras e os registros históricos recuperados do MDB. No entanto, a busca estática pelo repositório não encontrou entidades operacionais para modalidade comercial, vigência de preços, Box, acessórios, moldura, massa, tarugo ou pendência financeira. A presença de nomes como `Box Frontal` e `Box canto` ocorre na lista de importação de legado, não em fluxos comerciais ativos.

| Domínio do MDB | Situação atual verificada no Vidrix | Classificação de paridade |
|---|---|---|
| Vidro simples por área em centímetros | Cálculo centralizado, orçamento, pedido e preço explícito por m². | Conforme com condição. |
| Conversão de orçamento, cancelamento e histórico de estoque | Transações, idempotência, estorno e referências de movimento cobertos por testes. | Conforme controlado. |
| Venda direta de balcão | Pedido entregue, baixa de saldo e movimento `counter_sale`, sem modalidade comercial. | Parcial. |
| Modalidades de venda e preço vigente | Não há `sales_modes` nem tabela operacional de preços por modalidade. | Não equivalente. |
| Corte→venda | Regras são preservadas em `cuttingRules`, mas não participam do cálculo. | Arquivado, não equivalente operacionalmente. |
| Moldura, acessórios, massa e tarugo | Não há componentes de item ou calculador especializado. | Não equivalente. |
| Box Frontal, Box Canto e kits com BOM | Não há entidades, telas ou motor de composição operacional. | Não equivalente. |
| Pendência, conta-corrente e crédito | O cliente possui identificação e contato, sem financeiro ou regra de bloqueio. | Não equivalente. |
| Segunda via e relatórios especializados | Existe PDF de orçamento e relatórios simples; não há documentos por modalidade/produção. | Parcial. |

> **Conclusão estrutural provisória.** O Vidrix não deve ser apresentado como uma reprodução integral do MDB. Ele é auditável como substituto controlado para a venda de vidro simples, com medidas em centímetros e preço informado, enquanto os módulos especializados e financeiros do Access permanecem fora do escopo operacional.

## Fontes internas desta etapa

- [`MDB_RULE_EVENT_MATRIX.md`](./MDB_RULE_EVENT_MATRIX.md), matriz de 24 regras e cinco grupos de eventos legados.
- [`MDB_PARITY_FINAL_REPORT.md`](./MDB_PARITY_FINAL_REPORT.md), conclusão e limites da paridade previamente inventariados.
- `drizzle/schema.ts`, `server/db.ts` e `server/routers/legacyMigration.ts`, inspecionados para confirmar que as regras de corte estão arquivadas e não integram a venda atual.

## Reconciliação atual de dados em produção

Em 14 de agosto de 2026, foi executada uma consulta autenticada no App Service publicado, utilizando somente endpoints administrativos de leitura. O resultado confirma que o arquivo histórico e as regras de corte preservadas permanecem exatamente nas contagens registradas após a migração. Não houve duplicação da carga legada.

| Indicador consultado | Linha de base da migração | Resultado atual | Conclusão |
|---|---:|---:|---|
| Registros históricos em `legacyImportRecords` | 118.295 | 118.295 | Conforme; preservação idempotente mantida. |
| Regras em `cuttingRules` | 118.144 | 118.144 | Conforme; preservação técnica mantida. |
| Clientes | 54 migrados | 57 totais, IDs 1–57 contíguos | Há três cadastros posteriores à migração; não são duplicação do lote legado. |
| Produtos | 34 migrados | 36 totais, IDs 1–36 contíguos | Há dois cadastros posteriores à migração; não são duplicação do lote legado. |
| Pedidos | Não aplicável à carga histórica | 2, sendo 1 cancelado e 1 entregue | Há registros operacionais de validação/controlados após a migração. |
| Orçamentos | Não aplicável à carga histórica | 2, sendo 1 convertido e 1 rascunho | Há registros operacionais posteriores à migração. |

As janelas de criação confirmam que os primeiros clientes e produtos coincidem com a importação de 13 de agosto; os registros adicionais são posteriores. Como a consulta não expõe nomes, documentos ou detalhes comerciais, ela comprova integridade de contagem e evita divulgar dados pessoais. A origem de negócio de cada cadastro posterior deverá ser confirmada pela operação antes de qualquer limpeza de dados.

## Auditoria técnica dos fluxos

A regressão automatizada foi executada integralmente com **61 cenários aprovados**. A compilação de produção também foi concluída, gerando o frontend Vite e os pacotes de servidor para o App Service. O registro de desenvolvimento confirma que o servidor voltou a iniciar e que o bootstrap do esquema está pronto após as correções anteriores. Os erros de sintaxe presentes em linhas antigas do log são históricos; a compilação atual é bem-sucedida.

| Fluxo auditado | Evidência técnica atual | Resultado |
|---|---|---|
| Login local, logout e superadmin | Testes de autenticação, login do superadmin e encerramento de sessão aprovados. | Conforme. |
| Clientes e contatos | Cinco testes de contrato, incluindo CPF/CNPJ, telefone, WhatsApp, criação e edição. | Conforme. |
| Metragem e preço simples | Cálculo central em cm, rejeição de zero/negativos/não numéricos e aceitação de vírgula decimal. | Conforme com condição. |
| Orçamento → pedido | Router usa transação, bloqueio de orçamento e produto, impedindo conversão repetida e estoque insuficiente. | Conforme controlado. |
| Ciclo de pedido e estoque | Teste integrado confirma saídas, ajustes, remoção, cancelamento, estorno líquido zero e referências distintas. | Conforme controlado. |
| Cancelamento | Teste confirma auditoria, estorno único e comportamento inalterado no segundo cancelamento. | Conforme controlado. |
| Venda Direta | Teste confirma pedido entregue, área, item, baixa e movimento `counter_sale`; a insuficiência de saldo aborta o fluxo. | Conforme controlado. |
| Relatório de movimentos | Teste integrado confirma os tipos de origem e a apresentação das referências de estoque. | Conforme. |
| Migração | Quatro testes e reconciliação autenticada de contagens em produção. | Conforme para preservação. |
| Compras e recebimento | Não há teste de integração. O código atual recebe sem transação e sem verificar se o pedido já está `recebido`; uma segunda chamada repete a entrada e os movimentos. | **Não conforme — correção crítica necessária.** |
| Dashboard, fornecedores e interface completa | Há routers e páginas, mas não há cenário automatizado de ponta a ponta para esses módulos. | Não verificável integralmente nesta etapa. |

### Achado A-01 — recebimento de compra pode duplicar estoque

O procedimento `purchaseOrders.receive` lê o pedido e seus itens, atualiza um produto e insere um movimento por item, mas não executa dentro de uma transação, não bloqueia o pedido e não recusa uma nova execução quando o status já é `recebido`. Assim, uma repetição por duplo clique, falha de rede ou reenvio pode aumentar o saldo duas vezes. A correção deve fazer bloqueio da ordem, verificar o status, executar todos os incrementos e movimentos em uma única transação e retornar resultado idempotente para tentativas posteriores.

### Achado A-02 — segregação operacional por papel

**Corrigido na versão posterior à validação de 14/08/2026.** A política agora diferencia o atendimento comercial (`user`) das operações de alto impacto (`admin` e `superadmin`). O servidor bloqueia criação e recebimento de compras, ajustes manuais de estoque, manutenção de produtos e fornecedores, alteração de status/cancelamento de pedidos e mudanças de itens de pedido para utilizadores comuns. O atendimento de balcão, os clientes e os orçamentos permanecem acessíveis ao papel operacional. A matriz detalhada está em [`POLITICA_PERMISSOES_OPERACIONAIS.md`](./POLITICA_PERMISSOES_OPERACIONAIS.md) e foi coberta por teste de procedure.

### Observações de qualidade

O build emite apenas um aviso de desempenho: o pacote JavaScript principal excede 500 kB compactado. Não impede o funcionamento, mas recomenda-se divisão dinâmica de telas pesadas, especialmente PDF e relatórios. A maior limitação da evidência automatizada é que os testes de transação usam adaptadores simulados; a validação final de escrita no banco Azure continua necessária para os fluxos que alteram dados.

## Auditoria explícita de relatórios, dashboard e histórico

O router de relatórios foi revisado integralmente. Ele disponibiliza faturamento de pedidos entregues, resumo de receita, comissões fixadas em 5%, análise de estoque, relatório de orçamentos e relatório de movimentos. A evidência automatizada cobre o intervalo de faturamento e o dashboard conta com contrato para períodos comerciais, receita, status de pedido e alertas de estoque.

| Item revisado | Resultado | Evidência ou limitação |
|---|---|---|
| Faturamento sem filtro | Conforme | Consulta somente pedidos `entregue`, compatível com a tabela apresentada na interface. |
| Faturamento por intervalo | Parcial | O router aceita datas, mas a página não oferece controle de período e mantém estado `period` sem uso. O retorno do caminho filtrado deve ser normalizado e coberto antes de expor o filtro. |
| Comissões | Conforme com condição | Calcula 5% sobre pedidos entregues; a taxa é fixa no código e não é configurável. |
| Análise de estoque | Conforme para saldo atual | Classifica saldo e mínimo de estoque. Não substitui planejamento de compra ou composição especializada do MDB. |
| Dashboard | Conforme para indicadores básicos | Indicadores, gráfico mensal, status de pedidos e alertas estão conectados; contrato cobre períodos, receita, status e alertas. O estado explícito de erro permanece melhoria de experiência, sem afetar cálculo. |
| Histórico de estoque | Parcial | A origem e o identificador estão disponíveis. A página de estoque ainda deixa rótulos técnicos para `counter_sale`, `purchase_order`, `order_adjust` e `order_item_remove`. |

> **Conclusão desta revisão.** Relatórios e dashboard funcionam como visão gerencial básica de vendas simples e estoque. Não são equivalentes aos documentos especializados de produção, modalidades comerciais e financeiro do Access; os pontos de filtro, cobertura automatizada e rótulos de histórico permanecem no plano de correção.

## Evidência visual autenticada da publicação

Em 14 de agosto de 2026, a sessão administrativa publicada em `https://vidrix-erp-final.azurewebsites.net/` confirmou a disponibilidade do painel após a atualização. A barra lateral apresenta a nova taxonomia, sem rota omitida: **Visão geral**, **Atendimento comercial**, **Cadastros**, **Suprimentos e estoque** e **Gestão**.

| Área consultada | Evidência observada no Azure | Resultado |
|---|---|---|
| Dashboard e navegação lateral | Indicadores renderizados e todos os módulos visíveis sob os grupos corretos. | Conforme. |
| Balcão unificado | Atendimento inicia com itens, sem cliente; apresenta botões distintos de salvar orçamento e concluir venda, além dos blocos de complementos. | Conforme em modo de consulta. |
| Relatórios | Período de faturamento, abas e exportação CSV renderizados; o estado vazio é informado quando não há vendas entregues no intervalo. | Conforme em modo de consulta. |
| Estoque | Histórico mostra Pedido de Venda, Ajuste de Pedido, Remoção de Item, Cancelamento de Pedido e Venda de Balcão com origem legível. | Conforme em modo de consulta. |
| Clientes | Grade mostra WhatsApp e cidade; o formulário novo expõe CPF/CNPJ, telefone, WhatsApp, CEP, busca ViaCEP e endereço. | Conforme em modo de consulta. |
| Código de produto | Balcão começa pelo campo Código; os identificadores `KC`, `KF` e `PRD` aparecem no catálogo. Ao confirmar `KF-1` com `Enter`, o produto, preço e foco foram preenchidos corretamente. | Conforme em modo de consulta. |

Não foram criados, editados ou excluídos registros nesta etapa. A finalização real de um orçamento, venda ou recebimento de compra permanece condicionada a um cenário de teste controlado e autorização expressa da operação.

## Atualização de achados após correção

| Achado anterior | Situação atual | Evidência de encerramento |
|---|---|---|
| A-01 — recebimento de compra podia duplicar estoque | Corrigido. | Transação, bloqueio de pedido e produtos, retorno idempotente, prevenção de clique repetido e teste de integração. |
| Filtro de faturamento sem consumo na tela | Corrigido. | Consulta tipada por período, validação de datas e controle publicado em Relatórios. |
| Rótulos técnicos no histórico de estoque | Corrigido. | Origens comerciais renderizadas com rótulos legíveis no Azure. |
| Balcão só suportava venda direta | Corrigido. | Mesmo atendimento encerra como orçamento ou venda e persiste complementos. |
| A-02 — ausência de segregação operacional por papel | Corrigido. | Política `user`/`admin`/`superadmin` aplicada no servidor para catálogo, compras, ajustes e ciclo de pedido; teste de bloqueio aprovado. |

## Encerramento da validação publicada — 14/08/2026

Após a atualização que inclui o atendimento unificado e a navegação global por teclado, foi concluída uma sessão autenticada no ambiente publicado. A sessão confirmou a disponibilidade dos módulos essenciais, a organização lateral por área e a remoção exclusiva do bloco inicial de Atendimento da página Balcão, preservando o grupo **Atendimento Comercial** na barra lateral. A operação por teclado foi observada no Balcão e no diálogo de Clientes: `Enter` avançou entre campos e `Escape` fechou o diálogo sem persistir alterações.

| Cenário publicado | Registro e efeito confirmado | Classificação |
|---|---|---|
| Orçamento de balcão | O atendimento foi gravado como **Orçamento #4**, no valor de R$ 101,00, com cliente obrigatório apenas no encerramento e sem movimento de estoque. | Conforme |
| Venda de balcão | O mesmo fluxo comercial produziu a **Venda/Pedido #3**, entregue, no valor de R$ 101,00. | Conforme |
| Baixa de estoque | O histórico exibiu saída de uma unidade, referência #3 e origem **Venda de Balcão**. | Conforme |
| Cancelamento auditável | O pedido #3 mudou para **Cancelado**; foi criada uma única entrada de uma unidade, referência #3 e origem **Cancelamento de Pedido**. | Conforme |
| Clientes, relatórios e histórico | WhatsApp, campos de endereço/CEP, filtro de faturamento e rótulos comerciais de movimentos permaneceram visíveis e operáveis. | Conforme em inspeção visual |
| Decisão após o preço no Balcão | `Enter` em Preço/m² abriu a escolha entre adicionar produto e finalizar. Adicionar criou a nova linha com foco no produto; finalizar fechou o diálogo e focou Salvar como orçamento, sem gravar transação. | Conforme |

O conjunto de regressão mais recente contém **79 cenários aprovados**, incluindo comportamento DOM de teclado, decisão de próximo passo pelo campo Preço, fluxo unificado de balcão, recebimento idempotente de compra, segregação por papel, indicadores do dashboard e todos os agregados publicados de relatórios. A compilação de produção continua aprovada. A política técnica de permissões está definida e aplicada no servidor; sua validação visual no Azure acompanha a próxima publicação.

## Referências da evidência de encerramento

- [`AUDITORIA_VISUAL_AZURE_2026-08-14.md`](./AUDITORIA_VISUAL_AZURE_2026-08-14.md), evidências de interface e cenários de escrita controlados no Azure.
- [`server/counter-sales.integration.test.ts`](./server/counter-sales.integration.test.ts), testes de integração de atendimento de balcão.
- [`server/orders.cancel.integration.test.ts`](./server/orders.cancel.integration.test.ts), testes de cancelamento e estorno único.
- [`server/keyboard-navigator.behavior.test.ts`](./server/keyboard-navigator.behavior.test.ts), testes DOM de navegação por teclado.
