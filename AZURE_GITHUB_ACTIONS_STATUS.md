# Estado da publicação GitHub Actions no Azure

## Verificação de 13 de agosto de 2026

O fluxo **Build and Deploy Vidrix ERP to Azure**, execução nº 4 do commit `b477abc`, validou com êxito as etapas de instalação, compilação e criação do pacote CommonJS autocontido. A autenticação Azure por OIDC falhou antes da publicação porque a identidade federada Azure inicialmente aceitava apenas o assunto do ramo `main`.

> `AADSTS700213: No matching federated identity record found for presented assertion subject 'repo:vidrix-git/vidrix:ref:refs/heads/release/azure-auth-fix'.`

O emissor apresentado foi `https://token.actions.githubusercontent.com` e a audiência foi `api://AzureADTokenExchange`.

## Correção aplicada

Foi criada a identidade Azure `vidrix-github-oidc-deployer`, com a função **Website Contributor** limitada exclusivamente ao recurso App Service `vidrix-erp-final`. A identidade recebeu credenciais federadas para os assuntos `repo:vidrix-git/vidrix:ref:refs/heads/main` e `repo:vidrix-git/vidrix:ref:refs/heads/release/azure-auth-fix`. Os três segredos OIDC já consumidos pelo fluxo foram atualizados no GitHub com os identificadores desta identidade e da assinatura Azure correta.

A publicação manual validada no App Service continua ativa, incluindo a conta superadmin criada nesta sessão. A próxima execução do fluxo no ramo de lançamento constitui a validação final da autenticação OIDC corrigida.
