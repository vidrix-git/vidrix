# Implantação Azure — Vidrix ERP

## Estado validado

O App Service de produção está publicado em `https://vidrix-erp-final.azurewebsites.net` e usa o servidor Azure MySQL `vidrix-mysql-202608051030` na base de dados `flexibleserverdb`. A ligação requer TLS, por isso a variável `DATABASE_URL` do App Service foi configurada com a opção SSL do cliente MySQL.

Na validação de 12 de agosto de 2026, a listagem do servidor MySQL mostrou apenas a base de dados de aplicação padrão `flexibleserverdb`, além dos esquemas de sistema. A primeira ligação confirmou que a tabela `users` ainda não existia nessa base, o que demonstrou que não havia uma base ERP pré-existente a reconciliar no ambiente Azure.

O servidor passou a executar um bootstrap idempotente de todas as onze tabelas do ERP antes de abrir a porta HTTP. Em seguida, cria o administrador inicial quando não houver utilizadores. Esta rotina usa exclusivamente `CREATE TABLE IF NOT EXISTS` e nunca elimina, trunca ou substitui dados existentes.

## Acesso inicial

| Campo | Valor |
|---|---|
| URL | `https://vidrix-erp-final.azurewebsites.net/login` |
| Utilizador | `admin` |
| Senha inicial | `admin123` |

> Altere a senha inicial logo após o primeiro acesso operacional. A conta padrão existe apenas para permitir a entrada inicial no sistema recém-criado.

## Verificações realizadas

| Verificação | Resultado |
|---|---|
| Compilação TypeScript | Concluída sem erros |
| Testes automatizados | 6 testes aprovados |
| Implantação Azure | Concluída com sucesso |
| Login tRPC de produção | HTTP 200 com cookie JWT seguro |
| Login pela interface | Entrada no Dashboard confirmada |

