import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Order } from '../types/mainTypes'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([])

  const totalOrders = computed(() => orders.value.length)

  function setOrders(items: Order[]) {
    orders.value = [...items]
  }

  function addOrder(order: Omit<Order, 'id'> & Partial<Pick<Order, 'id'>>) {
    const nextId =
      order.id ?? (orders.value.length ? Math.max(...orders.value.map((item) => item.id)) + 1 : 1)

    const newOrder: Order = {
      id: nextId,
      clientIndex: order.clientIndex,
      fechaRegistro: order.fechaRegistro,
      comentarios: order.comentarios,
      adelanto: order.adelanto,
      fechaEntrega: order.fechaEntrega,
    }

    orders.value.push(newOrder)
    return newOrder
  }

  function getOrderById(id: number) {
    return orders.value.find((order) => order.id === id)
  }

  function getOrdersByClientIndex(clientIndex: number) {
    return orders.value.filter((order) => order.clientIndex === clientIndex)
  }

  function updateOrder(id: number, changes: Partial<Omit<Order, 'id'>>) {
    const index = orders.value.findIndex((order) => order.id === id)
    if (index === -1) return null

    orders.value[index] = {
      ...orders.value[index],
      ...changes,
    } as Order

    return orders.value[index]
  }

  function removeOrder(id: number) {
    const index = orders.value.findIndex((order) => order.id === id)
    if (index === -1) return false

    orders.value.splice(index, 1)
    return true
  }

  function clearOrders() {
    orders.value = []
  }

  function getOrders(limit?: number, offset: number = 0) {
    if (limit !== undefined) {
      return orders.value.slice(offset, offset + limit)
    }
    return orders.value.slice(offset)
  }

  function getOrdersByDate(stringDate: string) {
    return orders.value.filter((order) => order.fechaRegistro.startsWith(stringDate))
  }

  return {
    orders,
    totalOrders,
    setOrders,
    addOrder,
    getOrderById,
    getOrdersByClientIndex,
    updateOrder,
    removeOrder,
    clearOrders,
    getOrders,
    getOrdersByDate,
  }
})