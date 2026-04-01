import { Pedido } from "../types/classes/Pedido";

export function calcularSubtotal(pedido: Pedido): number {
    if (pedido.type === 'planchados') {
        return isNaN(pedido.quantity) || pedido.quantity === 0
            ? 0
            : pedido.quantity * pedido.price;
    }
    return Math.floor(pedido.price * pedido.quantity);
}

export function getDateOptions() {
    return {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour12: false,
    }
}

export const dateFormats = ["es-MX", "en-Us"];

export function formatDateString(date: Date): string {
    return new Intl.DateTimeFormat(dateFormats, getDateOptions()).format(date);
}