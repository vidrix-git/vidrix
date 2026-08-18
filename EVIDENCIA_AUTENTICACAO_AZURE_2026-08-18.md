# Evidência de autenticação publicada — 2026-08-18

## Objetivo

Validar, no ambiente publicado Azure, o fluxo de autenticação local após a inclusão do fallback de sessão por cabeçalho `Authorization` para navegadores que não preservem o cookie seguro.

## Preparação registrada

| Item | Resultado |
| --- | --- |
| URL aberta | `https://vidrix-erp-final.azurewebsites.net/login` |
| Página de acesso | Carregada com campos de utilizador, senha e ação **Entrar** |
| Pacote publicado | Confirmada a presença do fallback JWT no JavaScript entregue pelo Azure |
| Credenciais, tokens e hashes | Não registrados neste documento |

## Resultado final

| Verificação | Resultado |
| --- | --- |
| Submissão da tela `/login` | Aceita no ambiente publicado |
| Redirecionamento | Concluído para a rota raiz protegida (`/`) |
| Sessão autenticada | Confirmada pela saudação ao administrador e pelo menu completo do ERP |
| Elementos protegidos disponíveis | Dashboard, Balcão, Orçamentos, Pedidos, Clientes, Produtos, Fornecedores, Compras, Estoque e Relatórios |
| Exposição de segredo | Nenhuma; não foram registrados senha, token, cookie ou hash |

> A validação confirmou o fluxo completo de login local no navegador após a publicação da correção. O fallback JWT permanece disponível para contextos em que o cookie seguro não seja preservado.
