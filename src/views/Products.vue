<template>
  <div class="products-page">
    <div class="filters">
      <div class="filter-group">
        <label for="search">Поиск:</label>
        <input
          id="search"
          v-model="filters.search"
          type="text"
          placeholder="Название товара..."
          @input="handleFilterChange"
        >
      </div>
      
      <div class="filter-group">
        <label for="category">Категория:</label>
        <select
          id="category"
          v-model="filters.category"
          @change="handleFilterChange"
        >
          <option value="">Все категории</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="minPrice">Мин. цена:</label>
        <input
          id="minPrice"
          v-model.number="filters.minPrice"
          type="number"
          placeholder="0"
          @input="handleFilterChange"
        >
      </div>
      
      <button @click="clearFilters" class="clear-btn">
        Очистить фильтры
      </button>
    </div>

    <div class="products-list">
      <div v-if="loading" class="loading">Загрузка...</div>
      
      <div v-else>
        <div class="products-grid">
          <div
            v-for="product in products"
            :key="product.id"
            class="product-card"
          >
            <h3>{{ product.title }}</h3>
            <p class="category">{{ product.category }}</p>
            <p class="price">{{ product.price }} руб.</p>
          </div>
        </div>
        
        <div v-if="products.length === 0" class="no-products">
          Товары не найдены
        </div>
      </div>
    </div>

    <!-- Пагинация -->
    <div v-if="meta.total > 0" class="pagination">
      <button
        :disabled="!links.prev"
        @click="goToPage(links.prev)"
        class="pagination-btn"
      >
        Назад
      </button>
      
      <button
        v-for="pageNum in pageNumbers"
        :key="pageNum"
        @click="goToPage(pageNum)"
        :class="['pagination-btn', { active: pageNum === meta.current_page }]"
      >
        {{ pageNum }}
      </button>
      
      <button
        :disabled="!links.next"
        @click="goToPage(links.next)"
        class="pagination-btn"
      >
        Вперёд
      </button>
    </div>

    <div class="pagination-info" v-if="meta.total > 0">
      Показано {{ meta.from }}-{{ meta.to }} из {{ meta.total }} товаров
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProducts, getCategories } from '../services/productService.js'

export default {
  name: 'Products',
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    // Реактивные данные
    const products = ref([])
    const meta = ref({})
    const links = ref({})
    const loading = ref(false)
    const categories = ref([])
    
    // Фильтры
    const filters = ref({
      search: '',
      category: '',
      minPrice: ''
    })

    // Вычисляемые свойства для пагинации
    const pageNumbers = computed(() => {
      if (!meta.value.last_page) return []
      
      const current = meta.value.current_page
      const last = meta.value.last_page
      const delta = 2
      const range = []
      
      for (let i = Math.max(2, current - delta); i <= Math.min(last - 1, current + delta); i++) {
        range.push(i)
      }
      
      if (current - delta > 2) {
        range.unshift('...')
      }
      if (current + delta < last - 1) {
        range.push('...')
      }
      
      range.unshift(1)
      if (last !== 1) range.push(last)
      
      return range
    })

    // Загрузка товаров
    const loadProducts = async () => {
      loading.value = true
      
      try {
        const page = parseInt(route.query.page) || 1
        const result = getProducts(page, 10, filters.value)
        
        products.value = result.data
        meta.value = result.meta
        links.value = result.links
      } catch (error) {
        console.error('Ошибка загрузки товаров:', error)
      } finally {
        loading.value = false
      }
    }

    // Переход на страницу
    const goToPage = (page) => {
      if (page === '...') return
      
      const query = { ...route.query, page }
      router.push({ query })
    }

    // Обработчик изменения фильтров
    const handleFilterChange = () => {
      const query = { ...filters.value, page: 1 }
      
      // Удаляем пустые значения
      Object.keys(query).forEach(key => {
        if (!query[key]) delete query[key]
      })
      
      router.push({ query })
    }

    // Очистка фильтров
    const clearFilters = () => {
      filters.value = {
        search: '',
        category: '',
        minPrice: ''
      }
      router.push({ name: 'Products' })
    }

    // Наблюдатель за изменениями route
    watch(
      () => route.query,
      (newQuery) => {
        // Обновляем фильтры из query
        filters.value.search = newQuery.search || ''
        filters.value.category = newQuery.category || ''
        filters.value.minPrice = newQuery.minPrice || ''
        
        // Загружаем товары
        loadProducts()
      },
      { immediate: true }
    )

    // Инициализация
    onMounted(() => {
      categories.value = getCategories()
    })

    return {
      products,
      meta,
      links,
      loading,
      categories,
      filters,
      pageNumbers,
      goToPage,
      handleFilterChange,
      clearFilters
    }
  }
}
</script>

<style scoped>
.products-page {
  max-width: 1000px;
  margin: 0 auto;
}

.filters {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  align-items: end;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

.filter-group input,
.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.clear-btn {
  padding: 8px 16px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.clear-btn:hover {
  background: #ff3742;
}

.products-list {
  min-height: 400px;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.product-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.product-card h3 {
  margin-bottom: 10px;
  color: #333;
}

.product-card .category {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.product-card .price {
  font-weight: bold;
  color: #2ed573;
  font-size: 16px;
}

.no-products {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 18px;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin: 30px 0;
  flex-wrap: wrap;
}

.pagination-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  min-width: 40px;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8f9fa;
}

.pagination-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  text-align: center;
  color: #666;
  margin-bottom: 20px;
}
</style>