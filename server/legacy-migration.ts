import { createHash } from "node:crypto";

export type LegacyRow = Record<string, string | undefined>;

export function extractSqlCount(rows: unknown): number {
  if (!Array.isArray(rows) || !rows[0] || typeof rows[0] !== "object") return 0;
  const value = (rows[0] as Record<string, unknown>).count;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export type LegacyClient = {
  name: string;
  type: "PF" | "PJ";
  cpfCnpj: string;
  address: string | null;
  phone: string | null;
};

export type LegacyProduct = {
  code: string | null;
  name: string;
  type: string;
  thickness: string;
  color: string | null;
  width: number;
  height: number;
  unitPrice: number;
};

export type LegacyCuttingRule = {
  category: "vidro_largura" | "box_largura" | "box_largura_2" | "vidro_altura";
  cutValue: number;
  saleValue: number;
};

function value(row: LegacyRow, field: string): string {
  return (row[field] ?? "").trim();
}

function toNumber(raw: string): number {
  const trimmed = raw.trim();
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function documentDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function legacyRowHash(sourceTable: string, row: LegacyRow): string {
  const canonical = Object.keys(row)
    .sort((left, right) => left.localeCompare(right))
    .map((key) => [key, row[key] ?? ""]);

  return createHash("sha256")
    .update(JSON.stringify([sourceTable, canonical]), "utf8")
    .digest("hex");
}

export function mapLegacyClient(row: LegacyRow): LegacyClient | null {
  const legacyCode = value(row, "Código do Cliente");
  const name = value(row, "Nome do Cliente") || value(row, "Apelido");
  if (!name) return null;

  const document = documentDigits(value(row, "CGC_CPF"));
  const cpfCnpj = document || `LEGADO-CLIENTE-${legacyCode || legacyRowHash("Erros ao colar", row).slice(0, 12)}`;
  const phone = [value(row, "Telefone Residêncial"), value(row, "Telefone Celular")]
    .filter(Boolean)
    .join(" / ") || null;

  return {
    name,
    type: document.length === 14 ? "PJ" : "PF",
    cpfCnpj,
    address: value(row, "Endereço") || null,
    phone,
  };
}

export function mapLegacyProduct(row: LegacyRow, sourceTable: "KIt_Fontal" | "Kit_Canto"): LegacyProduct | null {
  const name = value(row, "Medida");
  if (!name) return null;
  const legacyCode = value(row, "Código");

  return {
    // O MDB reinicia a numeração em cada tabela de kit; o prefixo preserva
    // a origem e produz um identificador único para pesquisa no Vidrix.
    code: legacyCode ? `${sourceTable === "KIt_Fontal" ? "KF" : "KC"}-${legacyCode}` : null,
    name,
    type: sourceTable === "KIt_Fontal" ? "Kit frontal" : "Kit canto",
    thickness: "N/A",
    color: null,
    width: 0,
    height: 0,
    unitPrice: toNumber(value(row, "Preço")),
  };
}

export function mapLegacyCuttingRule(
  row: LegacyRow,
  sourceTable: "Larguras" | "Larguras Box" | "Larguras2 Box" | "Alturas",
): LegacyCuttingRule | null {
  const definitions = {
    Larguras: { category: "vidro_largura", cut: "LarguraCorte", sale: "LarguraVenda" },
    "Larguras Box": { category: "box_largura", cut: "LarguraCorte", sale: "LarguraVenda" },
    "Larguras2 Box": { category: "box_largura_2", cut: "LarguraCorte", sale: "Largura2Venda" },
    Alturas: { category: "vidro_altura", cut: "AlturaCorte", sale: "AlturaVenda" },
  } as const;
  const definition = definitions[sourceTable];
  const cutValue = toNumber(value(row, definition.cut));
  const saleValue = toNumber(value(row, definition.sale));

  if (!Number.isFinite(cutValue) || !Number.isFinite(saleValue)) return null;
  return { category: definition.category, cutValue, saleValue };
}

export function legacyCodeFor(sourceTable: string, row: LegacyRow): string | null {
  const codes: Record<string, string> = {
    "Erros ao colar": "Código do Cliente",
    KIt_Fontal: "Código",
    Kit_Canto: "Código",
    Venda: "CodigoDaVenda",
    TempBox: "Código do Cliente",
  };
  const column = codes[sourceTable];
  return column ? value(row, column) || null : null;
}
