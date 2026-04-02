import { useClientsStore } from '@/stores/clients';
import { useOrdersStore } from '@/stores/orders';


export function getOrderClientName(orderId: number): string | undefined {
    const ordersStore = useOrdersStore();
    const clientsStore = useClientsStore();
    const order = ordersStore.getOrderById(orderId);
    if (!order) return undefined;
    const client = clientsStore.getClientById(order.clientIndex);
    return client?.name;
}

export function getListOfSuggestions() {
    return [
        {
            id: 1,
            nombre: 'Almohada',
            clave: 'almohada',
            precio_individual: 50
        },
        {
            id: 2,
            nombre: 'Edredon',
            clave: 'edredon',
            precio_individual: 150
        },
        {
            id: 3,
            nombre: 'Cobija',
            clave: 'cobija',
            precio_individual: 100
        }
    ];
}