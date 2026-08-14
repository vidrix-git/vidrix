export type ClientType = "PF" | "PJ";

export function digitsOnly(value: string | null | undefined): string {
  return (value || "").replace(/\D/g, "");
}

function hasOnlyRepeatedDigits(value: string): boolean {
  return /^(\d)\1+$/.test(value);
}

export function formatCpf(value: string | null | undefined): string {
  const digits = digitsOnly(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatCnpj(value: string | null | undefined): string {
  const digits = digitsOnly(value).slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function formatClientDocument(value: string | null | undefined, type: ClientType): string {
  return type === "PJ" ? formatCnpj(value) : formatCpf(value);
}

export function formatPhone(value: string | null | undefined): string {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{1,4})(\d{0,4})/, (_match, area, prefix, suffix) =>
      `(${area}) ${prefix}${suffix ? `-${suffix}` : ""}`,
    );
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, (_match, area, prefix, suffix) =>
    `(${area}) ${prefix}${suffix ? `-${suffix}` : ""}`,
  );
}

export function formatZipCode(value: string | null | undefined): string {
  const digits = digitsOnly(value).slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
}

export function isValidZipCode(value: string | null | undefined): boolean {
  return digitsOnly(value).length === 8;
}

export function isValidCpf(value: string | null | undefined): boolean {
  const cpf = digitsOnly(value);
  if (cpf.length !== 11 || hasOnlyRepeatedDigits(cpf)) return false;

  const calculateDigit = (base: string, factor: number) => {
    const total = base.split("").reduce((sum, digit, index) => sum + Number(digit) * (factor - index), 0);
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const first = calculateDigit(cpf.slice(0, 9), 10);
  const second = calculateDigit(cpf.slice(0, 10), 11);
  return first === Number(cpf[9]) && second === Number(cpf[10]);
}

export function isValidCnpj(value: string | null | undefined): boolean {
  const cnpj = digitsOnly(value);
  if (cnpj.length !== 14 || hasOnlyRepeatedDigits(cnpj)) return false;

  const calculateDigit = (base: string) => {
    let factor = base.length === 12 ? 5 : 6;
    const total = base.split("").reduce((sum, digit) => {
      const next = sum + Number(digit) * factor;
      factor = factor === 2 ? 9 : factor - 1;
      return next;
    }, 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const first = calculateDigit(cnpj.slice(0, 12));
  const second = calculateDigit(cnpj.slice(0, 12) + first);
  return first === Number(cnpj[12]) && second === Number(cnpj[13]);
}

export function isValidClientDocument(value: string | null | undefined, type: ClientType): boolean {
  return type === "PJ" ? isValidCnpj(value) : isValidCpf(value);
}

export function clientDocumentError(type: ClientType): string {
  return type === "PJ" ? "Informe um CNPJ válido" : "Informe um CPF válido";
}
