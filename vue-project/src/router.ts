import { createRouter, createWebHistory } from 'vue-router';
import HelloWorld from "./components/HelloWorld.vue";
import RegistroPedido from "./components/RegistroPedido.vue";
import BusquedaPedido from "./components/EntregaPedidos.vue";
import ModuloClientes from "./components/ModuloClientes.vue";
import Configuracion from "./components/Configuracion.vue";
import PedidosPorDia from './components/PedidosPorDia.vue';

const rutas = [
    {
        path: '/',
        name: 'Home',
        component: HelloWorld
    },
    {
        path: '/registroPedido',
        name: 'RegistrarPedido',
        component: RegistroPedido
    },
    {
        path: '/busqueda',
        name: 'Busqueda',
        component: BusquedaPedido
    },
    {
        path: '/clientes',
        name: 'Clientes',
        component: ModuloClientes
    },
    {
        path: '/pedidosPorDia',
        name: 'PedidosPorDia',
        component: PedidosPorDia
    }

    // Otras rutas...
];

const router = createRouter({
    history: createWebHistory(),
    routes: rutas
});

export default router;