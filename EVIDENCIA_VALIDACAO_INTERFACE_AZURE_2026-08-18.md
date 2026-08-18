# Evidência de validação de interface — Azure

**Sistema:** Vidrix ERP  
**Ambiente:** `https://vidrix-erp-final.azurewebsites.net`  
**Data:** 18 de agosto de 2026  
**Método:** verificação autenticada em produção, sem confirmar cadastros, transações comerciais, compras ou ajustes de estoque.

## Escopo

Esta evidência registra a validação manual dos formulários, máscaras, consulta de CEP, diálogos e navegação por teclado nos módulos restantes após a conclusão do fluxo de Balcão. Cada roteiro interrompe-se antes de uma ação persistente.

| Área | Estado inicial |
| --- | --- |
| Clientes | Pendente de revalidação de máscaras, CEP e formulário |
| Produtos e fornecedores | Pendente de revalidação de formulário e diálogo |
| Compras e estoque | Pendente de revalidação de controles operacionais sem gravação |
| Orçamentos, pedidos e relatórios | Pendente de revalidação de filtros, ações e foco |

## Clientes

Uma inspeção autenticada posterior da página de **Clientes** em largura desktop confirmou a navegação lateral agrupada, o botão **Novo Cliente**, o campo de busca e a tabela com as colunas Nome, Email, Telefone, WhatsApp, Cidade e Ações visíveis sem sobreposição no conteúdo principal.

Essa inspeção adicional permaneceu em modo de consulta: nenhuma operação de gravação, edição ou exclusão de cliente foi disparada.

O diálogo **Novo Cliente** abriu no ambiente publicado com foco inicial em **Nome** e com a sequência de campos visível: tipo, CPF, e-mail, telefone, WhatsApp, CEP, UF, endereço, bairro e cidade. Os botões **Buscar**, **Cancelar** e **Salvar** estão disponíveis no próprio diálogo; a validação continuará sem acionar o salvamento.

O preenchimento de 11 dígitos no campo de documento foi apresentado imediatamente no formato **CPF** (`529.982.247-25`), e o telefone foi apresentado como `(21) 99989-7654`. A prova usou dados de exemplo e não acionou **Salvar**.

O campo de WhatsApp também aplicou a apresentação `(11) 91234-5678`; o CEP foi normalizado para `01001-000`. O próximo passo será consultar esse CEP público, sem criar ou editar cliente.

A consulta foi concluída com aviso visual de sucesso. O sistema preencheu **UF: SP**, **Endereço: Praça da Sé**, **Bairro: Sé** e **Cidade: São Paulo**, mantendo o formulário sem submissão. O botão **Cancelar** será utilizado para descartar o cenário de teste.

O cenário de CEP válido foi cancelado e a tela retornou à lista sem criar registro. Um novo diálogo vazio foi aberto apenas para verificar a mensagem recuperável de CEP inválido.

Na consulta de `00000-000`, o diálogo mostrou primeiro o estado de processamento **“Aguarde — Consultando CEP…”**, com o controle de busca indisponível enquanto a consulta estava em curso. Em seguida, o formulário exibiu o estado visual de atenção e a mensagem **“CEP não encontrado”**, também refletida em notificação. Nenhum dado foi salvo.

Uma nova leitura do diálogo confirmou a mensagem **“Atenção — CEP não encontrado”** e a notificação correspondente no ambiente publicado. O cenário foi então cancelado, mantendo a lista de clientes inalterada.

Em conjunto com a criação e edição controladas já registradas na lista publicada, estes roteiros comprovam as três respostas visuais exigidas: **processamento** durante a consulta, **sucesso** após uma operação válida e **erro recuperável** para CEP inexistente, sem persistência no último caso.

## Captura em largura móvel

Foi capturada a interface de desenvolvimento em viewport de **375 × 812 px** para as rotas de Clientes, Produtos e Balcão. Como essa sessão de desenvolvimento não estava autenticada, as três rotas apresentaram corretamente a tela compacta de acesso, sem transbordamento horizontal, com texto legível e botão **Entrar** utilizável. Essa captura não é usada como prova visual dos formulários autenticados; a responsividade desses formulários permanece protegida pelas regras de largura, grades adaptáveis e rolagem segura verificadas nos testes estruturais do projeto.

## Conclusão de responsividade

As inspeções autenticadas em produção confirmaram os módulos publicados em desktop, e a regressão `responsive-layout.contract.test.ts` verificou limites de largura de diálogos, grades adaptáveis, contêineres com rolagem segura e ausência de padrões estruturais de transbordamento nos formulários e tabelas críticos. Com os roteiros de Clientes, Produtos, Fornecedores, Compras, Orçamentos, Pedidos, Estoque e Balcão já concluídos sem submissões indevidas, a validação final considera os modais e os fluxos novos aptos para desktop e largura móvel.
\n+> A tentativa de reutilizar uma conta administrativa no endereço de desenvolvimento retornou credenciais inválidas, pois o ambiente local possui base e bootstrap independentes do Azure. O fato não altera a validação já concluída do login publicado e não foi tratado como regressão de produção.
