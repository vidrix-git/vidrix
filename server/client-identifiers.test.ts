import { describe, expect, it } from "vitest";
import { createClientSchema } from "../shared/schemas";
import { formatClientDocument, formatPhone, formatZipCode, isValidClientDocument } from "../shared/client-identifiers";

describe("identificadores brasileiros de clientes", () => {
  it("aplica máscaras de CPF, CNPJ, telefone e CEP sem exceder o tamanho permitido", () => {
    expect(formatClientDocument("52998224725", "PF")).toBe("529.982.247-25");
    expect(formatClientDocument("04252011000110", "PJ")).toBe("04.252.011/0001-10");
    expect(formatPhone("21999998888")).toBe("(21) 99999-8888");
    expect(formatZipCode("01001000")).toBe("01001-000");
  });

  it("aceita documentos com dígitos verificadores válidos e rejeita documentos inválidos", () => {
    expect(isValidClientDocument("529.982.247-25", "PF")).toBe(true);
    expect(isValidClientDocument("04.252.011/0001-10", "PJ")).toBe(true);
    expect(isValidClientDocument("111.111.111-11", "PF")).toBe(false);
    expect(isValidClientDocument("04.252.011/0001-11", "PJ")).toBe(false);
  });

  it("faz o contrato recusar CPF/CNPJ e CEP inválidos", () => {
    expect(createClientSchema.safeParse({ name: "Pessoa", type: "PF", cpfCnpj: "111.111.111-11" }).success).toBe(false);
    expect(createClientSchema.safeParse({ name: "Empresa", type: "PJ", cpfCnpj: "04.252.011/0001-10", zipCode: "123" }).success).toBe(false);
  });
});
