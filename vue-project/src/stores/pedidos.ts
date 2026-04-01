import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { Pedido } from '../types/classes/Pedido'

export const usePedidosStore = defineStore('pedidos', () => {
  const pedidos = ref<Pedido[]>([])

  const totalPedidos = computed(() =>
    pedidos.value.reduce((total, pedido) => total + pedido.subtotal, 0),
  )

  function setPedidos(items: Pedido[]) {
    pedidos.value = [...items]
  }

  function addPedido(pedido: Pedido) {
    pedidos.value.push(pedido)
  }

  function createAndAddPedido(data: {
    idOrder: number
    type: string
    quantity: number
    price: number
    description?: string | null
    id?: number
  }) {
    const pedido = new Pedido(
      data.idOrder,
      data.type,
      data.quantity,
      data.price,
      data.description ?? null,
      data.id,
    )
    pedidos.value.push(pedido)
    return pedido
  }

  function getPedidosByOrder(idOrder: number) {
    return pedidos.value.filter((pedido) => pedido.idOrder === idOrder)
  }

  function removePedidoByIndex(index: number) {
    if (index < 0 || index >= pedidos.value.length) return false
    pedidos.value.splice(index, 1)
    return true
  }

  function clearPedidos() {
    pedidos.value = []
  }

  function updatePedido(id: number, changes: Partial<Omit<Pedido, 'id' >>) {
    const index = pedidos.value.findIndex((pedido) => pedido.id === id)
    if (index === -1) return null
    const pedido = pedidos.value[index]
    const updatedPedido = new Pedido(
      changes.idOrder ?? pedido!.idOrder,
      changes.type ?? pedido!.type,
      changes.quantity ?? pedido!.quantity,
      changes.price ?? pedido!.price,
      changes.description ?? pedido!.description,
      pedido!.id,)
      
    pedidos.value[index] = updatedPedido
    return updatedPedido
  }


  return {
    pedidos,
    totalPedidos,
    setPedidos,
    addPedido,
    createAndAddPedido,
    getPedidosByOrder,
    removePedidoByIndex,
    clearPedidos,
    updatePedido,
  }
})