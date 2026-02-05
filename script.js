// API Configuration
const API_BASE_URL = 'https://api.escuelajs.co/api/v1';
const PRODUCTS_API = `${API_BASE_URL}/products`;

let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let pageSize = 10;
let sortBy = null; // 'title-asc', 'title-desc', 'price-asc', 'price-desc'
let currentDetail = null;

// Load Products from API
async function loadProducts() {
    try {
        const response = await fetch(PRODUCTS_API);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        allProducts = await response.json();
        
        // Ensure images is an array
        allProducts = allProducts.map(product => ({
            ...product,
            images: Array.isArray(product.images) ? product.images : [product.images]
        }));
        
        filteredProducts = [...allProducts];
        renderTable();
        setupEventListeners();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsTableBody').innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger py-5">
                    Lỗi tải dữ liệu. Vui lòng tải lại trang.
                </td>
            </tr>
        `;
    }
}

// Setup Event Listeners
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const pageSizeSelect = document.getElementById('pageSizeSelect');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const sortTitleBtn = document.getElementById('sortTitle');
    const sortPriceBtn = document.getElementById('sortPrice');
    const exportBtn = document.getElementById('exportBtn');
    
    searchInput.addEventListener('input', handleSearch);
    pageSizeSelect.addEventListener('change', handlePageSizeChange);
    prevBtn.addEventListener('click', handlePrevPage);
    nextBtn.addEventListener('click', handleNextPage);
    sortTitleBtn.addEventListener('click', handleSortTitle);
    sortPriceBtn.addEventListener('click', handleSortPrice);
    exportBtn.addEventListener('click', handleExport);
    
    // Detail & Edit Events
    const editBtn = document.getElementById('editBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const createBtn = document.getElementById('createBtn');
    const submitCreateBtn = document.getElementById('submitCreateBtn');
    
    if (editBtn) editBtn.addEventListener('click', openEditModal);
    if (saveEditBtn) saveEditBtn.addEventListener('click', handleSaveEdit);
    if (createBtn) createBtn.addEventListener('click', () => {
        document.getElementById('createForm').reset();
        const modal = new bootstrap.Modal(document.getElementById('createModal'));
        modal.show();
    });
    if (submitCreateBtn) submitCreateBtn.addEventListener('click', handleCreateProduct);
}

// Search Handler
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    applySorting();
    renderTable();
}

// Render Table
function renderTable() {
    const productsTableBody = document.getElementById('productsTableBody');
    
    if (filteredProducts.length === 0) {
        productsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-5">
                    Không tìm thấy sản phẩm
                </td>
            </tr>
        `;
        updatePagination();
        return;
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    productsTableBody.innerHTML = paginatedProducts.map(product => {
        const categoryName = product.category?.name || 'N/A';
        const image = product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/60';
        const description = (product.description || 'Không có mô tả').replace(/"/g, '&quot;');
        
        return `
            <tr onclick="viewDetail(${product.id})" style="cursor: pointer;">
                <td><strong>${product.id}</strong></td>
                <td><span class="product-title" data-desc="${description}">${product.title}</span></td>
                <td><strong>$${Number(product.price).toFixed(2)}</strong></td>
                <td>${categoryName}</td>
                <td>
                    <img src="${image}" alt="${product.title}" class="product-image" onerror="this.src='https://via.placeholder.com/60'">
                </td>
                <td><button class="btn btn-sm btn-info" onclick="viewDetail(${product.id}, event)"><i class="bi bi-eye"></i> Xem</button></td>
            </tr>
        `;
    }).join('');

    updatePagination();
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Update Pagination Info
function updatePagination() {
    const totalProducts = filteredProducts.length;
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalProducts);

    document.getElementById('showingFrom').textContent = totalProducts === 0 ? '0' : startIndex;
    document.getElementById('showingTo').textContent = endIndex;
    document.getElementById('totalProducts').textContent = totalProducts;

    // Update pagination buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    prevBtn.classList.toggle('disabled', currentPage === 1);
    nextBtn.classList.toggle('disabled', endIndex === totalProducts || totalProducts === 0);
}

// Page Size Change Handler
function handlePageSizeChange(e) {
    pageSize = parseInt(e.target.value);
    currentPage = 1;
    renderTable();
}

// Pagination Handlers
function handlePrevPage(e) {
    e.preventDefault();
    if (currentPage > 1) {
        currentPage--;
        renderTable();
        window.scrollTo(0, 0);
    }
}

function handleNextPage(e) {
    e.preventDefault();
    const maxPage = Math.ceil(filteredProducts.length / pageSize);
    if (currentPage < maxPage) {
        currentPage++;
        renderTable();
        window.scrollTo(0, 0);
    }
}

// Sort Handlers
function handleSortTitle(e) {
    e.preventDefault();
    if (sortBy === 'title-asc') {
        sortBy = 'title-desc';
    } else {
        sortBy = 'title-asc';
    }
    updateSortButtons();
    currentPage = 1;
    applySorting();
    renderTable();
}

function handleSortPrice(e) {
    e.preventDefault();
    if (sortBy === 'price-asc') {
        sortBy = 'price-desc';
    } else {
        sortBy = 'price-asc';
    }
    updateSortButtons();
    currentPage = 1;
    applySorting();
    renderTable();
}

function updateSortButtons() {
    const sortTitleBtn = document.getElementById('sortTitle');
    const sortPriceBtn = document.getElementById('sortPrice');
    
    sortTitleBtn.classList.remove('active');
    sortPriceBtn.classList.remove('active');
    
    if (sortBy && sortBy.includes('title')) {
        sortTitleBtn.classList.add('active');
        sortTitleBtn.textContent = sortBy === 'title-asc' ? '↑' : '↓';
    } else if (sortBy && sortBy.includes('price')) {
        sortPriceBtn.classList.add('active');
        sortPriceBtn.textContent = sortBy === 'price-asc' ? '↑' : '↓';
    }
}

function applySorting() {
    if (!sortBy) return;

    if (sortBy === 'title-asc') {
        filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'title-desc') {
        filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === 'price-asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    }
}

// Export to CSV Handler
function handleExport() {
    if (filteredProducts.length === 0) {
        alert('Không có dữ liệu để xuất');
        return;
    }

    // Get current page data
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const dataToExport = filteredProducts.slice(startIndex, endIndex);

    // Prepare CSV content
    const headers = ['ID', 'Tên sản phẩm', 'Giá', 'Danh mục', 'Mô tả'];
    const rows = dataToExport.map(product => [
        product.id,
        `"${(product.title || '').replace(/"/g, '""')}"`,
        product.price,
        `"${((product.category?.name || 'N/A').replace(/"/g, '""'))}"`,
        `"${(product.description || '').substring(0, 100).replace(/"/g, '""')}"`
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`Đã xuất ${dataToExport.length} sản phẩm ra file CSV!`);
}

// View Detail Handler
function viewDetail(productId, event) {
    if (event) event.stopPropagation();
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    currentDetail = product;
    const categoryName = product.category?.name || 'N/A';
    const image = product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/300';
    
    const detailHtml = `
        <div class="row">
            <div class="col-md-4">
                <img src="${image}" alt="${product.title}" class="img-fluid rounded" onerror="this.src='https://via.placeholder.com/300'">
            </div>
            <div class="col-md-8">
                <p><strong>ID:</strong> ${product.id}</p>
                <p><strong>Tên:</strong> ${product.title}</p>
                <p><strong>Giá:</strong> <span class="badge bg-success">$${Number(product.price).toFixed(2)}</span></p>
                <p><strong>Danh mục:</strong> ${categoryName}</p>
                <p><strong>Mô tả:</strong></p>
                <p>${product.description || 'Không có mô tả'}</p>
            </div>
        </div>
    `;
    
    document.getElementById('detailModalBody').innerHTML = detailHtml;
    const detailModal = new bootstrap.Modal(document.getElementById('detailModal'));
    detailModal.show();
}

// Open Edit Modal
function openEditModal() {
    if (!currentDetail) return;
    document.getElementById('editId').value = currentDetail.id;
    document.getElementById('editTitle').value = currentDetail.title;
    document.getElementById('editPrice').value = currentDetail.price;
    document.getElementById('editDescription').value = currentDetail.description;
    document.getElementById('editCategoryId').value = currentDetail.category?.id || 1;
    document.getElementById('editImage').value = currentDetail.images && currentDetail.images[0] ? currentDetail.images[0] : '';
}

// Handle Save Edit
async function handleSaveEdit() {
    try {
        const productId = parseInt(document.getElementById('editId').value);
        const updatedProduct = {
            title: document.getElementById('editTitle').value,
            price: parseFloat(document.getElementById('editPrice').value),
            description: document.getElementById('editDescription').value,
            categoryId: parseInt(document.getElementById('editCategoryId').value),
            images: [document.getElementById('editImage').value]
        };

        if (!updatedProduct.title || !updatedProduct.price) {
            alert('Vui lòng điền đầy đủ thông tin');
            return;
        }

        const saveEditBtn = document.getElementById('saveEditBtn');
        const originalText = saveEditBtn.innerHTML;
        saveEditBtn.disabled = true;
        saveEditBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang lưu...';

        const response = await fetch(`${PRODUCTS_API}/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProduct)
        });

        if (!response.ok) throw new Error('Failed to update');
        const result = await response.json();

        const index = allProducts.findIndex(p => p.id === productId);
        if (index !== -1) {
            allProducts[index] = { ...allProducts[index], ...result };
            currentDetail = allProducts[index];
        }

        saveEditBtn.disabled = false;
        saveEditBtn.innerHTML = originalText;
        bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
        bootstrap.Modal.getInstance(document.getElementById('detailModal')).hide();
        
        alert('Cập nhật thành công!');
        filteredProducts = [...allProducts];
        applySorting();
        renderTable();
    } catch (error) {
        alert('Lỗi: ' + error.message);
        document.getElementById('saveEditBtn').disabled = false;
    }
}

// Handle Create Product
async function handleCreateProduct() {
    try {
        const newProduct = {
            title: document.getElementById('createTitle').value,
            price: parseFloat(document.getElementById('createPrice').value),
            description: document.getElementById('createDescription').value,
            categoryId: parseInt(document.getElementById('createCategoryId').value),
            images: [document.getElementById('createImage').value]
        };

        if (!newProduct.title || !newProduct.price) {
            alert('Vui lòng điền đầy đủ thông tin');
            return;
        }

        const submitCreateBtn = document.getElementById('submitCreateBtn');
        const originalText = submitCreateBtn.innerHTML;
        submitCreateBtn.disabled = true;
        submitCreateBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang tạo...';

        const response = await fetch(PRODUCTS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });

        if (!response.ok) throw new Error('Failed to create');
        const result = await response.json();

        allProducts.unshift(result);
        submitCreateBtn.disabled = false;
        submitCreateBtn.innerHTML = originalText;
        bootstrap.Modal.getInstance(document.getElementById('createModal')).hide();
        document.getElementById('createForm').reset();
        
        alert('Tạo sản phẩm thành công!');
        filteredProducts = [...allProducts];
        currentPage = 1;
        applySorting();
        renderTable();
    } catch (error) {
        alert('Lỗi: ' + error.message);
        document.getElementById('submitCreateBtn').disabled = false;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', loadProducts);
