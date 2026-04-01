<template>
  <el-container>
    <el-header>
      Lista de clientes
    </el-header>
    <el-main>
      <el-row>
        <ElCol :span="12">
          <el-input v-model="searchQuery" placeholder="Buscar clientes..." clearable @clear="resetSearch"
            @keyup.enter="handleSearch">
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </ElCol>
        <ElCol :span="12" style="text-align: right;">
          <el-button type="success" @click="openAddDialog">Agregar Cliente</el-button>
        </ElCol>
      </el-row>
      <el-table :data="paginatedClients" style="width: 100%" v-loading="loading" pag
        empty-text="No hay clientes para mostrar">
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="nombre" label="Nombre" sortable />
        <el-table-column prop="telefono" label="Teléfono" sortable />

        <el-table-column label="Acciones" width="140">
          <template #default="scope">
            <el-button type="primary" size="small" :icon="Edit" @click="handleEdit(scope.row)" />
          </template>
        </el-table-column>
      </el-table>


    </el-main>
  </el-container>
  <div>
    <!-- Diálogo para agregar cliente -->
    <el-dialog v-model="addDialogVisible" title="Agregar Cliente" width="30%">
      <el-form :model="newClient" label-position="top" @submit.prevent="addClient">
        <el-form-item label="Nombre">
          <el-input v-model="newClient.name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">Cancelar</el-button>
          <el-button type="primary" @click="addClient">Agregar</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Tabla de clientes -->

    <!-- Paginación -->
    <div class="pagination">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]"
        layout="total, sizes, prev, pager, next" :total="filteredClients.length" @size-change="handleSizeChange"
        @current-change="handleCurrentChange" />
    </div>

    <!-- Diálogo de edición -->
    <el-dialog v-model="dialogVisible" :title="`Editar Cliente ${editingClient?.id}`" width="30%">
      <el-form :model="editingClient" label-position="top" @submit.prevent="saveClient">
        <el-form-item label="Nombre">
          <el-input v-model="editingClient.name" />
        </el-form-item>
        <el-form-item label="Teléfono">
          <el-input v-model="editingClient.phone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancelar</el-button>
          <el-button type="primary" @click="saveClient"> Guardar </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, toRaw } from 'vue'
import { Search, Edit, Plus } from '@element-plus/icons-vue'
import { ElCol, ElCollapse, ElContainer, ElHeader, ElMain, ElMessage, ElNotification, ElRow, ElTable } from 'element-plus'
import type { Client } from "../types/mainTypes.ts";
import { useClientsStore } from '@/stores/clients.ts';


const clients = ref<Client[]>([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const editingClient = ref<Client | null>(null)

// Estado para agregar cliente
const addDialogVisible = ref(false)
const newClient = ref<Client>({ name: '', phone: '', id: 0 })

const openAddDialog = () => {
  newClient.value = { name: '', phone: '', id: 0 }
  addDialogVisible.value = true
}

const addClient = async () => {
  if (!newClient.value.name.trim()) {
    ElMessage.error('Nombre es obligatorio')
    return
  }
  try {
    loading.value = true
    useClientsStore().addClient(newClient.value) // Agregar cliente al store
    ElMessage.success('Cliente agregado correctamente')
    loading.value = false
    addDialogVisible.value = false
  }
  catch (error) {
    ElMessage.error('Error al agregar cliente')
    console.error(error)
    loading.value = false
  }
}

// Obtener clientes (simulando llamada API)
const fetchClients = async () => {
  loading.value = true
  clients.value = []
  clients.value = useClientsStore().clients;
  loading.value = false
}

// Filtrar clientes basado en la búsqueda
const filteredClients = computed(() => {

  if (!searchQuery.value) return clients.value

  const query = searchQuery.value.toLowerCase()
  return clients.value.filter(
    (client: Client) =>
      client.name.toLowerCase().includes(query) ||
      (client.phone && client.phone.toLowerCase().includes(query)) ||
      client.id.toString().includes(query))
})

// Paginación
const paginatedClients = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredClients.value.slice(start, end)
})

// Manejar búsqueda
const handleSearch = () => {
  currentPage.value = 1 // Resetear a la primera página al buscar
}

// Resetear búsqueda
const resetSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

// Manejar cambio de tamaño de página
const handleSizeChange = (val: number) => {
  pageSize.value = val
}

// Manejar cambio de página
const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// Editar cliente
const handleEdit = (client: Client) => {
  editingClient.value = { ...client }
  dialogVisible.value = true
}

// Guardar cambios del cliente
const saveClient = async () => {
  if (!editingClient.value) return

  try {
    loading.value = true
    useClientsStore().updateClient(editingClient.value.id, editingClient.value) // Actualizar cliente en el store
    ElMessage.success('Cliente actualizado correctamente')
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error('Error al actualizar el cliente')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// Cargar datos al montar el componente
onMounted(() => {
  fetchClients()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  margin-bottom: 20px;
  max-width: 400px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.el-table {
  margin-top: 20px;
}
</style>