import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Client } from '../types/mainTypes'

export const useClientsStore = defineStore('clients', () => {
  const clients = ref<Client[]>([])

  const totalClients = computed(() => clients.value.length)

  function setClients(items: Client[]) {
    clients.value = [...items]
  }

  function getClientById(id: number) {
    return clients.value.find((client) => client.id === id)
  }

  function addClient(client: Omit<Client, 'id'> & Partial<Pick<Client, 'id'>>) {
    const nextId =
      client.id ?? (clients.value.length ? Math.max(...clients.value.map((c) => c.id)) + 1 : 1)

    const newClient: Client = {
      id: nextId,
      name: client.name,
      phone: client.phone,
    }

    clients.value.push(newClient)
    return newClient
  }

  function updateClient(id: number, changes: Partial<Omit<Client, 'id'>>) {
    const index = clients.value.findIndex((client) => client.id === id)
    if (index === -1) return null

    clients.value[index] = {
      ...clients.value[index],
      ...changes,
    }

    return clients.value[index]
  }

  function removeClient(id: number) {
    const index = clients.value.findIndex((client) => client.id === id)
    if (index === -1) return false

    clients.value.splice(index, 1)
    return true
  }

  function clearClients() {
    clients.value = []
  }

  return {
    clients,
    totalClients,
    setClients,
    getClientById,
    addClient,
    updateClient,
    removeClient,
    clearClients,
  }
})