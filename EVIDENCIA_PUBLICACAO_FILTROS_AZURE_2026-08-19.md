# Evidência de Publicação — Filtros e Exclusão Segura

**Data:** 19 de agosto de 2026  
**Ambiente:** Azure App Service — `vidrix-erp-final.azurewebsites.net`  
**Ramificação:** `release/azure-auth-fix`

## Acionamento

O checkpoint `28349f1` foi enviado para a ramificação de implantação após regressão completa com **140 testes aprovados** e compilação de produção concluída. O GitHub Actions registrou a execução **Build and Deploy Vidrix ERP to Azure #31** como iniciada para esse commit.

## Escopo da publicação

A execução publica o filtro de Funcionários por nome, e-mail e nível de acesso, o estado vazio para ausência de resultados, e a confirmação visual nomeada antes da exclusão de um Tipo de Produto. A conclusão do workflow e a inspeção da versão publicada serão registradas neste arquivo.

## Resultado do workflow

O painel do GitHub Actions confirmou a conclusão bem-sucedida da execução **#31** para o commit `28349f1` na ramificação `release/azure-auth-fix`, em aproximadamente **1 minuto e 36 segundos**. A versão com as melhorias administrativas foi entregue ao Azure; a inspeção das telas autenticadas permanece como etapa final de validação publicada.

## Estado da sessão para inspeção

Após a publicação, a rota `/employees` respondeu com a tela de login, indicando que a sessão autenticada anterior não estava mais disponível no navegador de validação. O workflow de publicação foi concluído com sucesso; a inspeção visual autenticada dos controles recém-publicados deverá ocorrer após restaurar a sessão administrativa.
