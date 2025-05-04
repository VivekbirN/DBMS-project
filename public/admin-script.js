// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }
    loadOrders();
    loadBookings();
    loadFeedback();
    loadTableBookings();
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

    ordersList.innerHTML = filteredOrders.map(order => `
        <div class="list-item">
            <div class="list-item-details">
                <h3>Order #${order.id}</h3>
                <p>Items: ${JSON.parse(order.items).map(item => item.name).join(', ')}</p>
                <p>Total: $${order.total_amount.toFixed(2)}</p>
                <span class="status-badge status-${order.status}">${order.status}</span>
            </div>
            <div class="list-item-actions">
                ${order.status === 'pending' ? `
                    <button class="confirm" onclick="updateOrderStatus(${order.id}, 'confirmed')">Confirm</button>
                    <button class="cancel" onclick="updateOrderStatus(${order.id}, 'cancelled')">Cancel</button>
                ` : ''}
                ${order.status === 'confirmed' ? `
                    <button class="complete" onclick="updateOrderStatus(${order.id}, 'completed')">Complete</button>
                ` : ''}
            </div>
        </div>
    `).join('');
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

async function loadTableBookings() {
    try {
        const response = await fetch('/api/admin/table-bookings', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const tableBookings = await response.json();
        displayTableBookings(tableBookings);
    } catch (error) {
        console.error('Error loading table bookings:', error);
    }
}

async function loadFeedback() {
    try {
        const response = await fetch('/api/admin/feedback', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const feedback = await response.json();
        displayFeedback(feedback);
    } catch (error) {
        console.error('Error loading feedback:', error);
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
                <p>Name: ${booking.name}</p>
                <p>Email: ${booking.email}</p>
                <p>Phone: ${booking.phone}</p>
                <p>Date: ${booking.date}</p>
                <p>Time: ${booking.time}</p>
                <p>Guests: ${booking.guests}</p>
                ${booking.special_requests ? `<p>Special Requests: ${booking.special_requests}</p>` : ''}
                <span class="status-badge status-${booking.status}">${booking.status}</span>
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

function displayTableBookings(tableBookings) {
    const bookingsList = document.getElementById('bookingsList');
    const statusFilter = document.getElementById('bookingStatusFilter').value;
    const dateFilter = document.getElementById('bookingDateFilter').value;
    
    let filteredBookings = tableBookings;
    
    if (statusFilter !== 'all') {
        filteredBookings = filteredBookings.filter(booking => booking.status === statusFilter);
    }
    
    if (dateFilter) {
        filteredBookings = filteredBookings.filter(booking => booking.date === dateFilter);
    }

    bookingsList.innerHTML = filteredBookings.map(booking => `
        <div class="list-item">
            <div class="list-item-details">
                <h3>Table Booking #${booking.id}</h3>
                <p>Name: ${booking.name}</p>
                <p>Email: ${booking.email}</p>
                <p>Phone: ${booking.phone}</p>
                <p>Date: ${booking.date}</p>
                <p>Time: ${booking.time}</p>
                <p>Guests: ${booking.guests}</p>
                ${booking.special_requests ? `<p>Special Requests: ${booking.special_requests}</p>` : ''}
                <span class="status-badge status-${booking.status}">${booking.status}</span>
            </div>
            <div class="list-item-actions">
                ${booking.status === 'pending' ? `
                    <button class="confirm" onclick="updateTableBookingStatus(${booking.id}, 'confirmed')">Confirm</button>
                    <button class="cancel" onclick="updateTableBookingStatus(${booking.id}, 'cancelled')">Cancel</button>
                ` : ''}
                ${booking.status === 'confirmed' ? `
                    <button class="complete" onclick="updateTableBookingStatus(${booking.id}, 'completed')">Complete</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function displayFeedback(feedback) {
    const feedbackList = document.getElementById('feedbackList');
    const ratingFilter = document.getElementById('feedbackRatingFilter').value;
    
    let filteredFeedback = feedback;
    
    if (ratingFilter !== 'all') {
        filteredFeedback = filteredFeedback.filter(item => item.rating.toString() === ratingFilter);
    }

    feedbackList.innerHTML = filteredFeedback.map(item => `
        <div class="list-item">
            <div class="list-item-details">
                <h3>${item.name}</h3>
                <p>Email: ${item.email || 'Not provided'}</p>
                <p>Rating: ${'★'.repeat(item.rating)}${'☆'.repeat(5-item.rating)}</p>
                <p>Message: "${item.message}"</p>
                <p>Date: ${new Date(item.created_at).toLocaleDateString()}</p>
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

async function updateTableBookingStatus(bookingId, status) {
    try {
        const response = await fetch(`/api/admin/table-bookings/${bookingId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            loadTableBookings();
        } else {
            throw new Error('Failed to update table booking status');
        }
    } catch (error) {
        console.error('Error updating table booking status:', error);
        alert('Failed to update table booking status');
    }
}

function filterOrders() {
    loadOrders();
}

function filterBookings() {
    loadBookings();
    loadTableBookings();
}

function filterFeedback() {
    loadFeedback();
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