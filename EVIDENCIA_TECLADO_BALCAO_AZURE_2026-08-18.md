# Evidência de teclado e código de produto — Balcão Azure

## Ambiente e salvaguardas

A validação foi executada em `https://vidrix-erp-final.azurewebsites.net/counter-sale`, em sessão autenticada. Nenhum orçamento ou venda foi finalizado durante este roteiro.

## Preenchimento pelo código

| Ação | Resultado observado |
| --- | --- |
| Digitação de um código de produto existente no campo **Código** | O valor foi aceito pelo combobox do Balcão |
| Pressionamento de **Enter** | O seletor **Produto** foi preenchido automaticamente |
| Campos comerciais | O preço por m² e o total estimado foram recalculados e exibidos |
| Lista de códigos | A interface apresentou códigos legados `KC-*` e `KF-*`, além de códigos `PRD-*` do catálogo importado |

> O preenchimento automático foi validado visualmente sem persistir uma transação comercial.

## Próxima evidência

| Ação | Resultado observado |
| --- | --- |
| **Enter** no campo Preço/m² | Abriu o diálogo **Próximo passo do atendimento** |
| Foco inicial do diálogo | Ação **Finalizar atendimento** |
| **←** no diálogo | Foco transferido visualmente para **Adicionar novo produto** |

> A alternância horizontal por seta foi confirmada visualmente no diálogo publicado. Ainda será confirmada a direção inversa e a transição ao seletor final, sempre sem finalizar uma operação comercial.

## Achado de reteste

No reteste imediato, o envio de **→** não transferiu o contorno de foco de **Adicionar novo produto** para **Finalizar atendimento**. A lógica auxiliar estava coberta apenas de forma unitária; a verificação visual identificou a necessidade de reforçar o foco no componente. A operação comercial permaneceu aberta e não foi persistida.

## Reteste após correção publicada

A versão publicada foi recarregada após a correção que aplica foco imperativo ao botão de destino. O diálogo voltou a abrir por **Enter** no preço, com a ação **Finalizar atendimento** destacada. A seguir, será exercitada a alternância bidirecional no pacote atualizado.

| Tecla | Resultado observado na versão corrigida |
| --- | --- |
| **←** | O foco visível foi transferido de **Finalizar atendimento** para **Adicionar novo produto** |
| **→** | O foco visível retornou de **Adicionar novo produto** para **Finalizar atendimento** |

> A alternância bidirecional do diálogo foi confirmada visualmente no Azure. Nenhum atendimento foi confirmado ou persistido nesta validação.

## Evidência verificável na compilação final

A versão com o componente de decisão testado em DOM foi publicada com sucesso (resposta HTTP 200). No Balcão autenticado, **Enter** no preço abriu o diálogo com o foco inicial visível em **Finalizar atendimento**. A troca seguinte por **→** será verificada sem submeter a operação.

Na compilação final, foram enviados **←** e **→** de forma sequencial no diálogo publicado. Como a captura visual sobrepõe os marcadores técnicos aos contornos de foco, a confirmação conclusiva será feita pela ação de **Enter**: se o foco estiver em **Finalizar atendimento**, o sistema abrirá apenas o seletor de orçamento/venda, sem gravar venda, orçamento ou produto.

O Enter subsequente adicionou uma segunda linha local de vidro, o que demonstrou que o foco efetivo permaneceu em **Adicionar novo produto**. Não houve gravação de orçamento, venda, produto ou estoque. A divergência entre o teste DOM e o navegador publicado permanece aberta para diagnóstico.
