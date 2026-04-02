import { formatDateString } from "@/helpers/totales";

export class Pedido {
    readonly subtotal: number;

    constructor(
        public idOrder: number,
        public type: string,
        public quantity: number,
        public price: number,
        public description: string | null = null,
        public registredAt: string = formatDateString(new Date()),
        public deliveredAt: string | null = null,
        public id?: number
    ) {
        this.subtotal = this.calcularSubtotal();
    }

    private calcularSubtotal(): number {
        if (this.type === 'planchados') {
            return isNaN(this.quantity) || this.quantity === 0
                ? 0
                : this.quantity * this.price;
        }
        return Math.floor(this.price * this.quantity);
    }
}