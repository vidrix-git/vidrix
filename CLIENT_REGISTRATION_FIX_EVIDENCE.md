# Evidência de Correção — Cadastro de Clientes

## Inspeção visual publicada

Na tela publicada de Clientes, após a implantação da revisão `818894de`, o formulário **Novo Cliente** passou a apresentar explicitamente os campos obrigatórios abaixo antes do envio da operação:

| Campo | Estado observado |
|---|---|
| Nome | Obrigatório e visível. |
| Tipo | Seletor visível, iniciado em Pessoa física. |
| CPF/CNPJ | Obrigatório e visível, com rótulo alterado conforme o tipo selecionado. |
| E-mail, telefone, endereço e cidade | Campos opcionais visíveis. |

Esta inspeção elimina a divergência visual que antes enviava `type` e `cpfCnpj` como indefinidos para a API. Para a validação controlada, o formulário recebeu o nome `TESTE UI - Cliente 2026-08-14`, tipo `PF` e o identificador exclusivamente de teste `TESTE-CLIENTE-20260814`; nenhum dado pessoal foi usado.

O envio pelo botão **Salvar** foi aceito no ambiente publicado, exibiu a confirmação `Cliente cadastrado com sucesso` e acrescentou a linha `TESTE UI - Cliente 2026-08-14` à tabela. A coluna Cidade mostrou `Cidade de Teste`, confirmando a persistência do campo recém-alinhado ao esquema.

Uma busca pelo nome do registro retornou somente esse cliente de teste e manteve visível sua ação de edição, comprovando que o cadastro persiste e pode ser localizado na interface.

Na edição, os campos Tipo `PF` e CPF de teste foram carregados novamente pelo formulário e a cidade foi alterada para `Cidade de Teste Atualizada`, pronta para envio controlado.

Na primeira tentativa de salvar a edição, a sessão visual foi redirecionada à tela de login. A consulta autenticada subsequente confirmou que o cliente permaneceu íntegro com a cidade original `Cidade de Teste`; assim, nenhuma alteração parcial foi gravada. A sessão administrativa foi restaurada para repetir somente esse passo controlado.

Após a restauração, a busca retornou o mesmo cliente de teste e o formulário de edição reabriu com Tipo `PF`, CPF de teste e cidade original carregados, confirmando que os campos obrigatórios permanecem disponíveis na atualização.

A segunda tentativa de salvamento fechou o formulário e exibiu `Cliente atualizado com sucesso`. Contudo, a linha filtrada ainda mostrou `Cidade de Teste` em vez de `Cidade de Teste Atualizada`; a persistência do campo de cidade na operação de atualização será confirmada pelo contrato antes de considerar essa parte validada.

A reconsulta autenticada ao router publicado confirmou o cliente de teste com `city: "Cidade de Teste Atualizada"` e data de atualização posterior ao cadastro. Portanto, o valor foi persistido corretamente; a linha capturada logo após o envio ainda refletia o resultado anterior enquanto a invalidação da consulta da tabela era processada. A regressão automatizada passou a verificar a atualização seguida de uma nova consulta, e a suíte final registrou 34 testes aprovados.

A confirmação visual final foi concluída na própria tabela publicada: após a atualização da consulta, a linha filtrada exibiu `Cidade de Teste Atualizada` junto da notificação `Cliente atualizado com sucesso`. Não foi identificada falha de persistência nem estado desatualizado permanente na lista.
