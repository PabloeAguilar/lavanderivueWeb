<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps<{
  ordenId: number;
  listaPedido: any[];
  visible: boolean;
}>();
const emit = defineEmits(['close']);

const loadingCliente = ref(false);
const loadingNegocio = ref(false);

function imprimirCliente() {
  loadingCliente.value = true;
  window.printApi.imprimirRecibo(props.ordenId, props.listaPedido, true)
    .finally(() => {
      loadingCliente.value = false;
    });
}

function imprimirNegocio() {
  loadingNegocio.value = true;
  window.printApi.imprimirRecibo(props.ordenId, props.listaPedido, false)
    .finally(() => {
      loadingNegocio.value = false;
    });
}

function cerrarDialog() {
  emit('close');
}
</script>

<template>
  <el-dialog :model-value="props.visible" title="Imprimir Recibo" @close="cerrarDialog" width="400px">
    <el-row justify="center" style="margin-bottom: 20px;">
      <el-button type="primary" @click="imprimirCliente" :loading="loadingCliente">Imprimir para cliente</el-button>
    </el-row>
    <el-row justify="center" style="margin-bottom: 20px;">
      <el-button type="success" @click="imprimirNegocio" :loading="loadingNegocio">Imprimir para negocio</el-button>
    </el-row>
    <el-row justify="center">
      <el-button type="danger" @click="cerrarDialog">Cerrar</el-button>
    </el-row>
  </el-dialog>
</template>

<style scoped>
.el-dialog {
  text-align: center;
}
</style>
