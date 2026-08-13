# Matriz de Regras e Eventos — MDB legado → Vidrix

## Critério de leitura

Esta matriz é uma especificação de transição, e não uma tentativa de reproduzir a arquitetura do Microsoft Access. A classificação deriva do esquema, das consultas SQL e dos nomes de objetos recuperáveis do `Vidracaria2026pdv.mdb`, confrontados com o esquema Drizzle, routers e telas atualmente versionados no Vidrix. Onde o corpo de VBA compilado não pôde ser extraído, a linha está marcada como **evidência nominal**; ela indica o comportamento a homologar, não uma fórmula assumida.

| Estado | Significado operacional |
|---|---|
| **Equivalente controlado** | A regra existe, foi protegida por contrato e foi aceita no ambiente publicado. |
| **Parcial** | Há estrutura correlata, mas faltam campos, abrangência ou processo. |
| **Arquivado** | A informação está preservada no arquivo de migração, sem efeito comercial no Vidrix. |
| **Ausente** | Não existe estrutura ou motor de regra correspondente. |
| **A homologar** | A fonte indica um evento ou conceito, mas exige confirmação operacional ou extração VBA em Access/ACE. |

## Regras de preço, geometria e composição

| ID | Origem e evidência do MDB | Domínio / classificação | Regra ou evento identificado | Destino atual no Vidrix | Estado | Próxima ação verificável |
|---|---|---|---|---|---|---|
| G01 | Consultas de venda Revenda, Cortado e Colocado; campos `AlturaVenda`, `LarguraVenda`, `Quantidade`. | Geometria / fórmula | Área comercial = `(altura ÷ 100) × (largura ÷ 100) × quantidade`, com medidas em **cm**. | `server/commercial-rules.ts`; `quotes.addItem`; `orders.addItem` e `updateItem`; telas `Quotes.tsx` e `Orders.tsx`. | **Equivalente controlado** | Manter exemplos de 100 × 80 cm = 0,80 m² na regressão. |
| G02 | Tabelas `Alturas`, `Larguras`, `Larguras Box`, `Larguras2 Box`. | Geometria / tabela paramétrica | Conversão de medida de corte para medida de venda, com quatro categorias de regra. | Tabela `cuttingRules`; importação em `legacyMigration.importBatch`. | **Arquivado** | Criar serviço que aplique a regra ao cálculo; hoje a tabela não participa de orçamento/pedido. |
| G03 | Tabelas de preço `A_vista`, `15 Dias`, `30 Dias`, `Revenda`, `Colocado`, `Cortado`; consultas correspondentes. | Preço / parâmetro | O preço de vidro depende da modalidade comercial. | `products.unitPrice` e `quoteItems/orderItems.unitPrice`, únicos. | **Ausente** | Modelar `sales_modes` e `product_prices` com vigência, unidade e autorização. |
| G04 | Consultas de modalidade indicam valor do vidro por área e quantidade. | Preço / fórmula | Total do vidro = área × preço por m² aplicável × quantidade. | `calculateCommercialItem`, com preço explícito e subtotal persistido. | **Parcial** | A multiplicação é equivalente; falta seleção auditável do preço/mode. |
| G05 | Consultas de venda com `Moldura`; perímetro da peça. | Composição / fórmula | Moldura = `((altura × 2) + (largura × 2)) × quantidade`. | Não há componente, perímetro ou unidade de moldura. | **Ausente** | Criar componente por metro linear, com preço e memória de cálculo. |
| G06 | Consultas `ConsultaAcrescentarAcessorio2/3` e `ConsultaExcluirAcessorio2/3`; formulário `FormAcessorios`. | Composição / evento | Inclusão e remoção de acessórios, limitados a três slots no legado. | Não há `quoteItemComponent` ou `orderItemComponent`. | **Ausente** | Criar composição normalizada sem herdar o limite rígido de três. |
| G07 | `Massa Peso`; cadastros `Massas` por modalidade. | Composição / parâmetro | Massa possui peso e preço associados à modalidade. | Sem entidade de massa, peso ou consumo. | **Ausente** | Homologar fórmula e criar catálogo/consumo de massa. |
| G08 | Formulário `Tarugo` e campos de código/valor de tarugo. | Composição / parâmetro | Tarugo é um componente comercial com código e preço. | Sem entidade ou regra de tarugo. | **Ausente** | Criar componente tipado e regra parametrizada. |
| G09 | Controles de totais e `=Sum([Totais])`. | Preço / agregação | Total agrega vidro, componentes e descontos. | `quotes.totalAmount` e `orders.totalAmount` agregam apenas subtotais simples. | **Parcial** | Centralizar memória de cálculo por componente antes de introduzir composição. |
| G10 | `TotalComDesconto` em `Venda` e fluxos de Box. | Preço / desconto | Valor líquido comercial após desconto. | Campo `quotes.discount` existe, porém não integra o cálculo de itens/pedido. | **Parcial** | Definir desconto percentual ou nominal, justificativa, aprovação e reflexo no pedido. |
| G11 | `tabelapercentual`, com percentuais entre 10% e 30%. | Preço / parâmetro histórico | Percentuais comerciais preservados no legado. | Linhas em `legacyImportRecords`; não há configuração operacional correlata. | **Arquivado** | Homologar semântica antes de transformar em regra de preço ou comissão. |

## Regras de pedido, estoque, clientes e documentos

| ID | Origem e evidência do MDB | Domínio / classificação | Regra ou evento identificado | Destino atual no Vidrix | Estado | Próxima ação verificável |
|---|---|---|---|---|---|---|
| O01 | Consultas `Consulta_Venda_*`, formulários de venda e tabelas de modalidade. | Pedido / fluxo | Uma venda pertence a uma modalidade e produz um documento comercial. | `quotes` e `orders` com estados; sem modalidade no cabeçalho. | **Parcial** | Acrescentar modalidade ao orçamento e congelá-la no pedido. |
| O02 | `Consulta Cancelar Venda`; arquivos `Con_*Arq`. | Pedido / auditoria | Cancelar preserva referência de venda para consulta posterior. | `orders.updateStatus`; `cancelledAt`, `cancelledByUserId`, `cancellationReason`; `orders.delete` bloqueado. | **Equivalente controlado** | Manter o teste de cancelamento repetido e o histórico em produção. |
| O03 | `Consulta Estoque Box Atualizado` e `ConsultaAtualizar QTD Estoque M_Box`. | Estoque / fórmula de estorno | O cancelamento recompõe a quantidade reservada. | Movimentos `order_cancel`, `order_adjust` e `order_item_remove`; saldo de produto e `stockMovements`. | **Equivalente controlado** | Expandir para estoque por chapa, corte e componente ao implementar Box. |
| O04 | `Consulta Acrescimo Venda Cancelada`; consultas de exclusão por modalidade. | Estoque / evento de reversão | Ajuste, remoção e cancelamento devem ter efeitos distinguíveis. | `orderStockReference()` e routers de pedidos registram a origem de cada movimento. | **Equivalente controlado** | Preservar referência por pedido; acrescentar referência por item na próxima evolução. |
| O05 | `Clientes.ValorDaPendência`; indicador `IIf(..., "N", "S")`; evento `Deb_AfterUpdate`. | Cliente / financeiro | O cadastro expõe pendência e influencia a operação. | `clients` contém identificação e contato, sem saldo financeiro. | **Ausente** | Criar conta-corrente, limite e política de bloqueio/aprovação. |
| O06 | Seletores de código/nome de cliente e vidro nos formulários de venda. | Cadastro / seleção | Vendas escolhem cliente e material a partir de cadastros. | `Clients.tsx`, `Products.tsx`, `Quotes.tsx`; FKs de `quotes/orders`. | **Parcial** | Incluir catálogo filtrado pela modalidade e validação fiscal quando exigida. |
| O07 | `KIt_Fontal`, `Kit_Canto`, formulários e consultas de kit. | Catálogo / composição | Kit é uma oferta composta e precificável. | 34 registros migrados para `products` como itens simples. | **Parcial** | Modelar kit/BOM para preservar componentes, consumo e custo. |
| O08 | `TempBox`, `Box Frontal`, `Box canto`, `Venda`. | Histórico / migração | Rascunhos e totais sem vínculo seguro não devem gerar pedido artificial. | `legacyImportRecords`, com tipos `rascunho_box` e `venda_historica`. | **Arquivado** | Disponibilizar consulta de histórico antes de tentar reprocessar como pedido. |
| O09 | `Erros ao colar`, com dados de cliente parcialmente estruturados. | Migração / transformação | Clientes precisam de normalização e uma chave estável. | `mapLegacyClient()` para `clients`; 54 cadastros migrados. | **Parcial** | Revisar documentos sintéticos/ausentes antes de emissão fiscal ou cobrança. |
| O10 | `Larguras*` e `Alturas`, matrizes extensas. | Migração / transformação | Regras de corte não são produtos. | 118.144 linhas em `cuttingRules`; 118.295 demais registros em arquivo idempotente. | **Equivalente como preservação** | Tratar `cuttingRules` como fonte de motor de produção futuro. |
| O11 | `OpenReport`, módulos de impressão e relatórios/segunda via por modalidade. | Documento / evento | Emite documentos e segundas vias conforme fluxo comercial. | PDF de orçamento no cliente e relatórios simplificados em `reportsRouter`. | **Parcial** | Criar PDF de pedido, segunda via e trilha de emissão por modalidade. |
| O12 | Relatórios por período, modalidade, Box, catálogo e acessórios. | Relatório / consulta | A gestão analisa venda, produção e estoque por diferentes recortes. | Dashboard, relatórios de receita, estoque, orçamento e movimentos. | **Parcial** | Incluir modalidade, cancelados, pendência, Box e produção. |

## Eventos de interface e limites de recuperação

| ID | Evidência nominal do MDB | Classificação | Tratamento correto no Vidrix | Estado |
|---|---|---|---|---|
| E01 | `Código_do_Cliente_AfterUpdate`, `CódigoDoVidro_AfterUpdate`. | Evento de seleção | Revalidar cliente/produto e recalcular a proposta no formulário React e no servidor. | **A homologar** |
| E02 | `LarguraDoVidro_AfterUpdate`, `Combinação13_AfterUpdate`. | Evento de cálculo | Usar `calculateCommercialItem` no router como fonte de verdade, não duplicar fórmulas de Access no cliente. | **Parcial** |
| E03 | `Deb_AfterUpdate`. | Evento financeiro | Depende da implementação futura de pendência/limite de crédito. | **Ausente** |
| E04 | `Form_Open`, `Form_Timer`, `Click`, `LostFocus`, `KeyPress`, `KeyUp`. | Evento de interface | Reimplementar somente comportamentos com valor de negócio ou acessibilidade. | **Arquiteturalmente diferente** |
| E05 | `DoCmd`, `CurrentDb`, `OpenRecordset`, `AddNew`, `Update`, `acCmdDeleteRecord`, `OpenReport`. | Automação VBA | Substituir por routers autenticados, transações, auditoria e componentes React; não transportar comandos Access literalmente. | **Arquiteturalmente diferente** |

> **Limite de evidência.** O inventário confirmou 77 formulários, 33 relatórios, 6 macros e 8 módulos VBA. A extração com `mdb-tools` não recupera de forma confiável todos os corpos de VBA compilados. Por isso, as regras SQL, campos e eventos nomeados estão classificados; qualquer fórmula contida somente em VBA requer exportação do projeto em Access/ACE antes da sua homologação.

## Referências

[1]: ./MDB_VIDRIX_PARITY_AUDIT.md "Auditoria de paridade do MDB"
[2]: ./MIGRATION_MDB_ANALYSIS.md "Análise e reconciliação da migração MDB"
[3]: ./OPERATIONAL_ACCEPTANCE_EVIDENCE_2026-08-13.md "Evidências de aceitação operacional"
