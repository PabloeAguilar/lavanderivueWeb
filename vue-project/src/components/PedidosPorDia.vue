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
import { Pedido } from '../types/classes/Pedido.ts';
import { getOrderClientName } from '@/helpers/stores.ts';
import { getDateOptions, dateFormats } from '@/helpers/totales.ts';

const fecha = ref(new Date());
const fechaFormateada = computed(() => {
    return new Intl.DateTimeFormat("sv-SE", getDateOptions()).format(fecha.value);
});
const pedidos = ref<OrdenConPedidos[]>([]);



onMounted(() => {
    cargarPedidosPorFecha(fecha.value);
});

async function cargarPedidosPorFecha(fechaSeleccionada: Date) {
    const fechaString = new Intl.DateTimeFormat(dateFormats, getDateOptions()).format(fechaSeleccionada);
    window.electronApi.getOrdersByDate(fechaString).then(async (orders: Order[]) => {
        let ordenesConPedidos: OrdenConPedidos[] = [];
        for (const order of orders) {
            ordenesConPedidos.push({
                ...order,
                pedidos: [],
            });
            ordenesConPedidos[ordenesConPedidos.length - 1]!.pedidos = (await window.electronApi.getPedidosByOrder(order.id!)).data;
        }
        pedidos.value = ordenesConPedidos;
        og({ pedidos })

    });
}

const ordenesRecibidas = computed(() => {
    return pedidos.value.filter((pedido) => pedido.fechaRegistro?.startsWith(new Intl.DateTimeFormat(dateFormats, getDateOptions()).format(fecha.value)));
});

const ordenesEntregadas = computed(() => {
    return pedidos.value.filter((pedido) => pedido.fechaEntrega?.startsWith(new Intl.DateTimeFormat(dateFormats, getDateOptions()).format(fecha.value)));
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
    pedidos: Pedido[];
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