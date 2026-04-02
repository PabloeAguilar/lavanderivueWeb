<script lang="ts" setup>
import { Delete } from '@element-plus/icons-vue'
import { reactive, ref, toRaw, computed, onMounted } from "vue";
import ImprimirDialog from './ImprimirDialog.vue';
import type { Order } from "../types/mainTypes.ts";
import { Pedido } from "../types/classes/Pedido.js";
import type { Client, SugerenciaPieza, IndividualPiece } from "../types/mainTypes.ts";
import { ElNotification, ElAlert, ElAutocomplete, ElContainer, ElButton,
  ElCollapse, ElCollapseItem, ElMain, ElInputNumber, ElInput, ElFooter, ElRow, ElCol, ElHeader } from "element-plus";
import { useClientsStore } from '@/stores/clients.ts';
import { getListOfSuggestions } from '@/helpers/stores.ts';
import { useOrdersStore } from '@/stores/orders.ts';
import { formatDateString } from '@/helpers/totales.ts';
import { usePedidosStore } from '@/stores/pedidos.ts';

const clientsStore = useClientsStore();
let activeCollapse = ref<string | number>('1');
let nombreCliente = ref('');
let idCliente: number | null = null;
let precioRopa = ref(18);
let precioPlanchado = ref(7);
let ropa = ref(0.0);
let planchados = ref({
  descripcion: '',
  piezas: 0,
});
let piezaIndividual = reactive<IndividualPiece>({ descripcion: '', piezas: 0, precio: 0 });
let listaPedido: Pedido[] = reactive([]);
let totalPedidos = ref(0);
let mensaje = ref('');
let tipoMensaje = ref('');
let comentariosGenerales = ref('');
let adelanto = ref(0);
let ordenId = ref(0);
let imprimirDialogVisible = ref(false);
const restante = computed(() => {
  return totalPedidos.value - adelanto.value;
})

function onInputAdelanto() {
  if (adelanto.value > totalPedidos.value) {
    adelanto.value = totalPedidos.value;
  }
}

function agregarRopa() {
  let pedido = new Pedido(0, 'lavado', ropa.value, precioRopa.value)
  listaPedido.push(pedido)
  totalPedidos.value += Math.floor(precioRopa.value * ropa.value)
  ropa.value = 1
}

function removerSubpedido(index: number) {
  totalPedidos.value -= listaPedido[index]!.subtotal
  listaPedido.splice(index, 1)
}

function agregarPlanchados() {
  let pedido = new Pedido(0, 'planchado', planchados.value.piezas, precioPlanchado.value);
  pedido.description = planchados.value.descripcion;
  totalPedidos.value += pedido.subtotal
  listaPedido.push(pedido)
  planchados.value.piezas = 0;
  planchados.value.descripcion = '';
}

function agregarPiezaIndividual() {
  let individual = new Pedido(0, 'pieza', piezaIndividual.piezas, piezaIndividual.precio)
  individual.description = piezaIndividual.descripcion;
  totalPedidos.value += individual.subtotal;
  listaPedido.push(individual);
  piezaIndividual.descripcion = ''
  piezaIndividual.piezas = 1;
  piezaIndividual.precio = 70
}

function comprobacionPedido(): string | undefined {
  if (nombreCliente.value.trim().length < 1) {
    return 'Es necesario un nombre del cliente'
  }
  if (listaPedido.length < 1) {
    return 'Es necesario algún pedido de ropa, planchados, etc'
  }
  return undefined;
}

async function registrarPedido() {
  let observacionesPedido: string | undefined = comprobacionPedido();
  if (observacionesPedido !== undefined) {
    mensaje.value = observacionesPedido;
    tipoMensaje.value = 'error';
    reiniciarMensaje();
    return;
  }
  const idClienteObtenido = clientsStore.getClientIdByName(nombreCliente.value);
  const newOrder = {
    fechaRegistro: formatDateString(new Date()),
    clientIndex: idClienteObtenido,
    comentarios: comentariosGenerales.value,
    adelanto: adelanto.value,
  }
  const addedOrder =useOrdersStore().addOrder(newOrder);
  listaPedido.forEach(pedido => {
    usePedidosStore().addPedido(new Pedido(addedOrder.id, pedido.type, pedido.quantity, pedido.price, pedido.description))
  })
  reiniciarMensaje();
  ordenId.value = addedOrder.id!;

}

function mostrarMensaje(_titulo: string, tipo: string, mensaje: string, duration: number) {
  ElNotification({
    title: _titulo,
    type: "",
    message: mensaje,
    duration: duration
  });
}

// Eliminar imprimirPedido, ahora se usa el dialog

function reiniciarMensaje() {
  setTimeout(function () {
    mensaje.value = '';

  }, 5000)

}

function onCloseMensaje() {
  mensaje.value = '';
}

const querySearch = (querystring: string, cb: (arg: any) => void) => {
  const results = clientsStore.clients.at(0) ? clientsStore.clients.filter((client: Client) =>
    client.name.toLowerCase().includes(querystring.toLowerCase())
  ) : [];
  const suggestions = results.map((client: Client) => {
    return {
      value: client.name,
      id: client.id,
    };
  });
  cb(suggestions);
}

const handleSelect = (item: Record<string, any>) => {
  idCliente = item.id
}

function restartForm() {
  idCliente = null;
  nombreCliente.value = '';
  listaPedido.length = 0;
  adelanto.value = 0;
  totalPedidos.value = 0;
  comentariosGenerales.value = '';
  ordenId.value = 0;
}

function handleClearClient() {
  idCliente = null;
}

onMounted(() => {
  precioPlanchado.value = 20;
  precioRopa.value = 12;
  fetchPiezas();
});

const sugerenciasPiezas = ref<SugerenciaPieza[]>([]);

function fetchPiezas() {
  sugerenciasPiezas.value = getListOfSuggestions();
}

const querySearchPieza = (queryString: string, cb: any) => {
  const results = queryString
    ? sugerenciasPiezas.value.filter(createFilterPieza(queryString))
    : sugerenciasPiezas.value
  // call callback function to return suggestions
  cb(mapPiezaToSuggestion(results))
}

function mapPiezaToSuggestion(piezas: SugerenciaPieza[]) {
  return piezas.map(pieza => ({
    value: pieza.nombre,
    precio_individual: pieza.precio_individual,
    id: pieza.id,
    nombre: pieza.nombre
  }));
}

const createFilterPieza = (queryString: string) => {
  return (pieza: SugerenciaPieza) => {
    return (
      pieza.nombre.toLowerCase().indexOf(queryString.toLowerCase()) === 0
    )
  }
}

const handleSelectPieza = (item: SugerenciaPieza) => {
  piezaIndividual.descripcion = item.nombre;
  piezaIndividual.precio = item.precio_individual;
  piezaIndividual.piezas = 1; // Resetear cantidad a 1 al seleccionar
}


function imprimirPedido() {
  window.print();
}

</script>

<template>
  <el-row style="margin-bottom: 20px" :gutter=20 v-if="mensaje.length > 0">
    <el-col :span=24>
      <el-alert @close="onCloseMensaje" :type="tipoMensaje"> {{ mensaje }}</el-alert>
    </el-col>
  </el-row>

  <el-container class="containerModulo">
    <el-row :gutter=20>
      <el-col :span=12 >
        <el-header>
          Pedido
        </el-header>
        <el-row>
          <el-col>
            <p>Cliente</p>
          </el-col>
        </el-row>
        <el-row>
          <el-col>
            <el-autocomplete :fetch-suggestions="querySearch" @select="handleSelect" clearable
              @clear="handleClearClient" placeholder="Nombre del cliente" v-model="nombreCliente" />
          </el-col>
        </el-row>
        <el-collapse class="no-print" v-model="activeCollapse" accordion>
          <el-collapse-item title="Ropa" name="1">
            <el-main class="registroInfoPedido" style="padding-top: 0;">
              <el-row>
                <el-col :span=12 class="alineadoIzquierda">
                  <p>Kilos</p>
                </el-col>
                <el-col :span=12>
                  <p>Precio</p>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span=12 class="alineadoIzquierda">
                  <el-input-number @focus="$event.target.select()" :min=1 :max=9999 v-model="ropa" :step=.1 :precision=1 />
                </el-col>
                <el-col :span=12>
                  <el-input-number :min=1 :max=9999 placeholder="precio" v-model="precioRopa" :step="1" />
                </el-col>
              </el-row>
              <el-row>

              </el-row>
              <el-row>

              </el-row>
            </el-main>
            <el-footer class="alineadoIzquierda">
              <el-button @click="agregarRopa()" type="primary">Agregar</el-button>
            </el-footer>
          </el-collapse-item>
          <el-collapse-item title="Planchados" name="2">
            <el-main class="registroInfoPedido">
              <el-row>
                <el-col :span=12 class="alineadoIzquierda">
                  <p>Piezas</p>
                </el-col>
                <el-col :span=12>
                  <p>Precio</p>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span=12 class="alineadoIzquierda">
                  <el-input-number @focus="$event.target.select()" :min=0 :max=9999 placeholder="Cantidad"
                    v-model="planchados.piezas" :step=1 />
                </el-col>
                <el-col :span=12>
                  <el-input-number @focus="$event.target.select()" :min=1 :max=9999 placeholder="precio"
                    v-model="precioPlanchado" :step=1 />
                </el-col>
              </el-row>
              <el-row>
                <el-col>
                  <p>Notas</p>
                </el-col>
              </el-row>
              <el-row>
                <el-col>
                  <el-input placeholder="Que piezas" v-model="planchados.descripcion" />
                </el-col>
              </el-row>
              <el-row>
              </el-row>
            </el-main>
            <el-footer class="alineadoIzquierda">
              <el-button @click="agregarPlanchados()" type="primary">Agregar</el-button>
            </el-footer>
          </el-collapse-item>
          <el-collapse-item title="Individuales" name="3">
            <el-main class="registroInfoPedido">
              <el-row>
                <el-col>
                  <p>Pieza</p>
                </el-col>
              </el-row>
              <el-row>
                <el-col>
                  <el-autocomplete v-model="piezaIndividual.descripcion" placeholder="Almohada, edredon, etc"
                    :fetch-suggestions="querySearchPieza" @select="handleSelectPieza" clearable />
                </el-col>
              </el-row>
              <el-row>
                <el-col :span=12 class="alineadoIzquierda">
                  <p>Cantidad</p>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span=12 class="alineadoIzquierda">
                  <el-input-number @focus="$event.target.select()" :min=1 placeholder="10, 9"
                    v-model="piezaIndividual.piezas" />
                </el-col>
              </el-row>
              <el-row>
                <el-col :span=12 class="alineadoIzquierda">
                  <p>Precio</p>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span=12 class="alineadoIzquierda">
                  <el-input-number @focus="$event.target.select()" placeholder="70" :min=20 :step=5
                    v-model="piezaIndividual.precio">
                    <template #prefix>
                      <span>$</span>
                    </template>
                  </el-input-number>
                </el-col>
              </el-row>
            </el-main>
            <el-footer class="alineadoIzquierda">
              <el-button @click="agregarPiezaIndividual()" type="primary">Agregar</el-button>
            </el-footer>
          </el-collapse-item>
        </el-collapse>
        <el-input class="no-print" placeholder="Comentarios adicionales" v-model="comentariosGenerales" />
      </el-col>
      <el-col :span=12>
        <el-header>
          Resumen
        </el-header>
        <el-row :gutter=20>
          <el-col :span=2>

          </el-col>
          <el-col :span=8>
            <p>Descripción</p>
          </el-col>
          <el-col :span=8>
            <p>Cantidad</p>
          </el-col>
          <el-col :span=6 class="alineadoIzquierda">
            <p>Subtotal</p>
          </el-col>
        </el-row>
        <el-row v-for="(item, index) in listaPedido" :key="index" :gutter=20>
          <el-col :span="2">
            <el-button v-if="ordenId == 0" circle @click="removerSubpedido(index)" type="danger" :icon="Delete" />
          </el-col>
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
            <p>${{ totalPedidos }}</p>
          </el-col>
        </el-row>
        <el-row :gutter=20>
          <el-col :span="8" :offset="2">
            <p>Adelanto:</p>
          </el-col>
          <el-col class="alineadoDerecha" style="display: flex;" :span="12" :offset="2">
            <el-input-number v-model="adelanto" :min="0" @change="onInputAdelanto" />
          </el-col>
        </el-row>
        <el-row :gutter=20>
          <el-col :span="8" :offset="2">
            <p>Restante:</p>
          </el-col>
          <el-col class="alineadoIzquierda" :span="6" :offset="8">
            <p>${{ restante }}</p>
          </el-col>
        </el-row>
        <el-footer>
          <el-row v-if="ordenId == 0" style="margin-bottom: 10px">
            <el-button class="no-print" type="success" @click="registrarPedido">Registrar</el-button>
          </el-row>
          <el-row v-if="ordenId != 0" style="margin-top: 10px">
            <el-button class="no-print" type="primary" plain @click="imprimirPedido">Imprimir</el-button>
          </el-row>
          <ImprimirDialog :ordenId="ordenId" :listaPedido="toRaw(listaPedido)" :visible="imprimirDialogVisible"
            @close="imprimirDialogVisible = false" />
          <el-row style="margin-top: 10px">
            <el-button class="no-print" plain type="danger" @click="restartForm">Limpiar</el-button>
          </el-row>

        </el-footer>

      </el-col>

    </el-row>
  </el-container>
</template>

<style scoped>
.containerModulo {
  width: 100%;
}

.el-row {
  width: 100%;
}

.registroInfoPedido .el-col-24 {
  display: flex;
  justify-content: start;
}

.alineadoIzquierda {
  display: flex;
  justify-content: flex-start;
}

.alineadoDerecha {
  display: flex;
  justify-content: flex-end;
}

@media print {
  .no-print {
    display: none;
  }
}
</style>