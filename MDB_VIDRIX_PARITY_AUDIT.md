# Auditoria de paridade — MDB legado × Vidrix

## Escopo e evidências

Este documento consolida a engenharia reversa inicial do ficheiro `Vidracaria2026pdv.mdb` e a primeira comparação estática com o código do Vidrix. As fontes são o MDB original, a extração estrutural feita com `mdb-tools`, o levantamento técnico fornecido pelo utilizador e os componentes atualmente versionados no Vidrix. As conclusões sobre o comportamento em produção ainda devem ser confirmadas com os cenários controlados definidos para a próxima fase.

## Inventário confirmado do legado

O MDB contém 19 tabelas de dados, incluindo as modalidades `A_vista`, `15 Dias`, `30 Dias`, `Revenda`, `Colocado` e `Cortado`, além de estruturas para `Box Frontal`, `Box canto`, `TempBox`, acessórios, kits, regras de corte, massa e histórico. Foram identificadas consultas de cancelamento, atualização de estoque de Box, arquivo por modalidade, exclusão e relatórios por período. O levantamento também registra dezenas de formulários, relatórios de segunda via e módulos VBA/eventos de interface, o que demonstra que as regras não estão centralizadas apenas nas tabelas.

| Domínio legado | Evidência principal | Implicação para a paridade |
|---|---|---|
| Modalidade comercial | Tabelas e consultas distintas para à vista, 15 dias, 30 dias, revenda, colocado e cortado | O preço deve poder variar por produto e modalidade. |
| Geometria | Campos de venda, corte, medida real, metragem e moldura | Não se deve tratar dimensão comercial, corte e faturamento como o mesmo valor. |
| Composição | Três acessórios, massa, tarugo, molde, moldura e kits | O total comercial precisa decomposição rastreável por componente. |
| Operação | Consultas de venda cancelada, ajuste e estoque de Box | Cancelar deve estornar estoque, sem apagar o histórico. |
| Documentos | Relatórios por modalidade, por período e segunda via | O PDF do orçamento é apenas uma parte da camada documental exigida. |

## Matriz preliminar de regras críticas

| Regra | Evidência no MDB | Implementação atual observada | Estado preliminar |
|---|---|---|---|
| Metragem | `(altura / 100) × (largura / 100) × quantidade`, com entrada em centímetros | Orçamentos e pedidos calculam `largura × altura / 10.000 × quantidade` | **Atenção crítica:** a interface exibe `mm`, mas o divisor corresponde a centímetros. A unidade deve ser corrigida ou confirmada antes de qualquer lançamento real. |
| Valor do vidro | `m² × preço/m² da modalidade × quantidade` | Item recebe um único `unitPrice`; não há modalidade comercial de preço | **Lacuna crítica**. |
| Moldura | `((altura × 2) + (largura × 2)) × quantidade` | Não identificada no item de orçamento ou pedido | **Lacuna alta**. |
| Acessórios | Até três acessórios com valores próprios | Não identificados no modelo de itens atual | **Lacuna alta**. |
| Massa e tarugo | Preço e/ou peso dependentes da modalidade | Não identificados no fluxo atual | **Lacuna alta**. |
| Desconto e pendência | Total com desconto e saldo associado ao cliente | Orçamento possui total de itens; não foi identificada regra de pendência financeira | **Lacuna alta**. |
| Conversão em pedido | Venda passa a estoque e mantém histórico | Converter orçamento cria pedido e registra saída de estoque | **Parcial**; requer teste de idempotência e do estorno no cancelamento. |
| Cancelamento | Arquivo de venda cancelada e recomposição de estoque | Pedido cancelado cria movimento de entrada | **Parcial**; requer teste de repetição e integridade do estoque. |
| Box | Fluxos e regras próprios para frontal e canto | Não existe rota ou página específica de Box | **Lacuna crítica**. |

> **Achado prioritário:** o Vidrix calcula a área com divisor `10.000` tanto no cliente quanto no servidor, mas rotula os campos de largura e altura como milímetros. Se o utilizador inserir milímetros, o resultado será 100 vezes maior do que a área em m²; se inserir centímetros, a fórmula está alinhada ao MDB, porém a tela induz entrada incorreta. Nenhum teste com utilizador real deve avançar sem definir e validar esta unidade.

## Evidências adicionais extraídas do ficheiro MDB

| Estrutura observada | Evidência da extração | Leitura para a regra de negócio |
|---|---|---|
| Tabelas de preço por modalidade | As tabelas `A_vista`, `15 Dias`, `30 Dias`, `Revenda`, `Colocado` e `Cortado` existem no ficheiro. Na cópia analisada, não possuem linhas ativas. | A estrutura comprova que modalidade é um conceito de domínio mesmo quando a tabela não contém preço vigente. O Vidrix não possui essa dimensão no preço. |
| Kits | `KIt_Fontal` possui 25 itens e `Kit_Canto` possui 9 itens, cada um com descrição e preço. | O legado trata Kit Frontal e Kit Canto como catálogo precificável; o Vidrix só possui produto simples. |
| Conversão geométrica | `Larguras` e `Alturas` possuem 50.001 linhas cada; `Larguras Box` e `Larguras2 Box` possuem 9.071 linhas cada. | Há evidência de tabelas de conversão de medida de corte para medida de venda, que devem ser reproduzidas por regra versionada, não apenas arquivadas. |
| Acessórios, massa e Box | As tabelas `AcessoriosRevendaCadastro`, `Massa Peso`, `Box Frontal` e `Box canto` fazem parte da estrutura comercial. | A composição de Box e o preço auxiliar não podem ser reconstituídos a partir do modelo atual de um único produto por item. |
| Histórico e cancelamento | Foram identificadas tabelas/consultas de histórico e venda cancelada, além de consultas de estoque de Box. | O comportamento esperado preserva rastreabilidade e não equivale à exclusão física de um pedido. |

## Mapa do Vidrix atual

| Área do Vidrix | O que está implementado | Limite de paridade encontrado |
|---|---|---|
| Navegação | Dashboard, Orçamentos, Pedidos de Venda, Pedidos de Compra, Estoque, Relatórios, Clientes, Produtos e Fornecedores. | Não existem módulos próprios de Box, kits de venda, composição de acessórios, regras de corte ou financeiro. |
| Produto | Cadastro de nome, tipo, espessura, cor, dimensão padrão, preço unitário e quantidade em estoque. | Não há tabela de preços por modalidade, preço por m², custo/margem persistidos, peso, tarugo, molde, moldura ou acessórios. |
| Orçamento | Cabeçalho, itens, cálculo de área, total, PDF e conversão em pedido. | O formulário não oferece modalidade, desconto aplicado ao total, acessórios, componentes, medida de corte/venda ou edição completa do item. |
| Pedido | Kanban com estados aprovado, em produção, pronto, entregue e cancelado. | O pedido manual não tem tela de criação/itens; o cancelamento e a exclusão não são equivalentes ao histórico legado. |
| Estoque | Movimentos de entrada/saída e saldo no produto. | A unidade é apenas inteira; não há estoque por chapa, corte, tarugo ou Kit, nem bloqueio consistente de saldo negativo. |
| Relatórios | Faturamento entregue, comissão fixa de 5% e análise simplificada de estoque, com CSV. | Faltam segunda via, relatórios por modalidade, faturamento financeiro, pendência, cancelados e relatórios de produção/Box. |

## Achados técnicos que alteram o risco operacional

| Prioridade | Achado verificável | Consequência | Recomendação antes do uso operacional |
|---|---|---|---|
| **Crítica** | A página marca largura e altura em `mm`, enquanto `quotes.addItem` e `orders.addItem` usam `largura × altura / 10.000`. | Área, preço e total ficam 100 vezes incorretos se a entrada seguir o rótulo da interface. | Escolher formalmente `cm` ou `mm`, corrigir rótulo/fórmula e adicionar testes de cálculo com exemplos de produção. |
| **Crítica** | `quotes.convertToOrder` não bloqueia orçamento já convertido, não executa em transação e já baixa estoque. | Repetir a conversão pode criar pedidos duplicados e baixar estoque repetidamente; uma falha intermediária pode deixar dados parciais. | Tornar a conversão idempotente, transacional e condicionada ao estado do orçamento. |
| **Crítica** | `orders.delete` remove pedido e itens sem recompor saldo nem registrar estorno. | A exclusão de pedido convertido pode deixar estoque reduzido sem rastreabilidade; diverge da venda cancelada do MDB. | Bloquear exclusão de pedido operacional ou substituí-la por cancelamento auditável com estorno único. |
| **Alta** | Pedido criado manualmente não baixa estoque; pedido convertido baixa imediatamente; reativação após cancelamento limita saldo a zero. | A mesma venda tem efeitos diferentes conforme a origem e pode ocultar ruptura de saldo. | Definir um único evento de reserva/baixa, validar disponibilidade e usar movimentos transacionais por produto. |
| **Alta** | `Stock.tsx` e `reports.stockMovementsReport` usam campos como `movementType`, `movementDate` e `sourceType`; o esquema e o router retornam `type`, `createdAt`, `referenceType` e `notes`. | A tela e o relatório de movimentos podem exibir tipo, data, origem e referência vazios ou incorretos. | Corrigir o contrato de dados e cobrir a renderização de movimentação por teste. |
| **Alta** | As validações de item aceitam texto não vazio e depois usam `parseFloat`/`parseInt`. | Valores negativos, zero, não numéricos e arredondamentos inadequados podem chegar ao cálculo. | Validar números finitos, positivos, unidade e precisão; rejeitar entrada inválida antes de gravar. |
| **Alta** | Não há modalidade, componente ou regra de preço por tipo de venda. | Não é possível reproduzir Revenda, Cortado, Colocado, à vista ou prazo sem editar manualmente cada preço. | Modelar tabela de preço por modalidade, vigência e composição de item. |
| **Alta** | Não há entidades para Box Frontal/Canto, Kit, acessórios, massa, tarugo, moldura e corte. | Os casos de maior especialização do legado não podem ser testados com paridade no Vidrix atual. | Criar catálogo de componentes, regras paramétricas e calculador especializado antes de migrar esses fluxos. |

## Classificação de paridade por domínio

| Domínio | Classificação | Justificativa |
|---|---|---|
| Cliente e cadastro básico | **Parcialmente equivalente** | Há cadastro de cliente, porém sem pendência financeira, histórico comercial consolidado ou campos específicos identificados no legado. |
| Produto simples | **Parcialmente equivalente** | Há produto e saldo, mas não preço por modalidade, materiais, composição ou unidades de produção. |
| Orçamento de vidro simples | **Condicional** | A estrutura existe, mas só pode ser testada após resolver a unidade de medida, idempotência e validação numérica. |
| Pedido simples | **Condicional** | Há estados e conversão, mas efeitos de estoque e exclusão precisam correção antes do uso real. |
| Estoque simples | **Não confiável para validação final** | Há movimentos, mas há inconsistência de contrato na tela e regras de baixa/estorno incompletas. |
| Modalidades, acessórios e composição | **Não equivalente** | O modelo de dados atual não comporta os componentes e regras do MDB. |
| Box, kits e corte | **Não equivalente** | Não há telas, entidades nem motor de cálculo correspondente. |
| Documentos e financeiro | **Não equivalente** | O PDF de orçamento não substitui segunda via, controle de recebimento, pendência e relatórios legados. |

## Condição para testes com utilizadores reais

Os testes reais devem iniciar apenas no cenário **Orçamento de vidro simples**, marcado visivelmente como teste, depois de uma decisão explícita sobre a unidade de medida. Eles não devem incluir Box, Kits, acessórios, descontos complexos, venda a prazo, baixa definitiva de estoque ou exclusão de pedido enquanto as lacunas críticas estiverem abertas. O roteiro deve registrar os valores de entrada, a área esperada, o preço por m², o total, o identificador do orçamento, o identificador do pedido e o saldo de estoque antes/depois.

## Sequência de evolução recomendada

1. Corrigir unidade de medida, validação numérica e testes determinísticos de metragem.
2. Tornar conversão/cancelamento/exclusão de pedido transacionais e idempotentes, com movimentos de estoque coerentes.
3. Corrigir o contrato da tela e dos relatórios de estoque e estabelecer o teste de regressão correspondente.
4. Criar preços por modalidade, vigência e composição auditável de itens simples.
5. Implementar Catálogo de componentes e motor paramétrico para moldura, acessórios, massa, tarugo e regras de corte.
6. Implementar módulos especializados de Box Frontal, Box Canto e Kits, após homologação de fórmulas com a operação.
7. Adicionar financeiro, pendências, segunda via e relatórios de produção/comercial antes da substituição integral do legado.

## Anexo A — Inventário nominal verificável de objetos do MDB

O inventário abaixo foi produzido diretamente do catálogo `MSysObjects` do MDB e das saídas de `mdb-tables -S -T -1` e `mdb-queries -1`. O catálogo confirmou **77 formulários**, **33 relatórios**, **6 macros** e **8 módulos VBA**. As consultas internas com prefixo `~sq_` são consultas auxiliares que o Access cria para controles de formulários e relatórios; elas foram mantidas no inventário por demonstrarem dependências de interface, mas não são tratadas como regras independentes.

| Tipo | Objetos nominais observados |
|---|---|
| Tabelas comerciais e auxiliares | `15 Dias`; `30 Dias`; `A_vista`; `AcessoriosRevendaCadastro`; `Alturas`; `Box canto`; `Box Frontal`; `Colocado`; `Cortado`; `Erros ao colar`; `Kit_Canto`; `KIt_Fontal`; `Larguras`; `Larguras Box`; `Larguras2 Box`; `Massa Peso`; `Revenda`; `tabelapercentual`; `TempBox`; `Venda`. |
| Tabelas de sistema identificadas | `MSysObjects`; `MSysACEs`; `MSysQueries`; `MSysRelationships`; `MSysComplexColumns`; `MSysComplexType_UnsignedByte`; `MSysComplexType_Short`; `MSysComplexType_Long`; `MSysComplexType_IEEESingle`; `MSysComplexType_IEEEDouble`; `MSysComplexType_GUID`; `MSysComplexType_Decimal`; `MSysComplexType_Text`; `MSysComplexType_Attachment`; `MSysAccessStorage`; `MSysAccessXML`; `MSysNavPaneGroups`; `MSysNavPaneGroupToObjects`; `MSysNavPaneObjectIDs`; `MSysNavPaneGroupCategories`. |
| Formulários de venda e seleção | `15diasform`; `30diasForm`; `Formulário 15 dias`; `Formulário 30 dias`; `Formulário À Vista`; `Formulário Revenda`; `Formulário Venda Colocado`; `Formulário Venda Cortado`; `option_15dias`; `option_30dias`; `option_avista`; `option_box`; `option_colocado`; `option_cortado`; `option_revenda`. |
| Formulários de Box e composição | `Box_Arq`; `FormulárioBox`; `form_Box_Canto`; `Form_Box_Frontal`; `M_Box`; `M_Box1`; `Quadro_Kit_Canto`; `Quadro_kit_Flontal`; `SegundaViaBox`. |
| Formulários de cadastro e manutenção | `Clientes`; `Cadastro de Massas`; `CadastroMassas`; `Cadastro de Planos`; `Cadastro Kit_Canto`; `Cadastro Kit_Frontal`; `FormAcessorios`; `Tarugo`; `Vidros_15dias`; `Vidros_30dias`; `Vidros_avista`; `Vidros_Colocado`; `Vidros_Cortado`; `Vidros_Revenda`; `Massas 15 dias`; `Massas 30 dias`; `Massas A Vista`; `Massas Colocado`; `Massas Cortado`; `Massas Revenda`; `Formulário_Atualiza_Preços`. |
| Formulários de administração, impressão e subformulários | `Emitir Relatorios`; `frmMenuPrint`; `Senha`; `Vidraçaria Barcelos Domingos`; `Formulário1`; `FormulárioAtualizaPlano1`–`FormulárioAtualizaPlano6`; `SubFormAtualizaPlano1`–`SubFormAtualizaPlano6`; `Vidros_Revenda subformulário`; `Vidros_Revenda subformulário1`; `Vidros_Revenda subformulário2`; `Segunda_Via_15dias_ComAcessorio`; `Segunda_Via_15dias_SemAcessorio`; `Segunda_Via_30dias_ComAcessorio`; `Segunda_Via_30dias_SemAcessorio`; `Segunda_Via_AVista_ComAcessorio`; `Segunda_Via_AVista_SemAcessorio`; `Segunda_Via_Colocado_ComAcessorio`; `Segunda_Via_Colocado_SemAcessorio`; `Segunda_Via_Cortado_ComAcessorio`; `Segunda_Via_Cortado_SemAcessorio`; `Segunda_Via_Revenda_ComAcessorio`; `Segunda_Via_Revenda_SemAcessorio`. |
| Relatórios de venda e segunda via | `Rel 15dias`; `Rel 30dias`; `Rel Colocado`; `Rel Cortado`; `Rel Revenda`; `Rel à vista`; `Relatório 15Dias`; `Relatório 15Dias sem Acessórios`; `Relatório 30Dias`; `Relatório 30Dias sem Acessórios`; `Relatório Revenda`; `Relatório Revenda sem Acessórios`; `Relatório Venda Cortado`; `Relatório Venda Cortado sem Acessório`; `Relatório Vendas Colocado`; `Relatório Vendas Colocado sem Acessório`; `Relatório À Vista`; `Relatório À Vista sem Acessórios`; `Cópia de Rel Cortado`. |
| Relatórios de Box, catálogo e cliente | `Clientes`; `Consulta Relatório Venda Box por período`; `Consulta Vidros Atacado`; `Consulta Vidros Varejo`; `Estoque Box`; `Relatório BoxCanto`; `Relatório BoxFrotal`; `Relatório Orçamento Box`; `Relatório Vidros Plano1`–`Relatório Vidros Plano6`. |
| Macros | `Box`; `Emitir Relatorio`; `Imprimir Notas`; `MacroAcrescentarAcessorio`; `Massas`; `Tarugo`. |
| Módulos VBA | `basDefaultPrinter`; `basGetPrinters`; `basIniFile`; `basOpenReport`; `basPrintTypes`; `basPrtDevMode`; `basPrtMip`; `basToken`. |

### Consultas nominais

| Família | Consultas observadas |
|---|---|
| Venda, modalidade e arquivo | `15diasform`; `30diasform`; `Consulta_15Dias`; `Consulta_30Dias`; `Consulta_avista`; `Consulta_Venda_Colocado`; `Consulta_Venda_Cortado`; `Consulta_Venda_Revenda`; `Con_15Arq`; `Con_30Arq`; `Con_AvistArq`; `Con_ColadoArq`; `ConCortadoArq`; `Con_ReseveArq`; `Con_BoxArq`; `Con_Box_Frontal`; `Con_Box_Canto`; `Con_Box_Canto`; `Con_Exclusão_Box_Frontal`; `Cons_Exclusão_Box_Canto`; `Consulta Relatório Venda Box por período`. |
| Cancelamento, exclusão e estoque | `Consulta Cancelar Venda`; `Consulta Acrescimo Venda Cancelada`; `Consulta Estoque Box Atualizado`; `ConsultaAtualizar QTD Estoque M_Box`; `Consulta Excluir Tabela Venda Cancelada`; `Consulta Exclusão_15dias`; `Consulta Exclusão_30dias`; `Consulta Exclusão_àvista`; `Consulta Exclusão_colocado`; `Consulta_Exclusão_cortado`; `Consulta_Exclusão_Revenda`; `Consulta Exclusão_tempBox`. |
| Catálogo, cadastro e composição | `Consulta Vidros`; `Consulta_Kit_Canto`; `ConAtualizarVidroRevenda`; `ConsultaAcrescentarVenda`; `ConsultaAcrescentarAcessorio2`; `ConsultaAcrescentarAcessorio3`; `ConsultaExcluirAcessorio2`; `ConsultaExcluirAcessorio3`; `Consulta_Frontal_Box`; `Consulta_Canto_Box`. |
| Consultas auxiliares de controles e relatórios | `~sq_cFormulário Revenda~sq_cCódigoDoVidro`; `~sq_cFormulário Revenda~sq_cCódigo do Cliente`; `~sq_cFormulário Revenda~sq_cCombinação148`; `~sq_cFormulário Revenda~sq_cCombinação146`; `~sq_cFormulário Revenda~sq_cCombinação132`; `~sq_cform_Box_Canto~sq_cCódigoDoVidro`; `~sq_cform_Box_Canto~sq_cCódigo do Cliente`; `~sq_cFormulário Venda Box~sq_cCódigoDoVidro`; `~sq_cFormulário Venda Box~sq_cCódigo do Cliente`; `~sq_cBox_Arq~sq_cCódigoDoVidro`; `~sq_cBox_Arq~sq_cCódigo do Cliente`; `~sq_cFormulárioBox~sq_cCódigoDoVidro`; `~sq_cFormulárioBox~sq_cCódigo do Cliente`; `~sq_c15diasform~sq_cCódigoDoVidro`; `~sq_c30diasForm~sq_cCódigoDoVidro`; `~sq_fCadastro Kit_Canto`; `~sq_fCadastro Kit_Frontal`; `~sq_fClientes`; `~sq_fFormAcessorios`; `~sq_fM_Box1`; `~sq_fCadastroMassas`; `~sq_fMassas 15 dias`; `~sq_fMassas 30 dias`; `~sq_fMassas A Vista`; `~sq_fMassas Colocado`; `~sq_fMassas Cortado`; `~sq_fMassas Revenda`; `~sq_fTarugo`; `~sq_fVidros_15dias`; `~sq_fVidros_30dias`; `~sq_fVidros_avista`; `~sq_fVidros_Colocado`; `~sq_fVidros_Cortado`; `~sq_fVidros_Revenda`; `~sq_fVidros_Revenda subformulário`; `~sq_fVidros_Revenda subformulário1`; `~sq_fVidros_Revenda subformulário2`; `~sq_fSubFormAtualizaPlano6`; `~sq_rClientes`; `~sq_rEstoque Box`; `~sq_rRelatório Vidros Plano1`; `~sq_dRel Revenda~sq_dCódigoDoVidro`; `~sq_dConsulta Relatório Venda Box por período~sq_dCódigoDoVidro`; `~sq_dCópia de Rel Cortado~sq_dCódigoDoVidro`; `~sq_cFormulárioAtualizaPlano1~sq_cSubFormAtualizaPlano1`; `~sq_cFormulárioAtualizaPlano2~sq_cSubFormAtualizaPlano2`; `~sq_cFormulárioAtualizaPlano3~sq_cSubFormAtualizaPlano3`; `~sq_cFormulárioAtualizaPlano4~sq_cSubFormAtualizaPlano4`; `~sq_cFormulárioAtualizaPlano5~sq_cSubFormAtualizaPlano5`; `~sq_cFormulárioAtualizaPlano6~sq_cSubFormAtualizaPlano6`. |

### Eventos e chamadas de comportamento recuperados

| Categoria | Evidência nominal | Papel observável |
|---|---|---|
| Eventos de campo | `Código_do_Cliente_AfterUpdate`; `CódigoDoVidro_AfterUpdate`; `LarguraDoVidro_AfterUpdate`; `Combinação13_AfterUpdate`; `Deb_AfterUpdate`. | Atualizam seleção, cálculos ou indicador de pendência durante a edição. |
| Eventos de formulário | `Form_Open`; `Form_Timer`; `Form_Close`; `Click`; `MouseDown`; `GotFocus`; `LostFocus`; `KeyPress`; `KeyUp`. | Iniciam telas, mantêm relógio visual, respondem à interação e disparam lógica de interface. |
| Chamadas VBA | `DoCmd`; `CurrentDb`; `OpenRecordset`; `AddNew`; `MoveFirst`; `MoveNext`; `Update`; `MsgBox`; `OpenForm`; `OpenReport`; `RunCommand`; `acCmdSaveRecord`; `acCmdDeleteRecord`; `acCmdFind`; `acCmdSelectRecord`. | Confirmam que criação, atualização, exclusão, navegação, impressão e mensagens não residem somente nas consultas. |

> **Limite técnico explícito:** `mdb-tools` permite inventariar os objetos e SQL armazenado, mas não recupera de modo confiável o corpo integral de todo procedimento VBA compilado. Portanto, a matriz abaixo é completa para regras que possuem fonte SQL, campos e identificadores de eventos observáveis; a equivalência de cada linha de VBA somente pode ser afirmada após exportação do projeto VBA em um Access/ACE compatível.

## Anexo B — Matriz regra a regra MDB → Vidrix

| ID | Regra/Evento legado e origem | Destino atual no Vidrix | Paridade | Lacuna ou ação necessária |
|---|---|---|---|---|
| R01 | Metragem: `([AlturaVenda]/100) × ([LarguraVenda]/100) × [Quantidade]` em `Consulta_Venda_Revenda`, `Consulta_Venda_Cortado`, `Consulta_Venda_Colocado` e consultas de modalidade. | `client/src/pages/Quotes.tsx`; `server/routers/quotes.ts`; `server/routers/orders.ts`; campos `width`, `height`, `area` de itens. | **Parcial e bloqueada** | A fórmula numérica coincide se a entrada for cm; a interface informa mm. Definir unidade e cobrir exemplos conhecidos. |
| R02 | Conversão de corte para venda: junções `Alturas.AlturaCorte`, `Alturas.AlturaVenda`, `Larguras.LarguraCorte`, `Larguras.LarguraVenda`; tabelas `Larguras`/`Alturas`. | Produto e item possuem dimensões livres, sem tabelas de conversão. | **Ausente** | Modelar tabela de regras de corte e separação entre medida solicitada, corte e faturamento. |
| R03 | Preço do vidro: área × `ValorDoVidro15d/30d/Vista/Cort/Col/Rev` × quantidade. | `unitPrice` único por item/produto em `quotes` e `orders`. | **Ausente** | Criar modalidade comercial, vigência e preço por m². |
| R04 | Modalidades À Vista, 15 Dias, 30 Dias, Revenda, Colocado e Cortado possuem consultas/formulários/relatórios próprios. | Não há modalidade em `products`, `quotes`, `orders` ou UI. | **Ausente** | Criar enum/modalidade de venda e regra de preço associada. |
| R05 | Moldura: `((AlturaVenda × 2) + (LarguraVenda × 2)) × Quantidade` em consultas de venda. | Sem campo ou calculadora de moldura. | **Ausente** | Criar componente parametrizado de perímetro e sua unidade/preço. |
| R06 | Acessórios em até três slots, com consultas de inclusão/exclusão e campos de código, descrição e preço. | Nenhuma entidade `quoteItemComponent`/`orderItemComponent`; apenas um item de produto. | **Ausente** | Normalizar componentes e suportar múltiplos acessórios, evitando replicar o limite rígido de três. |
| R07 | Massa por modalidade, com `Peso` e `ValorMassa` em seis cadastros de massa. | Sem entidade de massa, peso ou regra de composição. | **Ausente** | Modelar fórmula de massa após homologação da regra de peso. |
| R08 | Tarugo com `CódigoTarugo` e `Valor_Tarugo`, ligado à venda/medida. | Sem entidade, preço ou cálculo de tarugo. | **Ausente** | Modelar tarugo como componente de regra, não como texto livre. |
| R09 | Total composto: vidro, acessórios, massa, tarugo, moldura e fórmulas de controles como `=Sum([Totais])`. | `totalPrice = area × unitPrice` agregado por itens. | **Parcial** | Centralizar motor de cálculo e armazenar memória de cálculo/auditoria por item. |
| R10 | Desconto: `TotalComDesconto` em Box e no fluxo de venda. | Sem campo de desconto no cabeçalho/item de orçamento e pedido. | **Ausente** | Criar desconto autorizado, justificativa e total líquido. |
| R11 | Pendência: `Clientes.ValorDaPendência`; indicador `IIf([valordapendência]=0,"N","S")`; evento `Deb_AfterUpdate`. | Cliente não tem saldo financeiro; não há cobrança/limite. | **Ausente** | Criar conta corrente/pendência e política de aprovação. |
| R12 | Cancelamento: `Consulta Cancelar Venda` seleciona `BoxFrontalArq` por código de venda; histórico de venda cancelada é consultado. | `orders.updateStatus` permite `cancelado`; `orders.delete` remove registros. | **Parcial e arriscada** | Cancelamento deve preservar evento e impedir exclusão física de pedido operacional. |
| R13 | Estorno Box: `Consulta Estoque Box Atualizado` calcula `estoque + quantidade` a partir de venda cancelada; `ConsultaAtualizar QTD Estoque M_Box`. | Cancelamento cria entrada, mas exclusão não estorna; regras de origem diferem entre pedido manual e convertido. | **Parcial e arriscada** | Usar movimentos idempotentes e transacionais, com referência única a pedido/item. |
| R14 | Venda para arquivo por modalidade e período; consultas `Con_*Arq` e filtros em `frmMenuPrint.d_ini/d_final`. | Estados no Kanban e relatório de pedidos entregues; sem arquivo por modalidade. | **Parcial** | Preservar histórico por evento/modalidade e ampliar filtros de período. |
| R15 | Box Frontal: área `altura × largura`, preço `quantidade × ValorDoVidro15d`, moldura e `TotalComDesconto`. | Nenhuma página, router, tabela ou regra de Box. | **Ausente** | Módulo especializado de Box Frontal. |
| R16 | Box Canto: área `altura × (largura1 + largura2) × quantidade`, medidas de dois lados e tabela `Larguras2 Box`. | Nenhuma página, router, tabela ou regra de Box. | **Ausente** | Módulo especializado de Box Canto, com duas larguras e componentes. |
| R17 | Kits: `Kit_Canto` e `KIt_Fontal`, formulários e consultas de catálogo. | Produto simples sem composição de kit. | **Ausente** | Criar estrutura de kit/BOM e precificação agregada. |
| R18 | Atualização de plano de preço: formulários e subformulários 1–6, `ConAtualizarVidroRevenda`. | Produto tem `unitPrice` editável sem modalidade/vigência/histórico. | **Parcial** | Implementar listas de preço versionadas e autorização de alteração. |
| R19 | Segunda via e impressão: 33 relatórios, 8 módulos de impressora e `OpenReport`. | PDF apenas para orçamento no cliente; relatórios CSV simples. | **Parcial** | Criar documentos de pedido/segunda via, modelos por modalidade e trilha de emissão. |
| R20 | Relatórios por modalidade, período, Box, catálogo e acessórios. | `reportsRouter` entrega receita, comissão fixa, estoque, orçamentos e movimentos. | **Parcial** | Implementar relatórios por modalidade, pendência, cancelados e produção. |
| R21 | Eventos `AfterUpdate`, `LostFocus`, `Click`, `Open`, `Timer` distribuem cálculo e navegação na interface. | React concentra interações no componente e tRPC no servidor. | **Arquiteturalmente diferente** | Reimplementar somente as regras de negócio centrais em serviços testáveis; não copiar efeitos visuais sem necessidade. |
| R22 | Cliente é consultado por código/nome em todas as vendas. | `clients` e UI de clientes estão presentes; orçamento/pedido referenciam cliente. | **Parcialmente equivalente** | Acrescentar campos/controles financeiros e validar importação de endereços/telefones conforme a operação. |
| R23 | Pesquisa de vidro é filtrada pela tabela de preço da modalidade. | Catálogo de produtos único, sem filtro por modalidade. | **Ausente** | O seletor deve receber modalidade e retornar somente preço/catálogo aplicável. |
| R24 | Operações Access podem usar `acCmdDeleteRecord`, `RunCommand` e macros de acesso. | A UI oferece exclusão de produto, orçamento e pedido. | **Parcial e arriscada** | Definir política de exclusão lógica e auditoria para objetos comerciais. |

Esta matriz transforma o legado em especificação de negócio, não em instrução para copiar a arquitetura Access. Para a próxima etapa, a prioridade é corrigir R01, R12 e R13 antes de qualquer venda real e homologar R03–R11 com a operação antes de desenvolver os módulos de composição e Box.

## Referências

[1]: `Vidracaria2026pdv.mdb` — fonte legada fornecida para migração.
[2]: `pasted_content.txt` — levantamento técnico fornecido pelo utilizador, incluindo formulários, relatórios, VBA e fórmulas.
[3]: `server/routers/quotes.ts`, `server/routers/orders.ts`, `server/routers/stockMovements.ts`, `server/routers/reports.ts`, `drizzle/schema.ts`, `shared/schemas.ts` e telas do Vidrix — implementação atual analisada estaticamente.
