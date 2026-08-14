# Vidrix ERP - TODO Completo

## Auditoria integral de funcionamento e paridade MDB
- [x] Consolidar as evidências e os critérios de aceite para todos os módulos e fluxos comerciais
- [x] Revalidar a paridade estrutural, de dados, regras e eventos entre o MDB legado e o Vidrix
- [x] Consolidar a revalidação estrutural do MDB × Vidrix com conclusões verificáveis para dados, regras e eventos
- [x] Reexecutar e registrar a comparação atual de dados preservados, contagens e limitações operacionais
- [x] Registrar no relatório as contagens atuais, a linha de base e as limitações da reconciliação de produção
- [x] Confirmar a persistência no repositório da reconciliação atual antes de encerrar a evidência de dados
- [x] Registrar evidência explícita dos eventos e regras revalidados antes de encerrar a paridade
- [x] Auditar tecnicamente cadastros, orçamentos, conversão em pedidos, venda direta, estoque, compras e relatórios
- [x] Registrar evidência explícita dos eventos e regras revalidados antes de encerrar a paridade
- [x] Executar cenários controlados no ambiente publicado e registrar evidências de ponta a ponta
- [ ] Corrigir divergências críticas ou de alta prioridade identificadas pela auditoria
- [x] Produzir relatório final de auditoria com matriz de paridade, evidências, limitações e recomendações
- [x] Executar cenários controlados publicados e registrar evidências ponta a ponta para os fluxos auditados prioritários do MDB
- [ ] Fechar os achados críticos ainda abertos ou reclassificá-los formalmente como fora de escopo com justificativa aprovada
- [x] Registrar evidência item a item das regras e eventos MDB revalidados no Vidrix com rastreabilidade

## Correções críticas identificadas na auditoria
- [x] Tornar o recebimento de pedido de compra transacional e idempotente para impedir entrada duplicada de estoque
- [x] Criar teste de integração para recebimento de compra, estoque e movimento auditável
- [x] Definir e aplicar permissões por papel nos módulos operacionais, com testes de acesso não administrativo
- [x] Validar por inspeção e teste o bloqueio de reenvio no recebimento da tela de compras
- [x] Validar por inspeção e teste os rótulos amigáveis do histórico de estoque
- [x] Adicionar teste de contrato para receita por período válido, inválido e invertido
- [ ] Cobrir dashboard e relatórios gerais com testes de contrato dos indicadores e filtros

## Atendimento comercial unificado de balcão
- [x] Inspecionar e testar a tela e o endpoint unificado para orçamento e venda
- [x] Validar o início sem cliente e o vínculo obrigatório apenas no encerramento
- [x] Adicionar teste de integração para finalizar atendimento unificado como orçamento
- [x] Implementar busca real de cliente no encerramento do atendimento e validar o cadastro rápido
- [x] Adicionar teste de integração de venda com complemento vinculado a produto, totalização, baixa e movimento auditável
- [x] Confirmar que cálculo em centímetros, estoque e referências se preservam no fluxo unificado
- [x] Concluir testes de contrato e integração para orçamento e venda originados do mesmo atendimento
- [x] Limpar a busca após cadastro rápido e manter o cliente recém-criado selecionado no encerramento
- [x] Cobrir por contrato o estado de seleção retornado após cadastro rápido de cliente no balcão
- [x] Cobrir a aplicação do resultado do cadastro rápido no estado final de encerramento do balcão
- [x] Validar comportamentalmente o callback de sucesso do cadastro rápido com os setters do encerramento

## Navegação lateral por áreas de trabalho
- [x] Agrupar os módulos da barra lateral em Atendimento Comercial, Cadastros, Suprimentos e Gestão
- [x] Preservar rotas, destaque do item ativo, responsividade e acessibilidade da navegação reorganizada
- [x] Cobrir a nova taxonomia da barra lateral com teste de regressão estrutural

## Operação integral por teclado
- [x] Remover da tela de Balcão o bloco inicial Atendimento e o campo de observações, preservando Atendimento Comercial na barra lateral
- [x] Criar uma convenção reutilizável: Enter avança, Shift+Enter retorna e controles multiline preservam quebra de linha
- [x] Aplicar navegação por teclado no Balcão, incluindo itens, complementos, cliente e confirmação
- [ ] Validar e adaptar explicitamente a navegação por teclado em Clientes, Produtos, Fornecedores e Compras, incluindo modais, selects e ações de salvar ou cancelar
- [ ] Validar e adaptar explicitamente a navegação por teclado em Estoque, Relatórios, Orçamentos e Pedidos, incluindo foco, Enter, Shift+Enter e controles não textuais
- [x] Garantir foco visível, sequência previsível e ativação segura de botões por teclado
- [x] Cobrir o comportamento de teclado e a nova barra lateral com regressão automatizada
- [ ] Adicionar testes de interface e comportamento por teclado específicos para cada módulo operacional crítico
- [ ] Executar testes comportamentais de foco, Enter e Shift+Enter nos formulários e diálogos de Clientes, Produtos, Fornecedores e Compras
- [ ] Executar testes comportamentais dos filtros, botões, tabelas, Kanban e diálogos de Estoque, Relatórios, Orçamentos e Pedidos
- [x] Cobrir em DOM a infraestrutura global de Enter, Shift+Enter, textarea, select nativo e escopo de diálogo
- [x] Preservar a escolha por Enter em seletores nativos e avançar somente após a confirmação da opção

## Backend
- [x] Corrigir erros de TypeScript em todos os routers
- [x] Router: clients (list, get, create, update, delete)
- [x] Router: products (list, get, create, update, delete)
- [x] Router: suppliers (list, get, create, update, delete)
- [x] Router: quotes (list, get, getItems, create, update, delete, addItem, updateItem, deleteItem, convertToOrder)
- [x] Router: quoteItems (integrado no quotes router)
- [x] Router: orders (list, get, create, update, delete, updateStatus)
- [x] Router: orderItems (integrado no orders router)
- [x] Router: purchaseOrders (list, get, create, update, delete, receive)
- [x] Router: purchaseOrderItems (integrado no purchaseOrders router)
- [x] Router: stockMovements (list, get)
- [x] Router: dashboard (stats, faturamento por período, pedidos por status, estoque crítico, comissões)
- [x] Router: reports (faturamento, comissões, análise de estoque)
- [x] Registrar todos os routers no server/routers.ts
- [x] Atualizar server/db.ts com helpers de query

## Frontend - Estrutura
- [x] index.html com Google Fonts (Inter)
- [x] index.css com tema limpo e profissional
- [x] App.tsx com DashboardLayout e roteamento completo
- [x] DashboardLayout com sidebar (Dashboard, Orçamentos, Pedidos, Compras, Estoque, Relatórios)

## Frontend - Módulos
- [x] Dashboard com recharts (faturamento, pedidos por status, estoque crítico, comissões)
- [x] Módulo Clientes (CRUD completo)
- [x] Módulo Produtos (CRUD completo)
- [x] Módulo Fornecedores (CRUD completo)
- [x] Módulo Orçamentos (CRUD + cálculo metragem L×H/10000)
- [x] Módulo Pedidos de Venda (Kanban + conversão de orçamento)
- [x] Módulo Pedidos de Compra (CRUD + recebimento com entrada automática)
- [x] Módulo Movimentos de Estoque (histórico)
- [x] Módulo Relatórios (faturamento, comissões, estoque + export CSV)

## Azure
- [x] Dockerfile para Node 22 no Azure
- [x] GitHub Actions workflow com publish profile
- [x] .dockerignore configurado
- [x] Push para GitHub (remote github)
- [x] Substituir a necessidade de Publish Profile secret pela autenticação OIDC Azure
- [x] Usar a autenticação OIDC Azure já configurada no GitHub para publicação sem perfil de publicação
- [x] Criar uma identidade Azure de publicação limitada ao Vidrix e confiada apenas ao repositório GitHub autorizado
- [x] Atualizar os segredos OIDC do repositório e validar uma execução automatizada bem-sucedida
- [x] Atualizar o fluxo GitHub Actions para publicar o pacote CommonJS autocontido validado no Azure
- [x] Confirmar a sintaxe e o conteúdo final do fluxo GitHub Actions de empacotamento Azure

## Administração de acessos
- [x] Criar uma conta local de superadmin no Vidrix com credenciais temporárias seguras
- [x] Validar o login e as permissões administrativas da conta de superadmin em produção
- [x] Rever e documentar a implementação final do papel superadmin nos componentes de autenticação e autorização
- [x] Executar testes de regressão que cubram criação, login e autorização do superadmin
- [x] Registar evidência reproduzível de login e acesso administrativo do superadmin em produção
- [x] Documentar formalmente o esquema, JWT, autorização e criação restrita do superadmin
- [x] Adicionar teste de regressão específico para o login local de um superadmin
- [x] Deploy no Azure App Service

## Qualidade
- [x] Build sem erros

## Autenticação Local (sem Manus)
- [x] Remover dependência do Manus OAuth (OAuth routes removidas, vite-plugin removido, analytics removido, JWT local testado com admin/admin123)
- [x] Implementar login local com username/senha + JWT
- [x] Criar tabela de usuários locais (admin/password no DB)
- [x] Tela de login local (sem referência Manus)
- [x] Remover debug-collector e analytics do index.html
- [x] Redeploy no Azure
- [x] Aplicar de forma segura a coluna de senha na base de dados Azure existente e validar o login publicado
- [x] Corrigir o fallback do administrador sem senha e tornar a migração da coluna password idempotente
- [x] Cobrir a autenticação local com testes de regressão e validar o login em produção
- [x] Inicializar o esquema completo do ERP na base de dados MySQL Azure e criar o administrador padrão
- [x] Confirmar e documentar a base de dados Azure de produção correta e a inexistência de dados legados a reconciliar
- [x] Validar novamente o login publicado após registar a reconciliação da base de dados Azure
- [x] Executar uma nova validação HTTP do login publicado após o registo final de reconciliação

## Migração de dados legados
- [x] Inventariar tabelas, campos, relações e contagens do ficheiro Vidracaria2026pdv.mdb
- [x] Comparar o modelo MDB com o esquema de dados atual do Vidrix e documentar o mapeamento
- [x] Preparar e validar uma migração idempotente dos dados compatíveis para o MySQL Azure
- [x] Carregar dados legados aprovados na base Azure e validar totais no ERP
- [x] Acrescentar estruturas históricas para preservar regras de corte, pendências, rascunhos e totais sem fabricar pedidos
- [x] Criar e testar um importador MDB com modo de simulação, lotes e proteção contra duplicação
- [x] Confirmar a necessidade de cópia lógica pré-migração: não aplicável porque a base Azure inicial não tinha dados comerciais; fonte MDB, auditoria e recuperação nativa Azure foram preservadas
- [x] Adicionar uma rota administrativa autenticada para importar lotes MDB diretamente no MySQL Azure
- [x] Corrigir o empacotamento Azure para incluir um servidor autocontido sem dependências ausentes
- [x] Confirmar que não existiam dados comerciais Azure anteriores e preservar o MDB e todos os registos importados como fonte de recuperação
- [x] Validar no Azure, por consulta administrativa reproduzível, os totais finais de clientes, produtos, regras de corte e registos históricos
- [x] Registar uma verificação administrativa final que distinga a base Azure inicial dos dados introduzidos pela migração
- [x] Executar e guardar uma auditoria reproduzível de IDs e datas de criação que evidencie a inexistência de cadastros comerciais Azure anteriores

## Validação operacional com utilizadores reais
- [x] Definir os participantes, permissões e o ambiente seguro dos testes de orçamento e pedido
- [x] Preparar o roteiro de validação de orçamento, metragem, PDF, conversão em pedido e estoque
- [x] Confirmar o arquivo final do roteiro operacional salvo no repositório
- [x] Acompanhar a execução controlada dos cenários pelos utilizadores reais
- [x] Consolidar evidências, resultados e eventuais correções identificadas durante os testes

## Auditoria de paridade MDB × Vidrix
- [x] Inventariar consultas, formulários, relatórios, macros e módulos VBA relevantes do MDB
- [x] Extrair e classificar fórmulas, eventos e regras de preço, geometria, acessórios, massa, tarugo, estoque e cancelamento
- [x] Mapear cada regra legada às telas, dados e procedimentos atuais do Vidrix
- [x] Classificar a paridade funcional, as lacunas e os riscos de negócio por prioridade
- [x] Entregar um relatório completo de paridade e uma sequência de evolução recomendada
- [x] Anexar um inventário verificável, nominal e completo dos objetos relevantes do MDB
- [x] Construir uma matriz de regras e eventos do legado com origem, domínio e classificação funcional
- [x] Completar o mapa regra a regra do MDB para as telas, routers e esquema atuais do Vidrix

## Entrega técnica
- [x] Elaborar manual de implementação, operação e implantação do Vidrix com mapa comentado dos módulos centrais
- [x] Gerar pacote ZIP final do projeto e da documentação para entrega

## Correção de cadastro de clientes
- [x] Corrigir a serialização do formulário de Clientes para não enviar tipo ou documento indefinidos
- [x] Adicionar teste de contrato do cadastro e edição de clientes com campos opcionais vazios
- [x] Publicar e validar visualmente a criação de cliente no ambiente Azure
- [x] Confirmar a atualização de cidade no cliente após o aviso de sucesso; persistência validada por reconsulta autenticada
- [x] Cobrir a atualização de cidade de cliente com teste de persistência e reconsulta
- [x] Revalidar visualmente a edição de cliente no Azure, confirmando na própria tabela o valor atualizado da cidade após o salvamento
- [x] Investigar eventual estado desatualizado da lista de clientes após uma edição bem-sucedida; a invalidação concluiu normalmente

## Melhorias de experiência no cadastro de clientes
- [x] Aplicar máscaras de entrada para CPF/CNPJ, telefone e CEP
- [x] Validar os dígitos verificadores de CPF e CNPJ antes de submeter o formulário
- [x] Adicionar CEP e preenchimento automático de endereço, cidade e estado
- [x] Exibir estados visuais claros de consulta de CEP, sucesso e erro na submissão do cliente
- [x] Cobrir máscaras, validações e resposta de CEP com testes de regressão
- [x] Publicar e validar visualmente o formulário aprimorado no ambiente Azure
- [ ] Comprovar na interface a aplicação das máscaras de CPF/CNPJ, telefone e CEP
- [ ] Validar na interface o autopreenchimento por CEP e o tratamento de CEP inválido ou indisponível
- [ ] Registrar evidência explícita dos estados visuais de consulta de CEP e de sucesso ou erro ao salvar cliente

## Responsividade de modais e formulários
- [x] Corrigir o modal de itens do orçamento para evitar sobreposição e manter os campos legíveis em larguras reduzidas
- [x] Revisar e ajustar modais de Clientes, Produtos, Fornecedores e Compras que compartilham padrões de formulário
- [x] Revisar Orders.tsx e Stock.tsx para confirmar o padrão de modal ou formulário e ajustar responsividade onde necessário
- [ ] Validar visualmente os modais ajustados em desktop e em largura mobile
- [x] Cobrir os layouts de formulário com uma verificação de regressão adequada
- [ ] Publicar e validar os ajustes de responsividade no ambiente Azure

## Expansão comercial: WhatsApp, Orçamentos e Balcão
- [x] Adicionar campo de WhatsApp ao cadastro de clientes, com máscara, persistência e edição
- [x] Revisar e disponibilizar o fluxo de criação de orçamentos com itens e cálculo comercial
- [x] Confirmar a conversão idempotente de orçamento em venda/pedido e sua baixa de estoque
- [x] Criar a tela de Venda Direta (Balcão) com cliente, itens, totalização e conclusão de venda
- [x] Integrar a venda de balcão ao pedido, estoque e histórico de movimentos
- [x] Adicionar testes de regressão para WhatsApp, venda direta e efeitos de estoque
- [ ] Validar visualmente os novos fluxos em desktop e mobile
- [x] Publicar e documentar a expansão comercial no Azure
- [x] Registrar verificação de regressão específica para Pedidos após a revisão responsiva
- [x] Aplicar um contêiner responsivo ao histórico de Estoque para preservar as colunas em larguras reduzidas
- [x] Adicionar regressão estrutural específica para a responsividade da tabela de Estoque

## Complementos de qualidade da Venda Direta
- [x] Exibir estados de carregamento, erro e ausência de clientes ou produtos na tela de Venda Direta
- [x] Cobrir a persistência e edição do WhatsApp com teste de contrato de clientes
- [x] Cobrir a transação de Venda Direta com pedido entregue, baixa de estoque e movimento auditável

## Correções críticas antes da validação operacional
- [x] Formalizar centímetros como unidade comercial de largura e altura no Vidrix
- [x] Validar valores numéricos positivos e precisos nos itens de orçamento e pedido
- [x] Tornar a conversão de orçamento em pedido idempotente e transacional
- [x] Substituir exclusão operacional de pedido por cancelamento auditável com estorno único de estoque
- [x] Corrigir a consistência de baixa, estorno e consulta de movimentos de estoque
- [x] Cobrir os cenários críticos com testes unitários e de integração
- [x] Atualizar produção, validar os fluxos corrigidos e preparar o roteiro de testes reais
- [x] Inspecionar e testar a validação numérica na criação e edição de itens de pedido
- [x] Comprovar por código e teste o cancelamento auditável com estorno único de estoque
- [x] Comprovar por código e teste a consistência entre baixa, estorno e histórico de movimentos
- [x] Adicionar teste de integração de cancelamento com auditoria persistida e sem segundo estorno
- [x] Adicionar teste de integração de baixa, ajuste, remoção e cancelamento com saldo final e tipos de movimento
- [x] Adicionar teste de integração do relatório/histórico a partir de movimentos reais de pedido
- [x] Corrigir o cadastro de produto para enviar largura, altura e quantidades no formato esperado pelo contrato da API
- [x] Cobrir o cadastro de produto com teste de integração de contrato entre interface e router
- [x] Adicionar teste de integração que submeta o payload gerado pela tela de Produtos ao router de produtos e verifique a aceitação do contrato completo
- [x] Revalidar no navegador o cadastro de produto para confirmar o uso do contrato corrigido
- [x] Revalidar no navegador a edição de um produto existente, alterando um campo pela UI e confirmando a persistência visual
- [x] Salvar a evidência final da revalidação visual de cadastro e edição de produto no ambiente publicado

## Ajuste de encerramento por teclado no Balcão
- [x] Exibir uma escolha ao pressionar Enter no campo Preço do Balcão: adicionar novo produto ou finalizar atendimento
- [x] Ao escolher finalizar, mover o foco para a seção de desfecho Orçamento ou Venda sem usar o mouse
- [x] Cobrir o novo fluxo de decisão por teclado com testes de comportamento e validação visual

## Aprimoramento de foco e escolha no Balcão
- [ ] Iniciar o Balcão com foco automático no primeiro seletor de Produto disponível
- [ ] Permitir alternar entre Adicionar novo produto e Finalizar atendimento pelas setas esquerda e direita no diálogo
- [ ] Confirmar a opção destacada com Enter e preservar o foco correto após cada ação
- [ ] Cobrir foco inicial e seleção por setas com testes de comportamento e validação publicada
