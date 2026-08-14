# Auditoria funcional e de paridade — MDB legado × Vidrix

**Data de início:** 14 de agosto de 2026  
**Objeto auditado:** Vidrix ERP publicado no Azure e sua base de código na versão `a0f4d61d`  
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

A regressão automatizada foi executada integralmente com **19 arquivos e 45 cenários aprovados**. A compilação de produção também foi concluída, gerando o frontend Vite e os pacotes de servidor para o App Service. O registro de desenvolvimento confirma que o servidor voltou a iniciar e que o bootstrap do esquema está pronto após as correções anteriores. Os erros de sintaxe presentes em linhas antigas do log são históricos; a compilação atual é bem-sucedida.

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

### Achado A-02 — autorização funcional ainda não é segregada por papel

O login e a criação de superadmin são controlados, e a importação legada é exclusiva de administrador. Contudo, os routers de clientes, produtos, orçamento, pedidos, compras, estoque, relatórios e Venda Direta usam proteção de sessão genérica, sem restrição de papel. O desenho atual admite que qualquer utilizador autenticado execute operações comerciais globais. A operação deve definir uma matriz de permissões e aplicar pelo menos a separação entre consulta, operação, gestão de cadastro e administração antes de conceder contas a utilizadores não administrativos.

### Observações de qualidade

O build emite apenas um aviso de desempenho: o pacote JavaScript principal excede 500 kB compactado. Não impede o funcionamento, mas recomenda-se divisão dinâmica de telas pesadas, especialmente PDF e relatórios. A maior limitação da evidência automatizada é que os testes de transação usam adaptadores simulados; a validação final de escrita no banco Azure continua necessária para os fluxos que alteram dados.

## Auditoria explícita de relatórios, dashboard e histórico

O router de relatórios foi revisado integralmente. Ele disponibiliza faturamento de pedidos entregues, resumo de receita, comissões fixadas em 5%, análise de estoque, relatório de orçamentos e relatório de movimentos. A evidência automatizada atual cobre a transformação do histórico de movimentos e os tipos de evento de pedido; os demais agregados são estruturalmente consistentes com suas consultas, mas ainda não possuem testes de contrato específicos.

| Item revisado | Resultado | Evidência ou limitação |
|---|---|---|
| Faturamento sem filtro | Conforme | Consulta somente pedidos `entregue`, compatível com a tabela apresentada na interface. |
| Faturamento por intervalo | Parcial | O router aceita datas, mas a página não oferece controle de período e mantém estado `period` sem uso. O retorno do caminho filtrado deve ser normalizado e coberto antes de expor o filtro. |
| Comissões | Conforme com condição | Calcula 5% sobre pedidos entregues; a taxa é fixa no código e não é configurável. |
| Análise de estoque | Conforme para saldo atual | Classifica saldo e mínimo de estoque. Não substitui planejamento de compra ou composição especializada do MDB. |
| Dashboard | Parcial | Indicadores, gráfico mensal, status de pedidos e alertas estão conectados; há carregamento e estado vazio, mas falta teste de contrato e estado explícito de erro. |
| Histórico de estoque | Parcial | A origem e o identificador estão disponíveis. A página de estoque ainda deixa rótulos técnicos para `counter_sale`, `purchase_order`, `order_adjust` e `order_item_remove`. |

> **Conclusão desta revisão.** Relatórios e dashboard funcionam como visão gerencial básica de vendas simples e estoque. Não são equivalentes aos documentos especializados de produção, modalidades comerciais e financeiro do Access; os pontos de filtro, cobertura automatizada e rótulos de histórico permanecem no plano de correção.
