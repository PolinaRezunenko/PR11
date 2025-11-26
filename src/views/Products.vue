<template>
  <div class="products-page">
    <div class="filters">
      <div class="filter-group">
        <label for="search">Поиск:</label>
        <input
          id="search"
          v-model="search"
          type="text"
          placeholder="Название товара..."
          class="filter-input"
        >
      </div>
      
      <div class="filter-group">
        <label for="category">Категория:</label>
        <select
          id="category"
          v-model="category"
          class="filter-select"
        >
          <option value="">Все категории</option>
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="minPrice">Мин. цена:</label>
        <input
          id="minPrice"
          v-model.number="minPrice"
          type="number"
          placeholder="0"
          class="filter-input"
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
            v-for="product in paginatedProducts"
            :key="product.id"
            class="product-card"
          >
            <h3>{{ product.title }}</h3>
            <p class="category">{{ product.category }}</p>
            <p class="price">{{ product.price }} руб.</p>
          </div>
        </div>
        
        <div v-if="filteredProducts.length === 0" class="no-products">
          Товары не найдены
        </div>
      </div>
    </div>

    <!-- Пагинация -->
    <div v-if="filteredProducts.length > 0" class="pagination">
      <button
        :disabled="currentPage === 1"
        @click="prevPage"
        class="pagination-btn"
      >
        Назад
      </button>
      
      <button
        v-for="pageNum in pages"
        :key="pageNum"
        @click="goToPage(pageNum)"
        :class="['pagination-btn', { active: pageNum === currentPage }]"
      >
        {{ pageNum }}
      </button>
      
      <button
        :disabled="currentPage === totalPages"
        @click="nextPage"
        class="pagination-btn"
      >
        Вперёд
      </button>
    </div>

    <div class="pagination-info" v-if="filteredProducts.length > 0">
      Показано {{ meta.from }}-{{ meta.to }} из {{ filteredProducts.length }} товаров
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Генерация товаров
function generateAllProducts() {
  const items = []
  for (let i = 1; i <= 150; i++) {
    items.push({
      id: i,
      title: `Товар ${i}`,
      price: 50 + i * 10,
      category: i % 3 === 0 ? 'Электроника' : i % 3 === 1 ? 'Одежда' : 'Книги'
    })
  }
  return items
}

export default {
  name: 'Products',
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    // Состояние интерфейса
    const currentPage = ref(1)
    const perPage = 10
    const search = ref('')
    const category = ref('')
    const minPrice = ref('')
    const loading = ref(false)
    
    const allProducts = ref([])
    const categories = ref([])

    // Мета-данные для пагинации
    const meta = computed(() => {
      const total = filteredProducts.value.length
      const from = (currentPage.value - 1) * perPage + 1
      const to = Math.min(currentPage.value * perPage, total)
      
      return {
        from,
        to,
        total
      }
    })

    // Вычисляемые значения
    const filteredProducts = computed(() => {
      let filtered = allProducts.value
      
      // Фильтр по поиску
      if (search.value) {
        const searchTerm = search.value.toLowerCase()
        filtered = filtered.filter(product => 
          product.title.toLowerCase().includes(searchTerm)
        )
      }
      
      // Фильтр по категории
      if (category.value) {
        filtered = filtered.filter(product => 
          product.category === category.value
        )
      }
      
      // Фильтр по минимальной цене
      if (minPrice.value) {
        filtered = filtered.filter(product => 
          product.price >= parseInt(minPrice.value)
        )
      }
      
      return filtered
    })

    const totalPages = computed(() => {
      return Math.max(1, Math.ceil(filteredProducts.value.length / perPage))
    })

    const paginatedProducts = computed(() => {
      // Корректировка текущей страницы
      if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value
      }
      
      const start = (currentPage.value - 1) * perPage
      return filteredProducts.value.slice(start, start + perPage)
    })

    const pages = computed(() => {
      return Array.from({ length: totalPages.value }, (_, i) => i + 1)
    })

    // Синхронизация с URL
    function syncQueryWithState() {
      const query = {
        page: String(currentPage.value),
        search: search.value || undefined,
        category: category.value || undefined,
        minPrice: minPrice.value || undefined
      }
      
      // Удаляем undefined значения
      Object.keys(query).forEach(key => {
        if (query[key] === undefined) delete query[key]
      })
      
      router.push({ 
        name: 'Products', 
        query 
      })
    }

    // Очистка фильтров
    function clearFilters() {
      search.value = ''
      category.value = ''
      minPrice.value = ''
      currentPage.value = 1
    }

    // Переходы между страницами
    function goToPage(n) {
      if (n < 1 || n > totalPages.value) return
      currentPage.value = n
    }

    function prevPage() {
      goToPage(currentPage.value - 1)
    }

    function nextPage() {
      goToPage(currentPage.value + 1)
    }

    // Watchers
    watch(currentPage, () => {
      syncQueryWithState()
    })

    watch([search, category, minPrice], () => {
      currentPage.value = 1
      syncQueryWithState()
    })

    // Восстановление состояния из URL
    onMounted(() => {
      loading.value = true
      
      // Инициализация данных
      setTimeout(() => {
        allProducts.value = generateAllProducts()
        categories.value = [...new Set(allProducts.value.map(p => p.category))]
        
        // Восстановление из query
        const query = route.query
        
        if (typeof query.page === 'string') {
          const pageNum = parseInt(query.page, 10)
          if (!isNaN(pageNum) && pageNum > 0) {
            currentPage.value = pageNum
          }
        }
        
        if (typeof query.search === 'string') {
          search.value = query.search
        }
        
        if (typeof query.category === 'string') {
          category.value = query.category
        }
        
        if (typeof query.minPrice === 'string') {
          minPrice.value = query.minPrice
        }
        
        loading.value = false
      }, 300) // Имитация загрузки
    })

    return {
      // Состояние
      currentPage,
      search,
      category,
      minPrice,
      categories,
      loading,
      meta,
      
      // Вычисляемые
      filteredProducts,
      paginatedProducts,
      totalPages,
      pages,
      
      // Методы
      goToPage,
      prevPage,
      nextPage,
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

.filter-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.clear-btn {
  padding: 8px 16px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  height: fit-content;
  transition: background-color 0.2s;
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
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.product-card h3 {
  margin-bottom: 10px;
  color: #333;
  font-size: 16px;
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
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #007bff;
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
  font-size: 14px;
}
</style>