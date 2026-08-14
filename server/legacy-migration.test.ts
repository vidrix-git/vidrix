import { describe, expect, it } from "vitest";
import { extractSqlCount, legacyRowHash, mapLegacyClient, mapLegacyCuttingRule, mapLegacyProduct } from "./legacy-migration";

describe("mapeamento de dados do MDB legado", () => {
  it("preserva o identificador legado quando o cliente não possui CPF/CNPJ", () => {
    const client = mapLegacyClient({
      "Código do Cliente": "17",
      Apelido: "Cliente balcão",
      "Nome do Cliente": "",
      CGC_CPF: "",
      "Telefone Celular": "(48) 99999-0000",
    });

    expect(client).toMatchObject({
      name: "Cliente balcão",
      cpfCnpj: "LEGADO-CLIENTE-17",
      type: "PF",
      phone: "(48) 99999-0000",
    });
  });

  it("mapeia kits para produtos sem inventar medidas físicas e preserva a origem do código", () => {
    const product = mapLegacyProduct({ Código: "1", Medida: "KIT FRONTAL 120MT ALM FOSCO", Preço: "117.00" }, "KIt_Fontal");

    expect(product).toEqual({
      code: "KF-1",
      name: "KIT FRONTAL 120MT ALM FOSCO",
      type: "Kit frontal",
      thickness: "N/A",
      color: null,
      width: 0,
      height: 0,
      unitPrice: 117,
    });
  });

  it("diferencia códigos repetidos em tabelas distintas do MDB", () => {
    expect(mapLegacyProduct({ Código: "1", Medida: "KIT CANTO 100MT ALM FOSCO", Preço: "155.00" }, "Kit_Canto")?.code).toBe("KC-1");
  });

  it("converte regras de corte e mantém hashes determinísticos", () => {
    const row = { LarguraCorte: "120.00", LarguraVenda: "125" };
    expect(mapLegacyCuttingRule(row, "Larguras")).toEqual({ category: "vidro_largura", cutValue: 120, saleValue: 125 });
    expect(legacyRowHash("Larguras", row)).toBe(legacyRowHash("Larguras", { LarguraVenda: "125", LarguraCorte: "120.00" }));
  });

  it("lê totais SQL de forma segura para a reconciliação administrativa", () => {
    expect(extractSqlCount([{ count: "54" }])).toBe(54);
    expect(extractSqlCount([{ count: 34 }])).toBe(34);
    expect(extractSqlCount([])).toBe(0);
    expect(extractSqlCount([{ count: "inválido" }])).toBe(0);
  });
});
