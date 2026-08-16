# Validação publicada — código de produto no Balcão

**Ambiente:** [Vidrix ERP no Azure](https://vidrix-erp-final.azurewebsites.net/counter-sale)  
**Data:** 14 de agosto de 2026  
**Escopo:** Catálogo por código, combobox nativo e preenchimento do produto pelo teclado.

## Evidências observadas

| Verificação | Evidência no Azure | Resultado |
|---|---|---|
| Campo antes de Produto | A tela Balcão inicia pelo campo **Código**, antes do seletor **Produto**, com instrução operacional para digitar ou escolher um código. | Aprovado |
| Catálogo de códigos | Os produtos publicados exibem códigos rastreáveis: `KC-1` a `KC-9` para kits de canto, `KF-1` a `KF-25` para kits frontais e `PRD-35`/`PRD-36` para produtos anteriores sem código legado. | Aprovado |
| Preservação do MDB | Os códigos `KF` e `KC` distinguem a origem das tabelas `KIt_Fontal` e `Kit_Canto`, evitando colisão entre identificadores numéricos reiniciados no Access. | Aprovado |
| Preenchimento por Enter | Ao digitar `KF-1`, o produto **KIT FRONTAL 120MT ALM FOSCO** foi selecionado automaticamente, o preço foi preenchido e `Enter` transferiu o foco ao seletor Produto. | Aprovado |
| Segurança operacional | A validação não salvou orçamento, venda ou ajuste de estoque. | Aprovado |

> A implementação usa um combobox nativo (`input` com lista de códigos cadastrados), permitindo escolher na lista ou digitar diretamente. Produtos criados sem código informado recebem automaticamente o padrão estável `PRD-{id}`; códigos legados já existentes nunca são sobrescritos.

## Regressão associada

A validação foi precedida por **97 testes automatizados aprovados** em 31 arquivos de teste e por compilação de produção bem-sucedida. Os testes incluem normalização de código, busca determinística no Balcão, preservação de origem `KF`/`KC` e geração do fallback `PRD-{id}`.
