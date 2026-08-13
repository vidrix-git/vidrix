# Implementação de Superadmin

## Finalidade

O Vidrix usa autenticação local baseada em palavra-passe PBKDF2 e tokens JWT. O papel **superadmin** foi acrescentado para permitir uma conta administrativa dedicada, sem criar qualquer caminho de registo público com privilégios elevados.

## Modelo de autorização

| Camada | Implementação | Regra aplicada |
|---|---|---|
| Persistência | `users.role` | Aceita apenas `user`, `admin` e `superadmin`. |
| Evolução de esquema | Migração Drizzle e bootstrap MySQL | Atualiza bases existentes de forma não destrutiva para reconhecer `superadmin`. |
| Sessão | JWT assinado | O token inclui o papel persistido do utilizador autenticado. |
| Proteção de rotas | `adminProcedure` | Autoriza apenas os papéis `admin` e `superadmin`. |
| Criação de conta | `auth.createSuperadmin` | Exige uma sessão administrativa e força o novo papel para `superadmin`. |
| Registo público | `auth.register` | Aceita apenas utilizadores comuns; só a primeira conta de uma instalação vazia pode ser `admin`. |

> A palavra-passe nunca é persistida em texto simples. A função de criação aplica PBKDF2 com sal aleatório e a validação compara o hash de forma segura.

## Evidência de implementação

O enum de papéis e a coluna de palavra-passe estão definidos no esquema Drizzle.[1] A atualização da base MySQL existente é formalizada pela migração SQL.[2] O login local assina o papel autenticado no JWT e reconhece tanto `admin` quanto `superadmin` como papéis privilegiados.[3] A proteção tRPC aceita somente esses dois papéis para procedimentos administrativos.[4] Por fim, o procedimento `createSuperadmin` exige essa proteção e não permite que o chamador escolha outro papel.[5]

## Validação

Os testes automatizados verificam que utilizadores comuns não podem criar superadmins e que administradores e superadmins podem executar o procedimento com o papel forçado.[6] Um teste adicional valida que a autenticação local de um registo com papel `superadmin` emite uma sessão contendo esse mesmo papel.[7] Em produção, a conta superadmin autenticou com HTTP 200 e acessou a rota administrativa de estado da migração também com HTTP 200, conforme o registo de publicação Azure.[8]

## Operação recomendada

A conta criada nesta entrega usa o nome de utilizador `superadmin` e recebeu uma palavra-passe temporária forte. Essa palavra-passe deve ser alterada pelo responsável do sistema no primeiro acesso. O fluxo público não deve ser usado para criar contas administrativas; novos superadmins devem ser criados exclusivamente por uma sessão `admin` ou `superadmin` autenticada.

## Referências

[1]: ./drizzle/schema.ts
[2]: ./drizzle/0004_damp_wong.sql
[3]: ./server/local-auth.ts
[4]: ./server/_core/trpc.ts
[5]: ./server/routers.ts
[6]: ./server/superadmin.test.ts
[7]: ./server/local-auth.login.test.ts
[8]: ./AZURE_GITHUB_ACTIONS_STATUS.md
