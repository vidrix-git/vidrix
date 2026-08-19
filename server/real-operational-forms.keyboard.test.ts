// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KeyboardNavigator } from "../client/src/components/KeyboardNavigator";
import Clients from "../client/src/pages/Clients";
import Products from "../client/src/pages/Products";
import Suppliers from "../client/src/pages/Suppliers";
import Purchases from "../client/src/pages/Purchases";
import Reports from "../client/src/pages/Reports";
import Orders from "../client/src/pages/Orders";
import Quotes from "../client/src/pages/Quotes";
import Stock from "../client/src/pages/Stock";

const h = createElement;
(globalThis as unknown as { React: typeof React }).React = React;
if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = vi.fn();
}

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      clients: { list: { invalidate: vi.fn() } },
      products: { list: { invalidate: vi.fn() } },
      productTypes: { list: { invalidate: vi.fn() } },
      suppliers: { list: { invalidate: vi.fn() } },
      purchaseOrders: { list: { invalidate: vi.fn() }, getItems: { invalidate: vi.fn() } },
      quotes: { list: { invalidate: vi.fn() }, getItems: { invalidate: vi.fn(), fetch: vi.fn() } },
    }),
    clients: {
      list: { useQuery: () => ({ data: [{ id: 1, name: "Cliente Teclado" }], isLoading: false }) }, create: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, update: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      delete: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, lookupCep: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    products: {
      list: { useQuery: () => ({ data: [{ id: 1, name: "Produto Teclado", pricePerM2: "10", stockQuantity: 0, minStock: 0 }], isLoading: false }) }, create: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, update: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, delete: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    productTypes: { list: { useQuery: () => ({ data: [{ id: 1, name: "Vidro Incolor" }], isLoading: false }) } },
    suppliers: {
      list: { useQuery: () => ({ data: [{ id: 2, name: "Fornecedor Teclado" }], isLoading: false }) }, create: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, update: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, delete: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    purchaseOrders: {
      list: { useQuery: () => ({ data: [], isLoading: false }) }, getItems: { useQuery: () => ({ data: [], isLoading: false }) }, create: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      addItem: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, deleteItem: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, receive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, delete: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    reports: {
      revenue: { useQuery: () => ({ data: [] }) }, commissions: { useQuery: () => ({ data: [] }) }, stockAnalysis: { useQuery: () => ({ data: [] }) },
    },
    orders: {
      list: { useQuery: () => ({ data: [{ id: 7, clientId: 1, status: "pendente", totalAmount: "10", createdAt: "2026-08-18T00:00:00.000Z" }], isLoading: false }) },
      updateStatus: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    quotes: {
      list: { useQuery: () => ({ data: [], isLoading: false }) }, getItems: { useQuery: () => ({ data: [], isLoading: false }) },
      create: { useMutation: (options: any) => ({ mutate: () => options?.onSuccess?.({ insertId: 11 }), isPending: false }) }, addItem: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      deleteItem: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, convertToOrder: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, delete: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    stockMovements: {
      list: { useQuery: () => ({ data: [{ id: 1, type: "entrada", productId: 1, quantity: 2, createdAt: "2026-08-18T10:00:00.000Z", referenceType: "purchase_order", referenceId: 3 }], isLoading: false }) },
    },
  },
}));

afterEach(() => cleanup());

function page(Component: () => ReturnType<typeof createElement>) {
  return render(h(KeyboardNavigator, null, h(Component)));
}

async function selectWithKeyboard(user: any, combobox: HTMLElement, expectedText: string) {
  combobox.focus();
  await user.keyboard("{Enter}{ArrowDown}{Enter}");
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  expect(combobox.textContent).toContain(expectedText);
}

describe("formulários operacionais reais — teclado", () => {
  it("avança no diálogo real de Clientes e permite cancelar com Enter", async () => {
    const user = userEvent.setup();
    const view = page(Clients);
    await user.click(view.getByRole("button", { name: /novo cliente/i }));

    const name = view.getByPlaceholderText("Nome do cliente");
    const type = view.getByDisplayValue("Pessoa física");
    name.focus();
    fireEvent.keyDown(name, { key: "Enter" });
    expect(document.activeElement).toBe(type);

    fireEvent.keyDown(type, { key: "Enter" });
    fireEvent.change(type, { target: { value: "PJ" } });
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    const documentField = view.getByPlaceholderText("00.000.000/0000-00");
    expect(document.activeElement).toBe(documentField);
    fireEvent.keyDown(documentField, { key: "Enter", shiftKey: true });
    expect(document.activeElement).toBe(type);

    const cancel = view.getByRole("button", { name: "Cancelar" });
    expect(view.getByRole("button", { name: "Salvar" })).toBeTruthy();
    cancel.focus();
    await user.keyboard("{Enter}");
    expect(view.queryByText("Novo Cliente")).toBeTruthy();
    expect(view.queryByPlaceholderText("Nome do cliente")).toBeNull();
  });

  it("exercita o diálogo real de Produtos desde o código até o nome pelo Enter", async () => {
    const user = userEvent.setup();
    const view = page(Products);
    await user.click(view.getByRole("button", { name: /novo produto/i }));
    const code = view.getByPlaceholderText("Ex.: KF-1");
    const name = view.getByPlaceholderText("Ex: Vidro incolor 4mm");
    code.focus();
    fireEvent.keyDown(code, { key: "Enter" });
    expect(document.activeElement).toBe(name);
    fireEvent.keyDown(name, { key: "Enter", shiftKey: true });
    expect(document.activeElement).toBe(code);

    const cancel = view.getByRole("button", { name: "Cancelar" });
    expect(view.getByRole("button", { name: "Salvar" })).toBeTruthy();
    cancel.focus();
    await user.keyboard("{Enter}");
    expect(view.queryByPlaceholderText("Ex.: KF-1")).toBeNull();
  });

  it("exercita o diálogo real de Fornecedores e mantém a sequência de campos", async () => {
    const user = userEvent.setup();
    const view = page(Suppliers);
    await user.click(view.getByRole("button", { name: /novo fornecedor/i }));
    const name = view.getByPlaceholderText("Nome do fornecedor");
    const cnpj = view.getByPlaceholderText("00.000.000/0000-00");
    const dialog = view.getByRole("dialog");
    const contact = dialog.querySelectorAll("input")[1];
    name.focus();
    fireEvent.keyDown(name, { key: "Enter" });
    expect(document.activeElement).toBe(contact);
    cnpj.focus();
    fireEvent.keyDown(cnpj, { key: "Enter", shiftKey: true });
    expect(document.activeElement).toBe(contact);
    await selectWithKeyboard(user, view.getByRole("combobox"), "À Vista");

    const cancel = view.getByRole("button", { name: "Cancelar" });
    expect(view.getByRole("button", { name: "Salvar" })).toBeTruthy();
    cancel.focus();
    await user.keyboard("{Enter}");
    expect(view.queryByPlaceholderText("Nome do fornecedor")).toBeNull();
    expect(cnpj).toBeDefined();
  });

  it("monta o diálogo real de Compras e preserva seus controles de criação e cancelamento", async () => {
    const user = userEvent.setup();
    const view = page(Purchases);
    await user.click(view.getByRole("button", { name: /novo pedido de compra/i }));
    expect(view.getByRole("dialog")).toBeTruthy();
    expect(view.getByRole("button", { name: /criar pedido/i })).toBeTruthy();
    const supplier = view.getByRole("combobox");
    const notes = view.getByPlaceholderText("Notas do pedido");
    notes.focus();
    fireEvent.keyDown(notes, { key: "Enter", shiftKey: true });
    expect(document.activeElement).toBe(supplier);
    await selectWithKeyboard(user, supplier, "Fornecedor Teclado");
    expect(document.activeElement).toBe(supplier);
    await user.keyboard("{Tab}");
    expect(document.activeElement).toBe(notes);

    await user.click(view.getByRole("button", { name: /adicionar item/i }));
    const product = view.getAllByRole("combobox")[1];
    notes.focus();
    fireEvent.keyDown(notes, { key: "Enter" });
    expect(document.activeElement).toBe(product);
    await selectWithKeyboard(user, product, "Produto Teclado");
    await user.keyboard("{Tab}");
    const quantity = view.getByPlaceholderText("1");
    const unitCost = view.getByPlaceholderText("0.00");
    expect(document.activeElement).toBe(quantity);
    fireEvent.keyDown(quantity, { key: "Enter" });
    expect(document.activeElement).toBe(unitCost);
    fireEvent.keyDown(unitCost, { key: "Enter", shiftKey: true });
    expect(document.activeElement).toBe(quantity);

    const cancel = view.getByRole("button", { name: "Cancelar" });
    cancel.focus();
    await user.keyboard("{Enter}");
    expect(view.queryByRole("dialog")).toBeNull();
  });

  it("confirma o select real de período em Relatórios e avança o foco pelo teclado", async () => {
    const user = userEvent.setup();
    const view = page(Reports);
    const period = view.getByRole("combobox", { name: "Período do faturamento" }) as HTMLSelectElement;
    const exportButton = view.getByRole("button", { name: /exportar csv/i });
    period.focus();
    fireEvent.keyDown(period, { key: "Enter" });
    fireEvent.change(period, { target: { value: "7d" } });
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    expect(period.value).toBe("7d");
    expect(document.activeElement).toBe(period);
    await user.keyboard("{Tab}");
    expect(document.activeElement).toBe(exportButton);
  });

  it("mantém os controles reais de Lista e Kanban disponíveis na página de Pedidos", async () => {
    const user = userEvent.setup();
    const view = page(Orders);
    const kanban = view.getByRole("tab", { name: "Kanban" });
    kanban.focus();
    await user.keyboard("{Enter}");
    expect(kanban.getAttribute("data-state")).toBe("active");
    expect(view.getAllByText("Arraste aqui").length).toBeGreaterThan(0);
    const list = view.getByRole("tab", { name: "Lista" });
    list.focus();
    await user.keyboard("{Enter}");
    expect(list.getAttribute("data-state")).toBe("active");
    expect(view.getByRole("table")).toBeTruthy();
  });

  it("mantém o diálogo real de Orçamentos acessível por teclado, com select, Shift+Enter e cancelamento", async () => {
    const user = userEvent.setup();
    const view = page(Quotes);
    await user.click(view.getByRole("button", { name: /novo orçamento/i }));

    const client = view.getByRole("combobox");
    const notes = view.getByPlaceholderText("Observações do orçamento");
    expect(view.getByRole("tab", { name: "Informações" })).toBeTruthy();
    expect(view.getByRole("tab", { name: "Itens" })).toHaveProperty("disabled", true);
    await selectWithKeyboard(user, client, "Cliente Teclado");

    notes.focus();
    fireEvent.keyDown(notes, { key: "Enter", shiftKey: true });
    expect(document.activeElement).toBe(client);

    await user.click(view.getByRole("button", { name: "Criar Orçamento" }));
    const itemsTab = view.getByRole("tab", { name: "Itens" });
    expect(itemsTab).toHaveProperty("disabled", false);
    itemsTab.focus();
    await user.keyboard("{Enter}");
    expect(itemsTab.getAttribute("data-state")).toBe("active");
    expect(view.getByRole("button", { name: "Adicionar Item" })).toBeTruthy();
    const back = view.getByRole("button", { name: "Voltar" });
    back.focus();
    await user.keyboard("{Enter}");
    expect(view.getByRole("tab", { name: "Informações" }).getAttribute("data-state")).toBe("active");

    const cancel = view.getByRole("button", { name: "Cancelar" });
    cancel.focus();
    await user.keyboard("{Enter}");
    expect(view.queryByRole("dialog")).toBeNull();
  });

  it("trata Estoque como consulta auditável: tabela rolável, sem formulário ou ação mutável por teclado", () => {
    const view = page(Stock);
    const table = view.getByRole("table");
    const scrollContainer = table.closest(".overflow-x-auto");
    expect(table).toBeTruthy();
    expect(view.queryByRole("button")).toBeNull();
    expect(scrollContainer).toBeTruthy();
    expect(view.getByText("Recebimento de Compra")).toBeTruthy();
  });
});
