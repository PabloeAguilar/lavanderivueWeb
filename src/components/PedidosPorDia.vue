<template>
    <el-row style="margin-bottom: 20px; font-size: large; font-weight: bold;">
        <el-col :span="12" style="text-align: left;">
            Mostrando pedidos del dia: {{ fechaFormateada }}
        </el-col>
        <ElCol :span="12">
            Seleccionar otra fecha
            <ElDatePicker v-model="fecha" type="date" placeholder="Selecciona fecha" @change="onDateChange" />
        </ElCol>
    </el-row>
    <ElRow :gutter="20">
        <ElCol :span="12">
            <h3>Ordenes Recibidas</h3>
            <h4>Cantidad de ropa recibida: {{ cantidadRecibida }}</h4>
            <ElScrollbar class="scrollbarContent">
                <ElRow v-for="orden in ordenesRecibidas" :key="orden.id"
                    style="margin-bottom: 20px; border: 1px solid #ccc; padding: 10px;">
                    <ElContainer>
                        <ElHeader class="headerPedido">
                            Orden ID: {{ orden.id }} - Cliente: {{ getOrderClientName(orden.id) }}
                        </ElHeader>
                        <ElMain>
                            <ElRow v-for="pedido in orden.pedidos" :key="pedido.id">
                                Descripción: {{ pedido.type }} - Cantidad: {{ pedido.quantity }}
                            </ElRow>
                        </ElMain>
                    </ElContainer>
                </ElRow>
            </ElScrollbar>
        </ElCol>
        <ElCol :span="12">
            <h3>Ordenes Entregadas</h3>
            <ElScrollbar class="scrollbarContent">
                <ElRow v-for="orden in ordenesEntregadas" :key="orden.id"
                    style="margin-bottom: 20px; border: 1px solid #ccc; padding: 10px;">
                    <ElContainer>
                        <ElHeader class="headerPedido">
                            Orden ID: {{ orden.id }} - Cliente: {{ getOrderClientName(orden.id) }}
                        </ElHeader>
                        <ElMain>
                            <ElRow v-for="pedido in orden.pedidos" :key="pedido.id">
                                Descripción: {{ pedido.type }} {{ pedido.description }} - Cantidad: {{
                                    pedido.quantity }}
                            </ElRow>
                        </ElMain>
                    </ElContainer>
                </ElRow>
            </ElScrollbar>
        </ElCol>

    </ElRow>
</template>

<script setup lang="ts">
import { ElCol, ElContainer, ElDatePicker, ElHeader, ElMain, ElRow, ElScrollbar } from 'element-plus';
import { computed, onMounted, ref } from 'vue';
import type { Order } from '../types/mainTypes.ts';
import { getOrderClientName } from '@/helpers/stores.ts';
import { getDateOptions, dateFormats, formatDateString } from '@/helpers/totales.ts';
import { useOrdersStore } from '@/stores/orders.ts';
import { usePedidosStore } from '@/stores/pedidos.ts';

const fecha = ref(new Date());
const fechaFormateada = computed(() => {
    return formatDateString(fecha.value);
});
const pedidos = ref<OrdenConPedidos[]>([]);



onMounted(() => {
    cargarPedidosPorFecha(fecha.value);
});

async function cargarPedidosPorFecha(fechaSeleccionada: Date) {
    const fechaString = formatDateString(fechaSeleccionada);
    const ordenes = useOrdersStore().getOrdersByDate(fechaString);
    let ordenesConPedidos: OrdenConPedidos[] = [];
    ordenes.forEach((order) => {
        ordenesConPedidos.push({
            ...order,
            pedidos: [],
        });
        ordenesConPedidos[ordenesConPedidos.length - 1]!.pedidos = usePedidosStore().getPedidosByOrderId(order.id!);
    });
    pedidos.value = ordenesConPedidos;
}

const ordenesRecibidas = computed(() => {
    return pedidos.value.filter((pedido) => pedido.fechaRegistro?.startsWith(formatDateString(fecha.value)));
});

const ordenesEntregadas = computed(() => {
    return pedidos.value.filter((pedido) => pedido.fechaEntrega?.startsWith(formatDateString(fecha.value)));
});

const cantidadRecibida = computed(() => {
    return ordenesRecibidas.value.reduce((total, orden) => {
        const sumaPedidos = orden.pedidos
            .filter(pedido => pedido.type === 'lavado')
            .reduce((suma, pedido) => suma + pedido.quantity, 0);
        return total + sumaPedidos;
    }, 0);
});

function onDateChange(selectedDate: Date) {
    cargarPedidosPorFecha(selectedDate);
}

interface OrdenConPedidos extends Order {
    pedidos: PedidoStoreItem[];
}

interface PedidoStoreItem {
    readonly subtotal: number;
    idOrder: number;
    type: string;
    quantity: number;
    price: number;
    description: string | null;
    registredAt: string;
    deliveredAt: string | null;
    id?: number;
}
</script>

<style scoped>
.headerPedido {
    background-color: #bebaba;
    padding: 10px;
    font-weight: bold;
    color: #000;
}
.scrollbarContent {
    height: 65vh;
}
</style>