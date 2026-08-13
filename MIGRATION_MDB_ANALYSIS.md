# Análise de migração — Vidracaria2026pdv.mdb

## Fonte analisada

O ficheiro legado `Vidracaria2026pdv.mdb` é uma base Microsoft Access com aproximadamente 51 MB. A estrutura foi extraída com uma ferramenta de leitura Access, sem qualquer alteração do ficheiro de origem.

## Estrutura identificada

| Grupo funcional | Tabelas MDB | Destino proposto no Vidrix | Situação inicial |
|---|---|---|---|
| Catálogo de materiais | `Larguras`, `Alturas`, `Massa Peso` | `products` | Requer consolidação: as tabelas trazem medidas, mas não uma ficha completa de produto. |
| Itens e acessórios | `AcessoriosRevendaCadastro`, `KIt_Fontal`, `Kit_Canto` | `products` ou anotações de pedido | Requer classificação e deduplicação. |
| Pedidos e produção | `A_vista`, `15 Dias`, `30 Dias`, `Revenda`, `Cortado`, `Colocado`, `Box Frontal`, `Box canto`, `TempBox`, `Venda` | `orders` e `orderItems` | Mapeamento possível, mas as tabelas não apresentam chaves primárias uniformes nem todas têm data de venda. |
| Regras de preço | `tabelapercentual` | Configuração comercial | Não há tabela equivalente; deve ser preservada como nota de migração ou configurada manualmente. |
| Registos operacionais | `Erros ao colar` | Fora do modelo operacional atual | Contém pendências e observações; deve ser tratado como dados históricos, não como cliente ou pedido sem revisão. |

## Compatibilidade com o Vidrix

O modelo Vidrix possui entidades normalizadas para `clients`, `products`, `quotes`, `quoteItems`, `orders`, `orderItems`, `suppliers` e movimentos de estoque. O MDB está centrado em linhas de produção e medidas, com referências a cliente e vidro por código, mas sem uma tabela de clientes ou de produtos completa entre as tabelas visíveis.

Por esse motivo, a migração deve preservar referências legadas, converter medidas em `width`, `height` e `squareMeters`, e criar pedidos apenas quando houver dados suficientes para identificar um cliente e um produto de forma segura. Nenhuma linha será carregada automaticamente como venda final sem essas validações.

## Volume e qualidade dos dados

| Conteúdo legado | Registos | Avaliação para migração |
|---|---:|---|
| Registo de pendências de clientes (`Erros ao colar`) | 54 | Pode originar clientes, mas somente 19 linhas têm nome completo e 20 têm CPF/CNPJ. Os restantes exigem um identificador legado para não inventar dados. |
| Catálogo de kits frontais (`KIt_Fontal`) | 25 | Migração direta para produtos, preservando descrição e preço. |
| Catálogo de kits de canto (`Kit_Canto`) | 9 | Migração direta para produtos, preservando descrição e preço. |
| Tabela de vendas (`Venda`) | 31 linhas, 7 códigos distintos | Não pode originar pedidos completos: não possui cliente, produto, quantidade ou data. Deve ser preservada como histórico de totais. |
| Rascunho operacional de box (`TempBox`) | 81 | Tem medidas, quantidade e códigos de cliente/vidro, mas não tem data, preço nem ligação confiável a uma venda. Deve entrar como registo histórico/revisão, não como pedido confirmado. |
| Regras de largura | 50 001 + 9 071 + 9 071 | São matrizes de conversão de corte para venda; não correspondem a produtos individuais. |
| Regras de altura | 50 001 | É uma matriz de conversão de corte para venda; não corresponde a produtos individuais. |
| Regras percentuais | 3 | Valores entre 10% e 30%; não há entidade equivalente no modelo atual. |

As tabelas `A_vista`, `15 Dias`, `30 Dias`, `Revenda`, `Cortado`, `Colocado`, `Box Frontal`, `Box canto`, `AcessoriosRevendaCadastro` e `Massa Peso` estão presentes no ficheiro, mas não possuem linhas. Portanto, não há histórico completo de propostas, pedidos, estoque ou produção nessas tabelas para importar.

## Mapeamento recomendado

| Origem MDB | Campo(s) relevante(s) | Destino Vidrix | Tratamento |
|---|---|---|---|
| `KIt_Fontal` e `Kit_Canto` | `Medida`, `Preço` | `products` | Criar 34 produtos do tipo `Kit`, com largura e altura neutras e preço unitário legado. |
| `Erros ao colar` | Código, apelido/nome, documento, endereço e telefones | `clients` | Criar clientes apenas com dados disponíveis; usar a chave legada quando o documento estiver ausente e guardar pendência em registo histórico. |
| `Venda` | Código da venda, total com desconto | Registo histórico de migração | Preservar separadamente, pois o modelo atual não permite associar com segurança os totais a clientes e itens. |
| `TempBox` | Códigos, medidas, quantidade e flags | Registo histórico de migração | Calcular área quando largura e altura forem válidas e preservar a linha para revisão comercial. |
| `Larguras*` e `Alturas` | Medida de corte e medida de venda | Tabelas de regras de corte a acrescentar | Criar tabelas próprias de conversão; não poluir `products` com mais de 100 mil linhas de regras. |
| `tabelapercentual` | Percentual | Configuração de preços histórica | Preservar em configuração/memória de migração até a regra comercial ser definida. |

> **Conclusão:** o Vidrix constitui uma nova versão funcional do sistema legado, com clientes, produtos, orçamentos, pedidos, compras e estoque normalizados. A equivalência não é de uma cópia literal: o MDB contém sobretudo tabelas auxiliares de cálculo e um rascunho operacional, enquanto o Vidrix usa entidades comerciais completas. Para preservar todas as informações sem criar pedidos artificiais, a migração deve combinar importação direta de produtos e clientes com um arquivo histórico pesquisável para as linhas que não possuem relações suficientes.

## Execução no Azure — 13 de agosto de 2026

A importação foi executada no App Service publicado, por uma rota administrativa protegida por autenticação de administrador e em lotes de 200 linhas. O importador é idempotente: pode ser retomado sem duplicar clientes, produtos ou registos arquivados. Todas as linhas recebidas também são preservadas em `legacy_import_records`, com a tabela de origem, uma assinatura de conteúdo e o conteúdo original serializado.

| Indicador validado | Resultado |
|---|---:|
| Linhas lidas do MDB | 118 347 |
| Registos históricos únicos arquivados no Azure | 118 295 |
| Regras de corte importadas | 118 144 |
| Clientes migrados | 54 |
| Produtos de kit migrados | 34 |
| Login e interface de produtos/clientes | Validados no ambiente publicado |

A diferença entre linhas lidas e arquivos únicos corresponde a linhas idênticas no próprio MDB; nenhuma informação distinta foi descartada. As tabelas `Venda`, `TempBox`, `tabelapercentual` e as tabelas sem equivalência comercial completa foram arquivadas integralmente, mas **não** foram convertidas em pedidos, vendas, estoques ou movimentos artificiais. Essa decisão preserva o histórico original sem alterar indicadores comerciais com dados sem cliente, item, quantidade e data inequívocos.

### Reconciliação final reproduzível

Após a carga, a verificação administrativa autenticada `scripts/verify-legacy-azure-counts.mjs` consultou separadamente o arquivo legado, as regras de corte, os clientes e os produtos do ambiente Azure. A execução devolveu **118 295** registros arquivados, **118 144** regras de corte, **54** clientes e **34** produtos. Os clientes foram criados entre `2026-08-13T13:40:59Z` e `2026-08-13T13:41:03Z`; os produtos foram criados entre `2026-08-13T14:09:21Z` e `2026-08-13T14:09:31Z`. Estas janelas correspondem às execuções de importação e recuperação idempotente registradas durante a carga.

### Estado inicial e proteção de dados

A verificação do servidor MySQL antes da primeira carga encontrou apenas a base de aplicação `flexibleserverdb` e os esquemas de sistema. A primeira conexão do App Service ainda retornava ausência da tabela `users`, e o bootstrap idempotente do Vidrix criou a estrutura inicial posteriormente. Isto comprova que não havia tabelas ERP ou registros comerciais do Vidrix nesse banco antes da inicialização; por esse motivo, não foi necessário reconciliar cadastros comerciais anteriores.

Como auditoria equivalente reproduzível após a carga, a mesma consulta administrativa confirmou que os IDs de clientes formam o intervalo contíguo **1–54** e os IDs de produtos formam o intervalo contíguo **1–34**, sem lacunas ou identificadores anteriores. Associados às janelas de criação observadas na seção anterior, esses intervalos sustentam que os cadastros comerciais presentes foram inseridos pelas execuções da migração, e não são cadastros comerciais Azure anteriores.

> **Limite de recuperação:** não havia uma cópia lógica SQL independente antes da primeira escrita. Como a base estava vazia do ponto de vista comercial, o risco de sobrescrever operação existente era inexistente. O ficheiro MDB original permanece como fonte de referência e cada registro distinto foi preservado em `legacy_import_records`, com tabela de origem, assinatura de conteúdo e conteúdo serializado. Portanto, o legado pode ser reprocessado de forma idempotente se for necessária uma recuperação ou uma nova regra de mapeamento.
