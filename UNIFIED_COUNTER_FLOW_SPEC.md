# Especificação — Atendimento Comercial Unificado de Balcão

**Data:** 14 de agosto de 2026  
**Referência funcional:** formulário legado “Revenda / VBD” enviado pela operação.

## Decisão de fluxo

O Vidrix passará a tratar **orçamento e venda como dois desfechos do mesmo atendimento**, e não como telas de entrada distintas. O atendimento começa pela composição dos itens, suas medidas e complementos; somente no encerramento o operador define se aquele atendimento será gravado como **orçamento** ou confirmado como **venda**.

> O cliente não bloqueia o início do atendimento. A identificação é resolvida no encerramento, preservando o atendimento rápido de balcão e a rastreabilidade comercial.

| Momento | Comportamento definido | Regra de segurança |
|---|---|---|
| Início | Abrir novo atendimento sem cliente e adicionar itens. | Nenhum registro comercial definitivo é criado antes do encerramento. |
| Composição | Informar produto/vidro, quantidade, largura e altura em centímetros, preço por m² e complementos. | Medidas, quantidade e valores passam pela mesma validação comercial central. |
| Totalização | Mostrar subtotal de vidro, subtotais de complementos e total geral em tempo real. | O backend recalcula os valores recebidos; o cliente não é fonte de verdade. |
| Encerramento como orçamento | Abrir escolha de cliente cadastrado ou cadastro rápido; persistir o orçamento vinculado ao cliente. | Não converte nem movimenta estoque. |
| Encerramento como venda | Exigir cliente cadastrado ou criado no momento; criar pedido entregue e aplicar a baixa de estoque. | Transação única, bloqueio de estoque e movimento auditável. |
| Consulta posterior | Manter histórico de orçamentos e pedidos como visão de gestão, sem duas telas de entrada concorrentes. | O menu priorizará “Atendimento de Balcão”; as listagens permanecem disponíveis como histórico. |

## Composição inspirada no legado

O formulário de referência reúne linhas de vidro e três grupos comerciais complementares: acessórios, massa e tarugo, além de moldura e montagem. A evolução não reproduzirá campos fixos por linha; utilizará uma composição extensível para que cada elemento seja identificável, totalizável e auditável.

| Grupo legado | Representação planejada no atendimento | Efeito de estoque previsto |
|---|---|---|
| Vidro | Item dimensional com produto, largura, altura, quantidade e preço por m². | Baixa por quantidade no momento da venda. |
| Acessório | Item complementar com descrição, valor unitário e quantidade. | Baixa quando associado a produto estocável; serviço permanece sem estoque. |
| Massa | Item complementar medido por peso, com valor total. | Baixa quando associado a produto estocável. |
| Tarugo | Item complementar com valor unitário e quantidade. | Baixa quando associado a produto estocável. |
| Moldura | Item complementar dimensional ou por medida total. | Regra dependerá do catálogo/produto vinculado. |
| Montagem | Serviço com valor informado. | Não movimenta estoque. |
| Pendência | Indicador financeiro legado. | Permanece fora da primeira entrega, pois o Vidrix não possui módulo financeiro ou conta-corrente. |

## Critérios de aceite

O atendimento unificado estará pronto para aceite quando o operador conseguir iniciar sem cliente, montar uma venda com itens dimensionais e complementares, enxergar os totais por grupo, escolher **Orçamento** ou **Venda** ao encerrar, localizar ou cadastrar um cliente no mesmo modal e receber o resultado persistido. A venda deve criar pedido entregue, itens e movimentos de estoque sem duplicação; o orçamento deve criar somente o orçamento e seus itens.

Os componentes de massa, tarugo, acessórios, moldura e montagem deverão aparecer no atendimento com subtotal identificável. Os que possuem produto associado devem seguir a mesma transação de estoque; serviços e encargos sem produto associado não podem criar movimento fictício.

## Limites assumidos nesta evolução

O formulário legado contém regras de box, medidas especiais, modalidades de preço, pendência financeira e produção que ainda não existem como domínio operacional no Vidrix. Esta entrega recupera o padrão de atendimento e a composição básica, mas não deve declarar equivalência financeira ou de produção total até que esses domínios tenham modelo, regras e validação próprios.

## Modelo de dados e contrato de finalização

Os itens dimensionais continuarão nos registros já existentes de `quoteItems` e `orderItems`, garantindo compatibilidade com cálculo de área, PDF e estoque. Os itens complementares serão persistidos em uma nova entidade `commercialExtras`, associada a **um orçamento ou um pedido**, com categoria, descrição, unidade, quantidade, preço unitário, subtotal e produto estocável opcional. Isso evita criar movimentos de estoque para montagem e outros serviços, enquanto permite rastrear acessórios quando houver vínculo com catálogo.

| Campo de `commercialExtras` | Função |
|---|---|
| `quoteId` ou `orderId` | Identifica o desfecho final do atendimento; apenas uma referência será gravada por linha. |
| `kind` | Distingue `acessorio`, `massa`, `tarugo`, `moldura` e `montagem`. |
| `description`, `unit`, `quantity`, `unitPrice`, `subtotal` | Preserva a composição e permite totalização por grupo. |
| `productId` opcional | Habilita baixa de estoque somente quando o complemento estiver realmente cadastrado como produto. |
| `notes` | Conserva observações operacionais sem alterar os campos estruturados. |

O novo contrato de backend, `counterSales.finalize`, receberá um `outcome` (`quote` ou `sale`), itens dimensionais, complementos e um `clientId`. O cliente será opcional enquanto o formulário está sendo preenchido, mas obrigatório no comando de finalização dos dois desfechos: o modal final oferece busca ou cadastro rápido. Para venda, o backend criará um pedido `entregue`; para orçamento, criará um orçamento `rascunho`. Em ambos os casos o valor será recalculado pelo servidor. Somente a venda fará baixa transacional de estoque.

O inventário atual utiliza quantidade inteira. Assim, nesta entrega, um complemento com produto associado só poderá movimentar estoque quando sua quantidade for inteira; massa, medida de moldura e serviços sem produto associado continuarão registrados e totalizados, mas não produzirão uma baixa artificial. A evolução para unidades fracionadas de estoque será tratada como melhoria separada, pois impacta produtos, compras, movimentos e relatórios existentes.
