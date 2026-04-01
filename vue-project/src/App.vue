<template>
    <el-container>
      <el-aside>
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
</template>

<script lang="ts" setup>

import MenuLateral from './components/MenuLateral.vue';
import { Menu } from './types/classes/Menu.ts';
import { ref } from "vue";
import { ElContainer, ElHeader, ElMain, ElAside } from 'element-plus';
import { RouterView } from 'vue-router';

let menuActual = ref('Bienvenida');
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

.negritaEnLinea{
  font-weight: bold;
  margin-right: 1rem;
}


.negrita{
  font-weight: bold;
}
</style>

<style scoped>
.el-container {
  height: 100%;
}
</style>
