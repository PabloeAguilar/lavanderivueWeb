<template>
  <el-container>
    <el-aside class="no-print">
      <MenuLateral @menuCambiado="menuSeleccionado" :lista-menus="listaModulos" />
    </el-aside>

    <el-container>
      <el-header id="encabezadoModulo"> {{ menuActual }}</el-header>
      <el-main>
        <!-- Contenido principal -->
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>

  <el-dialog v-model="mostrarDialogoMovil" title="Aviso" width="90%" :close-on-click-modal="false" :show-close="true"
    append-to-body>
    <p>Detectamos que ingresaste desde un celular.</p>
    <p>Esta aplicación fue pensada para ser utilizada en dispositivos de escritorio.</p>
  </el-dialog>
</template>

<script lang="ts" setup>

import MenuLateral from './components/MenuLateral.vue';
import { Menu } from './types/classes/Menu.ts';
import { onMounted, ref } from "vue";
import { ElContainer, ElHeader, ElMain, ElAside, ElDialog } from 'element-plus';
import { RouterView } from 'vue-router';

let menuActual = ref('Bienvenida');
const mostrarDialogoMovil = ref(false);
const CLAVE_DIALOGO_MOVIL = 'mobile-first-visit-dialog-shown';

const listaModulos = [
  new Menu("Bienvenida", "Bienvenido", "/"),
  new Menu("Registro de pedido", "Registro de pedido", "/registroPedido"),
  new Menu("Búsqueda y Entrega", "Búsqueda y Entrega pedidos", "/busqueda"),
  new Menu("Libreta de pedidos", "Pedidos por día", "/pedidosPorDia"),
  new Menu("Clientes", "Lista de clientes", "/clientes"),
]
function menuSeleccionado(nombreModulo: string) {
  menuActual.value = nombreModulo;
}

function esDispositivoMovil() {
  const userAgent = navigator.userAgent || navigator.vendor;
  const porUserAgent = /android|iphone|ipad|ipod|iemobile|opera mini|mobile/i.test(userAgent);
  const porPantalla = window.matchMedia('(max-width: 768px)').matches;
  return porUserAgent || porPantalla;
}

onMounted(() => {
  const yaMostrado = localStorage.getItem(CLAVE_DIALOGO_MOVIL) === 'true';

  if (!yaMostrado && esDispositivoMovil()) {
    mostrarDialogoMovil.value = true;
    localStorage.setItem(CLAVE_DIALOGO_MOVIL, 'true');
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  font-size: x-large;
}

.el-collapse-item__title,
p,
.el-input-number .el-input__inner,
.el-input .el-input__inner,
.el-table__body,
.el-button>span,
thead,
span {
  font-size: x-large;
}

.el-autocomplete-suggestion li {
  font-size: x-large !important;
}

.el-header {
  background-color: #409EFF;
  color: white;
  line-height: 60px;
}

.el-aside {
  background-color: #304156;
  color: white;
}

.el-menu {
  border-right: none;
}

#encabezadoModulo {
  background-color: #304156;
  color: white;
}

.negritaEnLinea {
  font-weight: bold;
  margin-right: 1rem;
}


.negrita {
  font-weight: bold;
}

@media print {
  .no-print {
    display: none;
  }
}
</style>

<style scoped>
.el-container {
  height: 100%;
}
</style>
