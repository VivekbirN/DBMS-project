// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/admin-login.html';
        return;
    }
    
    // Verify that the token is for an admin
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'admin') {
            localStorage.removeItem('token');
            window.location.href = '/admin-login.html';
            return;
        }
    } catch (error) {
        console.error('Error parsing token:', error);
        localStorage.removeItem('token');
        window.location.href = '/admin-login.html';
        return;
    }
    
    loadOrders();
    loadBookings();
    loadReviews();
    loadInventory();
    showSection('orders'); // Show orders section by default
});

async function loadOrders() {
    try {
        const response = await fetch('/api/admin/orders', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const orders = await response.json();
        displayOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    const statusFilter = document.getElementById('orderStatusFilter').value;
    
    const filteredOrders = statusFilter === 'all' 
        ? orders 
        : orders.filter(order => order.status === statusFilter);

    ordersList.innerHTML = filteredOrders.map(order => {
        const items = JSON.parse(order.items);
        return `
        <div class="list-item">
            <div class="list-item-details">
                <h3>Order #${order.id}</h3>
                <p><strong>Name:</strong> ${order.user_name || 'Guest'}</p>
                <p><strong>Address:</strong> ${order.delivery_address || 'Not provided'}</p>
                <p><strong>Items:</strong> ${items.map(item => `${item.name} (${item.quantity})`).join(', ')}</p>
                <p><strong>Total Cost:</strong> ₹${order.total_amount.toFixed(2)}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
            </div>
            <div class="list-item-actions">
                ${order.status === 'pending' ? `
                    <button class="confirm" onclick="updateOrderStatus(${order.id}, 'confirmed')">Confirm</button>
                    <button class="cancel" onclick="updateOrderStatus(${order.id}, 'cancelled')">Cancel</button>
                ` : ''}
                ${order.status === 'confirmed' ? `
                    <button class="delivery" onclick="updateOrderStatus(${order.id}, 'out_for_delivery')">Out for Delivery</button>
                ` : ''}
                ${order.status === 'out_for_delivery' ? `
                    <button class="complete" onclick="updateOrderStatus(${order.id}, 'delivered')">Mark as Delivered</button>
                ` : ''}
            </div>
        </div>
    `;
    }).join('');
}

async function loadBookings() {
    try {
        const response = await fetch('/api/admin/bookings', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const bookings = await response.json();
        displayBookings(bookings);
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

async function loadReviews() {
    try {
        const response = await fetch('/api/admin/feedback', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const reviews = await response.json();
        displayReviews(reviews);
    } catch (error) {
        console.error('Error loading customer reviews:', error);
    }
}

function displayBookings(bookings) {
    const bookingsList = document.getElementById('bookingsList');
    const statusFilter = document.getElementById('bookingStatusFilter').value;
    const dateFilter = document.getElementById('bookingDateFilter').value;
    
    let filteredBookings = bookings;
    
    if (statusFilter !== 'all') {
        filteredBookings = filteredBookings.filter(booking => booking.status === statusFilter);
    }
    
    if (dateFilter) {
        filteredBookings = filteredBookings.filter(booking => booking.date === dateFilter);
    }

    bookingsList.innerHTML = filteredBookings.map(booking => `
        <div class="list-item">
            <div class="list-item-details">
                <h3>Booking #${booking.id}</h3>
                <p><strong>Name:</strong> ${booking.name}</p>
                <p><strong>Number of People:</strong> ${booking.guests}</p>
                <p><strong>Contact Number:</strong> ${booking.phone}</p>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Time:</strong> ${booking.time}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${booking.status}">${booking.status}</span></p>
            </div>
            <div class="list-item-actions">
                ${booking.status === 'pending' ? `
                    <button class="confirm" onclick="updateBookingStatus(${booking.id}, 'confirmed')">Confirm</button>
                    <button class="cancel" onclick="updateBookingStatus(${booking.id}, 'cancelled')">Cancel</button>
                ` : ''}
                ${booking.status === 'confirmed' ? `
                    <button class="complete" onclick="updateBookingStatus(${booking.id}, 'completed')">Complete</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function displayReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    const ratingFilter = document.getElementById('reviewRatingFilter').value;
    
    let filteredReviews = reviews;
    
    if (ratingFilter !== 'all') {
        filteredReviews = filteredReviews.filter(item => item.Rating.toString() === ratingFilter);
    }

    reviewsList.innerHTML = filteredReviews.map(review => `
        <div class="list-item">
            <div class="list-item-details">
                <h3>${review.CustomerName}</h3>
                <p><strong>Rating:</strong> ${'★'.repeat(review.Rating)}${'☆'.repeat(5-review.Rating)}</p>
                <p><strong>Review:</strong> "${review.Message}"</p>
                <p><strong>Date:</strong> ${new Date(review.SubmittedAt).toLocaleDateString()}</p>
            </div>
        </div>
    `).join('');
}


async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`/api/admin/orders/${orderId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            loadOrders();
        } else {
            throw new Error('Failed to update order status');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Failed to update order status');
    }
}

async function updateBookingStatus(bookingId, status) {
    try {
        const response = await fetch(`/api/admin/bookings/${bookingId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            loadBookings();
        } else {
            throw new Error('Failed to update booking status');
        }
    } catch (error) {
        console.error('Error updating booking status:', error);
        alert('Failed to update booking status');
    }
}



function filterOrders() {
    loadOrders();
}

function filterBookings() {
    loadBookings();
}

function filterReviews() {
    loadReviews();
}

function filterInventory() {
    loadInventory();
}

async function loadInventory() {
    try {
        const response = await fetch('/api/admin/inventory', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const inventory = await response.json();
        displayInventory(inventory);
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

function displayInventory(inventory) {
    const inventoryList = document.getElementById('inventoryList');
    const categoryFilter = document.getElementById('inventoryCategoryFilter').value;
    
    const filteredInventory = categoryFilter === 'all' 
        ? inventory 
        : inventory.filter(item => item.category === categoryFilter);

    // Add inventory summary at the top
    const outOfStockCount = inventory.filter(item => item.quantity <= 0).length;
    const lowStockCount = inventory.filter(item => item.quantity > 0 && item.quantity < 5).length;
    const inStockCount = inventory.filter(item => item.quantity >= 5).length;
    
    const summaryHTML = `
        <div class="inventory-summary">
            <div class="summary-item">
                <span class="summary-count">${inStockCount}</span>
                <span class="summary-label">In Stock</span>
            </div>
            <div class="summary-item warning">
                <span class="summary-count">${lowStockCount}</span>
                <span class="summary-label">Low Stock</span>
            </div>
            <div class="summary-item danger">
                <span class="summary-count">${outOfStockCount}</span>
                <span class="summary-label">Out of Stock</span>
            </div>
        </div>
    `;
    
    // Add styles for inventory summary if not already in CSS
    if (!document.getElementById('inventory-summary-styles')) {
        const style = document.createElement('style');
        style.id = 'inventory-summary-styles';
        style.textContent = `
            .inventory-summary {
                display: flex;
                justify-content: space-around;
                margin-bottom: 20px;
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
            }
            .summary-item {
                text-align: center;
                padding: 10px 15px;
                border-radius: 5px;
                background-color: #e8f5e9;
            }
            .summary-item.warning {
                background-color: #fff3e0;
            }
            .summary-item.danger {
                background-color: #ffebee;
            }
            .summary-count {
                display: block;
                font-size: 24px;
                font-weight: bold;
            }
            .summary-label {
                font-size: 14px;
                color: #555;
            }
            .stock-badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 12px;
                font-weight: bold;
                color: white;
            }
            .stock-badge.in-stock {
                background-color: #4CAF50;
            }
            .stock-badge.low-stock {
                background-color: #FF9800;
            }
            .stock-badge.out-of-stock {
                background-color: #F44336;
            }
            .list-item {
                border-left: 5px solid #ddd;
            }
            .list-item:has(.stock-badge.in-stock) {
                border-left-color: #4CAF50;
            }
            .list-item:has(.stock-badge.low-stock) {
                border-left-color: #FF9800;
            }
            .list-item:has(.stock-badge.out-of-stock) {
                border-left-color: #F44336;
            }
        `;
        document.head.appendChild(style);
    }

    inventoryList.innerHTML = summaryHTML + filteredInventory.map(item => {
        const stockStatus = item.quantity <= 0 ? 'out-of-stock' : (item.quantity < 5 ? 'low-stock' : 'in-stock');
        const stockLabel = stockStatus === 'out-of-stock' ? 'Out of Stock' : (stockStatus === 'low-stock' ? 'Low Stock' : 'In Stock');
        
        return `
        <div class="list-item">
            <div class="list-item-details">
                <h3>${item.name}</h3>
                <p><strong>Category:</strong> ${item.category}</p>
                <p><strong>Price:</strong> ₹${item.price.toFixed(2)}</p>
                <p><strong>Current Stock:</strong> <span class="stock-badge ${stockStatus}">${item.quantity} (${stockLabel})</span></p>
            </div>
            <div class="list-item-actions">
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="updateItemQuantity(${item.id}, ${Math.max(0, item.quantity - 1)})" ${item.quantity <= 0 ? 'disabled' : ''}>-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateItemQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <button class="restock-item-btn" onclick="updateItemQuantity(${item.id}, 20)">Restock</button>
            </div>
        </div>
    `;
    }).join('');
    
    // Show a message if no items match the filter
    if (filteredInventory.length === 0) {
        inventoryList.innerHTML += '<p class="no-items">No items found in this category.</p>';
    }
}

async function updateItemQuantity(itemId, quantity) {
    try {
        const response = await fetch(`/api/admin/inventory/${itemId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ quantity })
        });

        if (response.ok) {
            loadInventory();
        } else {
            throw new Error('Failed to update inventory');
        }
    } catch (error) {
        console.error('Error updating inventory:', error);
        alert('Failed to update inventory');
    }
}

async function restockAllItems() {
    try {
        const response = await fetch('/api/admin/inventory/restock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            loadInventory();
            alert('All items have been restocked successfully!');
        } else {
            throw new Error('Failed to restock items');
        }
    } catch (error) {
        console.error('Error restocking items:', error);
        alert('Failed to restock items');
    }
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = section.id === sectionId ? 'block' : 'none';
    });
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
}