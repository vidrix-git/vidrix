# Integração de CEP — ViaCEP

O formulário de clientes consultará o serviço público ViaCEP somente após normalizar o CEP para **oito dígitos numéricos**. A consulta adotará o endpoint JSON `https://viacep.com.br/ws/{CEP}/json/`. CEP com formato inválido deve ser bloqueado localmente; CEP inexistente retorna a propriedade `erro: true`. O endereço retornado pode incluir `logradouro`, `bairro`, `localidade` e `uf`; estes valores serão usados apenas para facilitar o preenchimento do formulário, permanecendo editáveis pelo operador.

Fonte: [ViaCEP — documentação pública](https://viacep.com.br/), consultada em 14 de agosto de 2026.
