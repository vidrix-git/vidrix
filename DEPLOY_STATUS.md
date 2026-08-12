# Estado do deploy Azure

Em 12 de agosto de 2026, a sessão do GitHub foi confirmada no navegador do usuário para o repositório `vidrix-git/vidrix`.

O repositório possuía dois workflows relacionados ao Azure. A versão preparada, com autenticação local JWT e comando de inicialização `node dist/azure-startup.js`, foi enviada ao branch `main` no commit `148801c` ("Deploy: autenticação local JWT e inicialização Azure"). A execução **Build and Deploy Vidrix ERP to Azure #3** falhou porque o workflow dependia do segredo `AZURE_PUBLISH_PROFILE`, que não está configurado no repositório. A investigação do workflow originalmente gerado pelo portal Azure também mostrou que suas credenciais OpenID Connect não têm uma assinatura Azure válida (erro "No subscriptions found"). Para concluir o deploy, é necessário gerar no Azure Portal um novo perfil de publicação do App Service ou corrigir a federação OpenID Connect da conta Azure.

O acesso ao Azure Portal foi confirmado com a conta `vidrix@outlook.com.br`. A lista de recursos contém o App Service `vidrix-erp-final`, no grupo de recursos `vidrix-prod-rg`, que será usado para gerar uma credencial de publicação renovada.

O App Service `vidrix-erp-final` foi aberto no portal para continuar a renovação da credencial de deploy.

Na aba **Configuração > Definições gerais**, foi identificada a opção **Credenciais de Publicação de Autenticação Básica de SCM**, atualmente desativada. O usuário autorizou a sua ativação temporária exclusivamente para obter o perfil de publicação, configurar o segredo `AZURE_PUBLISH_PROFILE` no GitHub, executar o deploy e desativá-la novamente.

Como o controlo visual do Portal não expôs os checkboxes individuais para automação direta, o Azure Cloud Shell foi aberto na sessão autenticada. O pedido de inicialização foi aceito e o terminal está a conectar; ele permitirá atualizar a política de credenciais de publicação do App Service por comando autenticado.

O Cloud Shell confirmou a sessão efémera e está disponível com Azure CLI. A área de configuração identificou a política alvo: `scm` em `Microsoft.Web/sites/basicPublishingCredentialsPolicies`, para o App Service `vidrix-erp-final` no grupo `vidrix-prod-rg`.

O portal foi recuperado após uma tentativa de interação no terminal que não atingiu o controlo do Cloud Shell. A sessão Azure permanece autenticada. A continuação será feita pelo painel de configuração ou por uma alternativa de publicação que não dependa do perfil básico, mantendo o mínimo de alterações de segurança necessário.

O App Service `vidrix-erp-final` foi novamente carregado e confirmado em execução na subscrição Azure identificada. A área **Implementação** está disponível no menu do recurso; ela será usada para verificar se o Centro de Implementação pode renovar a ligação com o GitHub sem exigir credenciais básicas de publicação.

O **Centro de Implementações** foi aberto com as opções de Implementação Contínua (CI/CD) e Implementação Manual (Push). A configuração permite selecionar uma origem de código, oferecendo uma rota nativa para restaurar a integração com o repositório `vidrix-git/vidrix` sem expor um perfil de publicação.

No Centro de Implementações, a origem **GitHub** já está selecionada e o Azure reconhece a sessão autenticada como `vidrix-git`. Restam selecionar a organização, o repositório e o ramo para que o próprio Azure renove a configuração do GitHub Actions.

O Centro de Implementações também disponibiliza **Implementação Manual (Push) > Publicar ficheiros**, com envio direto de um ficheiro ZIP para o App Service. Esta rota não requer autenticação básica de publicação nem perfis de publicação. O artefacto validado `site-azure.zip` está preparado localmente e é adequado para concluir a atualização imediatamente, mantendo o GitHub como repositório de origem.

O pacote validado foi confirmado em `/home/ubuntu/azure-deploy/site-azure.zip` (cerca de 22 MB). O painel manual está aberto, porém o componente de anexação de ficheiro do portal não é exposto como campo de envio acessível pelo controlo remoto. A próxima alternativa segura é utilizar a sessão autenticada do Azure Cloud Shell para invocar a publicação ZIP diretamente.

O Azure Cloud Shell foi aberto no rodapé do portal para a sessão autenticada. Aguardaremos o terminal ficar disponível para então enviar o artefacto e executar a publicação diretamente pela subscrição do utilizador.

O Cloud Shell confirmou ligação e recebeu o comando de publicação autenticada, composto pelo download temporário do artefacto ZIP e pelo comando `az webapp deploy` para `vidrix-prod-rg/vidrix-erp-final`. A execução está a ser verificada antes de assumir que o deploy foi concluído.

O painel remoto do Cloud Shell exibiu o comando enviado, mas ainda não apresentou saída de execução ou conclusão. Nenhum estado de publicação foi assumido sem confirmação explícita do Azure.

## Publicação direta via Azure CLI

Em 12/08/2026, uma sessão Azure CLI foi autorizada pelo proprietário através do fluxo oficial de código de dispositivo, para a subscrição `ecaa4647-592d-4fd9-9742-fe68a122c2ce` (grupo de recursos `vidrix-prod-rg`). A publicação local baseada em Kudu ficou presa depois do aquecimento, por isso foi usada a rota ARM OneDeploy com URL de artefacto, que respondeu com êxito.

O endpoint ARM aceitou o pacote atualizado em `2026-08-12T19:32:34Z` e registou a implantação como `OneDeploy`, inicialmente com estado `Receiving changes` (status `0`). O acompanhamento de conclusão está em curso antes de validar o login remoto. A aplicação pública continua acessível em `https://vidrix-erp-final.azurewebsites.net`.
