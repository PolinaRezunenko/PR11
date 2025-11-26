// Генерация 150 товаров (имитация сервера)
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

const allProducts = generateAllProducts()

// Функция для получения товаров с пагинацией и фильтрацией
export function getProducts(page = 1, perPage = 10, filters = {}) {
  let filteredProducts = [...allProducts]
  
  // Применяем фильтры
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    filteredProducts = filteredProducts.filter(product => 
      product.title.toLowerCase().includes(searchTerm)
    )
  }
  
  if (filters.category) {
    filteredProducts = filteredProducts.filter(product => 
      product.category === filters.category
    )
  }
  
  if (filters.minPrice) {
    filteredProducts = filteredProducts.filter(product => 
      product.price >= parseInt(filters.minPrice)
    )
  }
  
  // Вычисляем пагинацию
  const total = filteredProducts.length
  const lastPage = Math.ceil(total / perPage)
  const from = (page - 1) * perPage
  const to = from + perPage
  
  const data = filteredProducts.slice(from, to)
  
  // Мета-данные для пагинации
  const meta = {
    current_page: page,
    last_page: lastPage,
    per_page: perPage,
    from: from + 1,
    to: Math.min(to, total),
    total: total,
    has_prev: page > 1,
    has_next: page < lastPage
  }
  
  // Ссылки для пагинации
  const links = {
    first: 1,
    last: lastPage,
    prev: page > 1 ? page - 1 : null,
    next: page < lastPage ? page + 1 : null
  }
  
  return {
    data,
    meta,
    links
  }
}

// Получение всех категорий для фильтра
export function getCategories() {
  return [...new Set(allProducts.map(product => product.category))]
}