<script setup lang="ts">

import { ref, onMounted, h, computed, toRaw } from "vue";
import type { Client, Order } from "../types/mainTypes.ts";
import { ElNotification, ElDialog, ElButton, ElDrawer } from "element-plus";
import ImprimirDialog from './ImprimirDialog.vue';
import { Pedido } from "../types/classes/Pedido.ts";
import { calcularSubtotal, formatDateString } from "../helpers/totales.ts";
import { useOrdersStore } from "@/stores/orders.ts";
import { useClientsStore } from "@/stores/clients.ts";
import { usePedidosStore } from "@/stores/pedidos.ts";
import { getOrderClientName } from "@/helpers/stores.ts";

const ordersStore = useOrdersStore();
const clientsStore = useClientsStore();
const pedidosStore = usePedidosStore();

let nombreCliente = ref('');
let idCliente: number | null = null;
let ordenes = ref<Order[]>([])

let selectedOrden = ref<Order | null>(null)


let pedidosList = ref<Pedido[]>([])
// --- NUEVO: para "Entregar más" ---
let entregarMasDialogVisible = ref(false)
let ordenesEntregarMas = ref<Order[]>([])
let pedidosEntregarMas = ref<Record<number, Pedido[]>>({})
let drawerVisible = ref(false)

// --- NUEVO: Diálogo para modificar pedido ---
let modificarDialogVisible = ref(false)
let modificarComentarios = ref('')
let modificarAdelanto = ref(0)
let modificarCantidades = ref<Record<number, number>>({})

function modificarPedido() {
  if (!selectedOrden.value) {
    mostrarMensaje('No hay pedido seleccionado', 'info', 'Seleccione un pedido para modificar', 5)
    return;
  }
  modificarComentarios.value = selectedOrden.value.comentarios || '';
  modificarAdelanto.value = selectedOrden.value.adelanto || 0;
  modificarCantidades.value = {};
  pedidosList.value.forEach((pedido) => {
    modificarCantidades.value[pedido.id!] = pedido.quantity;
  });
  modificarDialogVisible.value = true;
}

async function guardarModificacionPedido() {
  if (!selectedOrden.value) return;
  const updatedOrder = ordersStore.updateOrder(selectedOrden.value.id!, { comentarios: modificarComentarios.value, adelanto: modificarAdelanto.value });
  if (updatedOrder) {
    selectedOrden.value.comentarios = modificarComentarios.value;
    selectedOrden.value.adelanto = modificarAdelanto.value;
    for (const pedido of pedidosList.value) {
      const nuevaCantidad = modificarCantidades.value[pedido.id!];
      if (nuevaCantidad !== undefined && nuevaCantidad !== pedido.quantity) {
        pedido.quantity = nuevaCantidad;
        pedidosStore.updatePedido(pedido.id!, { quantity: nuevaCantidad });
      }
    }
    pedidosList.value = pedidosStore.getPedidosByOrder(selectedOrden.value.id);
    mostrarMensaje('Pedido modificado', 'success', 'Los cambios se guardaron correctamente', 3000);
    modificarDialogVisible.value = false;
  } else {
    mostrarMensaje('Error', 'error', 'No se pudo modificar el pedido', 3000);
  }
}



onMounted(() => {
  loadLastOrders()
})

function mostrarMensaje(titulo: string, tipo: String, mensaje: string, duration: number) {
  ElNotification({
    title: titulo,
    message: mensaje,
    type: tipo,
    duration: duration
  })
}

let imprimirDialogVisible = ref(false);
function abrirDialogImprimir() {
  if (selectedOrden.value === null) {
    mostrarMensaje("No se puede imprimir", "info", "Registre el pedido para imprimirlo", 5);
    return;
  }
  imprimirDialogVisible.value = true;
}

function loadLastOrders() {
  ordenes.value = ordersStore.getOrders(10);
}


function handleClearClient() {
  idCliente = null;
  loadLastOrders()
}

const notifySelectUser = (mensaje: string) => {
  ElNotification({
    title: 'Nota',
    message: h('i', { style: 'color: teal' }, mensaje),
  })
}

const calculateTotal = computed(() => {
  if (pedidosList.value.length == 0) {
    return 0;
  }
  let total = 0;
  pedidosList.value.forEach((pedid) => {
    total += pedid.subtotal
  })
  return total
})

async function buscarOrdenesCliente() {
  if (idCliente === null) {
    notifySelectUser("Debe seleccionar un cliente");
    return;
  }
  let busqueda = ordersStore.getOrdersByClientIndex(idCliente);
  ordenes.value = busqueda;
  if (ordenes.value.length === 0) {
    notifySelectUser("No se encontraron órdenes para el cliente seleccionado");
  }
}

const handleSelect = (item: Record<string, any>) => {
  idCliente = item.id
  buscarOrdenesCliente();
}

function handleSelectOrder(orden: Order) {
  selectedOrden.value = orden
  if (selectedOrden.value) {
    pedidosList.value = pedidosStore.getPedidosByOrder(selectedOrden.value.id)
  }
}

const querySearch = (querystring: string, cb: (arg: any) => void) => {
  const results = clientsStore.clients.filter((client: Client) =>
    client.name.toLowerCase().includes(querystring.toLowerCase())
  );
  const suggestions = results.map((client: Client) => {
    return {
      value: client.name,
      id: client.id,
    };
  });
  cb(suggestions);
}

// --- NUEVO: Diálogo para entregar ---
function abrirDialogEntregar() {
  entregarMasDialogVisible.value = true;
}

async function marcarComoEntregado() {
  // Acción de entregar (Aceptar en el diálogo)
  let order = ordersStore.getOrderById(selectedOrden.value?.id!)
  if (!order) {
    notifySelectUser("No se encontró la orden seleccionada")
    return;
  }
  order!.fechaEntrega = formatDateString(new Date());
  selectedOrden.value!.fechaEntrega = order.fechaEntrega;
  entregarMasDialogVisible.value = false;
}

async function entregarMas() {
  // Agregar la orden a la lista de "entregar más" y cargar sus pedidos
  if (selectedOrden.value && !ordenesEntregarMas.value.some(o => o.id === selectedOrden.value?.id)) {
    ordenesEntregarMas.value.push({ ...selectedOrden.value });
    // Cargar detalles de pedidos
    const pedidos = pedidosStore.getPedidosByOrder(selectedOrden.value.id);
    pedidosEntregarMas.value[selectedOrden.value.id] = pedidos.map(p => new Pedido(p.idOrder, p.type, p.quantity, p.price, p.description, formatDateString(new Date()), p.deliveredAt, p.id));

  }
  entregarMasDialogVisible.value = false;
}


// Entregar todos los pedidos en el drawer
const entregarTodosLosPedidos = async () => {
  for (const orden of ordenesEntregarMas.value) {
    ordersStore.updateOrder(orden.id!, { fechaEntrega: formatDateString(new Date()) });
    orden.fechaEntrega = formatDateString(new Date());
  }
  loadLastOrders();
  selectedOrden.value = null;
  pedidosList.value = [];
  ordenesEntregarMas.value = [];
  drawerVisible.value = false;
}

// Agrega el pedido actual a la lista y abre el drawer
async function verPedidosYAgregarActual() {
  if (selectedOrden.value && !ordenesEntregarMas.value.some(o => o.id === selectedOrden.value?.id)) {
    ordenesEntregarMas.value.push({ ...selectedOrden.value });
    const pedidos = pedidosStore.getPedidosByOrder(selectedOrden.value.id);
    pedidosEntregarMas.value[selectedOrden.value.id] = pedidos.map(p => new Pedido(p.idOrder, p.type, p.quantity, p.price, p.description, formatDateString(new Date()), p.deliveredAt, p.id));
  }
  entregarMasDialogVisible.value = false;
  drawerVisible.value = true;
}


function imprimirPedido() {
  window.printApi.imprimirRecibo(selectedOrden.value?.id, toRaw(pedidosList.value), true);

}

</script>

<template>
  <el-container>

    <el-row gutter="20">
      <el-col :span="12">
        <el-header>
          Búsqueda de pedido
        </el-header>
        <el-row>
          <el-autocomplete :fetch-suggestions="querySearch" @select="handleSelect" clearable @clear="handleClearClient"
            placeholder="Nombre del cliente" v-model="nombreCliente" />
        </el-row>

        <el-row style="margin-top: 15px" v-if="nombreCliente.trim().length === 0">
          Últimas ordenes
        </el-row>

        <el-row>
          <el-table empty-text="No hay órdenes" @current-change="handleSelectOrder" highlight-current-row
            :data="ordenes" style="width: 100%">
            <el-table-column prop="id" label="No. pedido" />
            <el-table-column label="Cliente">
              <template #default="scope">
                {{ getOrderClientName(scope.row.id) }}
              </template>
            </el-table-column>
            <el-table-column prop="fechaRegistro" label="Fecha orden" />
          </el-table>
        </el-row>
      </el-col>
      <el-col :span="12">
        <el-header>
          Información de pedido
        </el-header>

        <el-main style="padding: 0" v-if="selectedOrden !== null && pedidosList">
          <el-row>
            <el-row class="negritaEnLinea">
              Pedido número {{ selectedOrden.id }}
            </el-row>
            <el-row>
              <span class="negritaEnLinea">Cliente: </span>{{ getOrderClientName(selectedOrden.id) }}
            </el-row>
            <el-row>
              <span class="negritaEnLinea">Fecha de pedido: </span>{{ selectedOrden.fechaRegistro }}
            </el-row>
            <el-row v-if="selectedOrden.fechaEntrega">
              <span class="negritaEnLinea">Fecha de entrega: </span>{{ selectedOrden.fechaEntrega }}
            </el-row>
            <el-row>
              <span class="negritaEnLinea">Comentarios: </span>{{ selectedOrden.comentarios }}
            </el-row>
          </el-row>
          <el-row style="margin-top: 10px; margin-bottom: 10px">
            <el-col :span="8">
              <el-text size="large" type="primary">Servicio</el-text>
            </el-col>
            <el-col :span="8">
              <el-text size="large" type="primary">Cantidad</el-text>
            </el-col>
            <el-col :span="8">
              <el-text size="large" type="primary">Subtotal</el-text>
            </el-col>
          </el-row>
          <el-row v-for="(item, index) in pedidosList" :key="index" gutter=20>
            <el-col :span="8">
              <p>{{ item.type }}</p>
            </el-col>
            <el-col v-if="'pieza' === item.type" :span="8">
              <p>{{ item.quantity }} {{ item.description }} </p>
            </el-col>
            <el-col v-if="'lavado' === item.type" :span="8">
              <p>{{ item.quantity }} kg</p>
            </el-col>
            <el-col v-if="'planchado' === item.type" :span="8">
              <p v-if="isNaN(Number(item.quantity)) || Number(item.quantity) === 0">
                {{ item.description }}
              </p>
              <p v-else>
                {{ item.quantity }} piezas
              </p>
            </el-col>
            <el-col :span="6" class="alineadoIzquierda">
              <p v-if="item.subtotal === 0">Pendiente</p>
              <p v-else>{{ item.subtotal }}</p>
            </el-col>
          </el-row>
          <el-row :gutter=20>
            <el-col :span="8" :offset="2">
              <p>Total:</p>
            </el-col>
            <el-col class="alineadoIzquierda" :span="6" :offset="8">
              <p>${{ calculateTotal }}</p>
            </el-col>
          </el-row>
          <template v-if="selectedOrden.adelanto && selectedOrden.adelanto > 0">
            <span v-if="selectedOrden.adelanto == calculateTotal" class="negrita">PAGADO</span>
            <template v-else>
              <el-row :gutter=20>
                <el-col :span="8" :offset="2">
                  <p>Adelanto:</p>
                </el-col>
                <el-col class="alineadoIzquierda" :span="6" :offset="8">
                  <p>${{ (selectedOrden.adelanto ? selectedOrden.adelanto : 0) }}</p>
                </el-col>
              </el-row>
              <el-row :gutter=20>
                <el-col :span="8" :offset="2">
                  <p>Restante:</p>
                </el-col>
                <el-col class="alineadoIzquierda" :span="6" :offset="8">
                  <p>${{ calculateTotal - (selectedOrden.adelanto ? selectedOrden.adelanto : 0) }}</p>
                </el-col>
              </el-row>
            </template>
          </template>
          <el-row>
            <el-button type="info" @click="abrirDialogImprimir">Imprimir</el-button>
          </el-row>
          <ImprimirDialog :ordenId="selectedOrden?.id" :listaPedido="toRaw(pedidosList)"
            :visible="imprimirDialogVisible" @close="imprimirDialogVisible = false" />
          <el-row v-if="!selectedOrden.fechaEntrega" style="margin-top: 1rem">
            <el-button type="primary" @click="abrirDialogEntregar">Entregar</el-button>
          </el-row>
          <!-- <el-row v-if="!selectedOrden.fechaEntrega" style="margin-top: 1rem">
            <el-button type="warning" @click="modificarPedido">Modificar pedido</el-button>
          </el-row> -->
          <!-- Diálogo para modificar pedido -->
          <el-dialog v-model="modificarDialogVisible" title="Modificar pedido" width="400px"
            :close-on-click-modal="false">
            <el-form label-position="top">
              <el-form-item label="Comentarios">
                <el-input type="textarea" v-model="modificarComentarios" />
              </el-form-item>
              <el-form-item label="Adelanto">
                <el-input-number @focus="$event.target.select()" v-model="modificarAdelanto" :min="0"
                  :max="calculateTotal" />
              </el-form-item>
              <el-divider>Pedidos</el-divider>
              <div v-for="pedido in pedidosList" :key="pedido.id" style="margin-bottom: 1rem;">
                <el-row>
                  <el-col :span="12">
                    <span>{{ pedido.type }}</span>
                  </el-col>
                  <el-col :span="12">
                    <el-input-number v-if="pedido.type == 'lavado'" @focus="$event.target.select()" step=.1 precision=1
                      v-model="modificarCantidades[pedido.id!]" :min="1" />
                    <el-input-number v-else @focus="$event.target.select()" v-model="modificarCantidades[pedido.id!]"
                      :min="1" />
                  </el-col>
                </el-row>
              </div>
            </el-form>
            <template #footer>
              <el-button @click="modificarDialogVisible = false">Cancelar</el-button>
              <el-button type="primary" @click="guardarModificacionPedido">Guardar</el-button>
            </template>
          </el-dialog>
          <!-- Diálogo para entregar -->
          <el-dialog v-model="entregarMasDialogVisible" title="¿Desea entregar este pedido?" width="350px"
            :close-on-click-modal="false">
            <template #footer>
              <div class="dialog-footer">
                <el-button v-if="ordenesEntregarMas.length === 0" @click="marcarComoEntregado"
                  type="primary">Aceptar</el-button>
              </div>

              <!-- <el-button v-else @click="verPedidosYAgregarActual" type="success">Ver pedidos a entregar</el-button> -->
              <!-- <el-button @click="entregarMas" type="warning">Entregar más</el-button> -->
            </template>
          </el-dialog>
        </el-main>
      </el-col>


    </el-row>

    <!-- Botón flotante y Drawer para "Entregar más" -->
    <el-button v-if="ordenesEntregarMas.length > 0" type="primary"
      style="position: fixed; bottom: 40px; right: 40px; z-index: 2000; border-radius: 50%; width: 60px; height: 60px; box-shadow: 0 2px 12px rgba(0,0,0,0.2);"
      @click="drawerVisible = true">
      <span style="font-size: 24px;">🧺</span>
    </el-button>
    <el-drawer v-model="drawerVisible" title="Órdenes para entregar" direction="rtl" size="40%" :with-header="true">
      <div v-if="ordenesEntregarMas.length === 0">
        No hay órdenes para entregar.
      </div>
      <el-button v-if="ordenesEntregarMas.length > 0" type="success" style="margin-bottom: 1rem;"
        @click="entregarTodosLosPedidos">Entregar todos los pedidos</el-button>
      <div v-for="orden in ordenesEntregarMas" :key="orden.id"
        style="margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
        <div><b>Pedido número:</b> {{ orden.id }}</div>
        <div><b>Cliente:</b> {{ getOrderClientName(orden.id) }}</div>
        <div><b>Fecha de pedido:</b> {{ orden.fechaRegistro }}</div>
        <div v-if="orden.fechaEntrega"><b>Fecha de entrega:</b> {{ orden.fechaEntrega }}</div>
        <div><b>Comentarios:</b> {{ orden.comentarios }}</div>
        <div style="margin-top: 10px;">
          <el-row style="font-weight: bold;">
            <el-col :span="8">Servicio</el-col>
            <el-col :span="8">Cantidad</el-col>
            <el-col :span="8">Subtotal</el-col>
          </el-row>
          <el-row v-for="(item, idx) in pedidosEntregarMas[orden.id] || []" :key="idx">
            <el-col :span="8">{{ item.type }}</el-col>
            <el-col v-if="item.type === 'pieza'" :span="8">{{ item.quantity }} {{ item.description }}</el-col>
            <el-col v-else-if="item.type === 'lavado'" :span="8">{{ item.quantity }} kg</el-col>
            <el-col v-else-if="item.type === 'planchado'" :span="8">
              <span v-if="isNaN(Number(item.quantity)) || Number(item.quantity) === 0">{{ item.description }}</span>
              <span v-else>{{ item.quantity }} piezas</span>
            </el-col>
            <el-col :span="8">{{ item.subtotal === 0 ? 'Pendiente' : item.subtotal }}</el-col>
          </el-row>
          <el-row style="margin-top: 5px;">
            <el-col :span="16" style="text-align: right;"><b>Subtotal pedido:</b></el-col>
            <el-col :span="8">
              ${{(pedidosEntregarMas[orden.id] || []).reduce((acc, p) => acc + (p.subtotal || 0), 0)}}
            </el-col>
          </el-row>
        </div>
      </div>
      <el-row v-if="ordenesEntregarMas.length > 0" style="margin-top: 2rem;">
        <el-col :span="16" style="text-align: right;"><b>Total de todos los pedidos:</b></el-col>
        <el-col :span="8">
          ${{ordenesEntregarMas.reduce((total, orden) => total + (pedidosEntregarMas[orden.id]?.reduce((acc, p) => acc
            +
            (p.subtotal || 0), 0) || 0), 0)}}
        </el-col>
      </el-row>
    </el-drawer>

  </el-container>
</template>

<style scoped>
.el-row {
  width: 100%;
}

.el-header {
  margin-bottom: 20px;
}

.dialog-footer {
  text-align: center;
}
</style>