let cart = [];
let token = localStorage.getItem('token');
let currentCategory = 'all';

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    loadMenu();
    loadFeaturedItems();
    loadFeedback();
    showSection('home');
    
    // Add mobile menu toggle functionality
    document.querySelector('.mobile-menu-toggle').addEventListener('click', toggleMobileMenu);
});

async function loadFeedback() {
    try {
        const response = await fetch('/api/feedback');
        const feedbackItems = await response.json();
        const reviewsList = document.getElementById('reviewsList');
        
        if (feedbackItems.length === 0) {
            reviewsList.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to leave a review!</p>';
            return;
        }
        
        reviewsList.innerHTML = feedbackItems.map(item => `
            <div class="review-card">
                <div class="review-header">
                    <h4>${item.name}</h4>
                    <div class="rating">${'★'.repeat(item.rating)}${'☆'.repeat(5-item.rating)}</div>
                </div>
                <p>"${item.message}"</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading feedback:', error);
    }
}

function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const adminRegisterBtn = document.getElementById('adminRegisterBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (token) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        adminRegisterBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        adminRegisterBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
    }
}

async function loadMenu() {
    try {
        console.log('Attempting to fetch menu items...');
        const response = await fetch('/api/menu');
        console.log('Menu API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch menu: ${response.status} ${response.statusText}`);
        }
        
        const menuItems = await response.json();
        console.log('Menu items received:', menuItems);
        
        const menuContainer = document.getElementById('menuItems');
        
        if (!menuItems || menuItems.length === 0) {
            console.log('No menu items found in the response');
            menuContainer.innerHTML = '<p class="error-message">No menu items available. Please check back later.</p>';
            return;
        }
        
        // Filter items based on current category
        const filteredItems = currentCategory === 'all' ? 
            menuItems : 
            menuItems.filter(item => item.category === currentCategory);
        
        console.log('Filtered menu items:', filteredItems);
        
        if (filteredItems.length === 0) {
            menuContainer.innerHTML = `<p class="error-message">No items found in the "${currentCategory}" category.</p>`;
            return;
        }
        
        menuContainer.innerHTML = filteredItems.map(item => {
            const isOutOfStock = item.quantity <= 0;
            return `
            <div class="menu-item ${isOutOfStock ? 'out-of-stock' : ''}" data-category="${item.category}">
                <div class="menu-item-image">
                    <img src="${item.image_url || 'https://via.placeholder.com/300x200'}" alt="${item.name}">
                    ${isOutOfStock ? '<div class="out-of-stock-label">Out of Stock</div>' : ''}
                </div>
                <h3>${item.name}</h3>
                <p class="description">${item.description}</p>
                <p class="price">₹${parseFloat(item.price).toFixed(2)}</p>
                <button 
                    onclick="addToCart({id: ${item.id}, name: '${item.name.replace(/'/g, "\\'").replace(/"/g, '\\"')}', price: ${parseFloat(item.price)}, description: '${item.description.replace(/'/g, "\\'").replace(/"/g, '\\"')}', image_url: '${item.image_url || ''}', quantity: 1, outOfStock: ${isOutOfStock}})" 
                    ${isOutOfStock ? 'disabled' : ''}
                >
                <i class=\"fas fa-plus\"></i> ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</button>
            </div>
        `}).join('');
        
        // Add styles for out-of-stock menu items if not already in CSS
        if (!document.getElementById('out-of-stock-menu-styles')) {
            const style = document.createElement('style');
            style.id = 'out-of-stock-menu-styles';
            style.textContent = `
                .menu-item.out-of-stock {
                    opacity: 0.8;
                }
                .menu-item.out-of-stock .menu-item-image {
                    position: relative;
                }
                .out-of-stock-label {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: rgba(255, 0, 0, 0.7);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 4px;
                    font-weight: bold;
                }
                .menu-item.out-of-stock button {
                    background-color: #cccccc;
                    cursor: not-allowed;
                }
            `;
            document.head.appendChild(style);
        }
    } catch (error) {
        console.error('Error loading menu:', error);
        document.getElementById('menuItems').innerHTML = `<p class="error-message">Failed to load menu items: ${error.message}</p>`;
    }
}

async function loadFeaturedItems() {
    try {
        console.log('Attempting to fetch featured items...');
        const response = await fetch('/api/menu');
        console.log('Featured items API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch featured items: ${response.status} ${response.statusText}`);
        }
        
        const menuItems = await response.json();
        console.log('Menu items for featured section:', menuItems);
        
        const featuredContainer = document.getElementById('featuredItems');
        
        if (!menuItems || menuItems.length === 0) {
            console.log('No menu items found for featured section');
            featuredContainer.innerHTML = '<p class="error-message">No featured items available. Please check back later.</p>';
            return;
        }
        
        // Get Chef's Specials for initial display
        const featuredItems = menuItems.filter(item => item.category === "Chef's Specials");
        console.log('Filtered featured items:', featuredItems);
        
        if (featuredItems.length === 0) {
            featuredContainer.innerHTML = '<p class="error-message">No Chef\'s Specials available at the moment.</p>';
            return;
        }
        
        featuredContainer.innerHTML = featuredItems.map(item => {
            const isOutOfStock = item.quantity <= 0;
            return `
            <div class="menu-item ${isOutOfStock ? 'out-of-stock' : ''}" data-category="${item.category}">
                <div class="menu-item-image">
                    <img src="${item.image_url || 'https://via.placeholder.com/300x200'}" alt="${item.name}">
                    ${isOutOfStock ? '<div class="out-of-stock-label">Out of Stock</div>' : ''}
                </div>
                <h3>${item.name}</h3>
                <p class="description">${item.description}</p>
                <p class="price">₹${parseFloat(item.price).toFixed(2)}</p>
                <button 
                    onclick="addToCart({id: ${item.id}, name: '${item.name.replace(/'/g, "\\'").replace(/"/g, '\\"')}', price: ${parseFloat(item.price)}, description: '${item.description.replace(/'/g, "\\'").replace(/"/g, '\\"')}', image_url: '${item.image_url || ''}', quantity: 1, outOfStock: ${isOutOfStock}})" 
                    ${isOutOfStock ? 'disabled' : ''}
                >
                <i class=\"fas fa-plus\"></i> ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</button>
            </div>
        `}).join('');
    } catch (error) {
        console.error('Error loading featured items:', error);
        document.getElementById('featuredItems').innerHTML = `<p class="error-message">Failed to load featured items: ${error.message}</p>`;
    }
}

function filterMenu(category) {
    currentCategory = category;
    
    // Update active tab button
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        if (btn.textContent.includes(category) || (category === 'all' && btn.textContent.includes('All'))) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // If on home page, update featured items
    if (document.getElementById('home').style.display !== 'none') {
        loadFeaturedItems();
    } else {
        // If on menu page, filter the menu
        loadMenu();
    }
}

function addToCart(item) {
    // Check if item is out of stock
    if (item.outOfStock) {
        showToast(`${item.name} is out of stock and cannot be added to cart`, true);
        return;
    }
    
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        item.quantity = 1;
        cart.push(item);
    }
    updateCart();
    showToast(`${item.name} added to cart`);
}



function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.querySelector('.checkout-btn');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartTotal.innerHTML = 'Total: ₹0.00';
        if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
        // Check if any item is out of stock
        const hasOutOfStockItems = cart.some(item => item.outOfStock);
        
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item ${item.outOfStock ? 'out-of-stock' : ''}">
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.name} x${item.quantity}</span>
                    <span class="cart-item-price">₹${(item.price * item.quantity).toFixed(2)}</span>
                    ${item.outOfStock ? '<span class="stock-warning">Out of stock</span>' : ''}
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${cart.indexOf(item)}, -1)" ${item.outOfStock ? 'disabled' : ''}>-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${cart.indexOf(item)}, 1)" ${item.outOfStock ? 'disabled' : ''}>+</button>
                    <button class="remove-item" onclick="removeFromCart(${cart.indexOf(item)})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.innerHTML = `Total: ₹${total.toFixed(2)}`;
        
        // Disable checkout button if any item is out of stock
        if (checkoutBtn) {
            checkoutBtn.disabled = hasOutOfStockItems;
            if (hasOutOfStockItems) {
                showToast('Please remove out-of-stock items before checkout');
            }
        }
    }
    
    // Add styles for out-of-stock items if not already in CSS
    if (!document.getElementById('out-of-stock-styles')) {
        const style = document.createElement('style');
        style.id = 'out-of-stock-styles';
        style.textContent = `
            .cart-item.out-of-stock {
                opacity: 0.7;
                background-color: #ffeeee;
                border-left: 3px solid #ff5555;
            }
            .stock-warning {
                color: #ff5555;
                font-size: 0.8rem;
                font-weight: bold;
                display: block;
                margin-top: 5px;
            }
        `;
        document.head.appendChild(style);
    }
}

function updateQuantity(index, change) {
    const item = cart[index];
    item.quantity = Math.max(1, (item.quantity || 1) + change);
    updateCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
    showToast('Item removed from cart');
}

function showToast(message, isError = false) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    
    // Set message and show toast
    toast.textContent = message;
    toast.className = isError ? 'show error' : 'show';
    
    // Add error style if not already in CSS
    if (isError && !document.getElementById('toast-error-style')) {
        const style = document.createElement('style');
        style.id = 'toast-error-style';
        style.textContent = `
            #toast.error {
                background-color: #ff5555;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.className = '';
    }, 3000);
}

function placeOrder() {
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    // Check if any item is out of stock
    const outOfStockItems = cart.filter(item => item.outOfStock);
    if (outOfStockItems.length > 0) {
        const itemNames = outOfStockItems.map(item => item.name).join(', ');
        alert(`Cannot proceed with checkout. The following items are out of stock: ${itemNames}. Please remove them from your cart.`);
        return;
    }

    // Create checkout modal
    const modal = document.createElement('div');
    modal.className = 'checkout-modal';
    
    // Calculate total amount
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    modal.innerHTML = `
        <div class="checkout-content">
            <span class="close-modal" onclick="closeCheckoutModal()">&times;</span>
            <h2>Complete Your Order</h2>
            <div class="order-summary">
                <h3>Order Summary</h3>
                <div class="summary-items">
                    ${cart.map(item => `
                        <div class="summary-item">
                            <span>${item.name} x${item.quantity}</span>
                            <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="summary-total">
                    <span>Total:</span>
                    <span>₹${totalAmount.toFixed(2)}</span>
                </div>
            </div>
            <form id="checkoutForm" onsubmit="submitOrder(event)">
                <div class="form-group">
                    <label for="customerName">Full Name</label>
                    <input type="text" id="customerName" placeholder="Enter your full name" required>
                </div>
                <div class="form-group">
                    <label for="customerPhone">Phone Number</label>
                    <input type="tel" id="customerPhone" placeholder="Enter your phone number" required>
                </div>
                <div class="form-group">
                    <label for="customerEmail">Email</label>
                    <input type="email" id="customerEmail" placeholder="Enter your email" required>
                </div>
                <div class="form-group">
                    <label for="customerAddress">Delivery Address</label>
                    <textarea id="customerAddress" placeholder="Enter your delivery address" required></textarea>
                </div>
                <div class="form-group">
                    <label>Payment Method</label>
                    <div class="payment-options">
                        <label class="payment-option">
                            <input type="radio" name="paymentMethod" value="cash" checked>
                            <span>Cash on Delivery</span>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="paymentMethod" value="card">
                            <span>Credit/Debit Card</span>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="paymentMethod" value="upi">
                            <span>UPI</span>
                        </label>
                    </div>
                </div>
                <button type="submit" class="btn-primary">Confirm Order</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles for the modal if not already in CSS
    if (!document.getElementById('checkout-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'checkout-modal-styles';
        style.textContent = `
            .checkout-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                overflow-y: auto;
            }
            .checkout-content {
                background-color: white;
                padding: 30px;
                border-radius: 8px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
            }
            .close-modal {
                position: absolute;
                top: 15px;
                right: 20px;
                font-size: 28px;
                cursor: pointer;
            }
            .order-summary {
                margin-bottom: 20px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 5px;
            }
            .summary-items {
                margin-bottom: 10px;
            }
            .summary-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }
            .summary-total {
                display: flex;
                justify-content: space-between;
                font-weight: bold;
                border-top: 1px solid #ddd;
                padding-top: 10px;
                margin-top: 10px;
            }
            .form-group {
                margin-bottom: 15px;
            }
            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            .form-group input, .form-group textarea {
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .form-group textarea {
                height: 80px;
            }
            .payment-options {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .payment-option {
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
            }
            .btn-primary {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                width: 100%;
                margin-top: 10px;
            }
            .btn-primary:hover {
                background-color: #45a049;
            }
            @media (max-width: 768px) {
                .checkout-content {
                    width: 95%;
                    padding: 20px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function closeCheckoutModal() {
    const modal = document.querySelector('.checkout-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

async function submitOrder(event) {
    event.preventDefault();
    
    if (!token) {
        alert('Please login to place an order');
        closeCheckoutModal();
        showSection('login');
        return;
    }

    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerEmail = document.getElementById('customerEmail').value.trim();
    const customerAddress = document.getElementById('customerAddress').value.trim();
    const paymentMethodElement = document.querySelector('input[name="paymentMethod"]:checked');

    // Validate all required fields
    if (!customerName || !customerPhone || !customerEmail || !customerAddress || !paymentMethodElement) {
        alert('Please fill in all required fields');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
        alert('Please enter a valid email address');
        return;
    }

    // Validate phone number (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(customerPhone)) {
        alert('Please enter a valid 10-digit phone number');
        return;
    }

    // Validate cart is not empty
    if (cart.length === 0) {
        alert('Your cart is empty. Please add items before placing an order.');
        return;
    }
    
    // Check if any items are marked as out of stock
    const outOfStockItems = cart.filter(item => item.outOfStock);
    if (outOfStockItems.length > 0) {
        const itemNames = outOfStockItems.map(item => item.name).join(', ');
        alert(`Cannot proceed with checkout. The following items are out of stock: ${itemNames}. Please remove them from your cart.`);
        return;
    }
    
    // Calculate total amount
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Show loading indicator
    const submitButton = document.querySelector('#checkoutForm button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = 'Processing...';
    submitButton.disabled = true;

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                items: cart,
                totalAmount: totalAmount,
                delivery_address: customerAddress,
                contact_phone: customerPhone,
                customer_email: customerEmail,
                customer_name: customerName
            })
        });

        // Reset button state
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;

        if (response.ok) {
            closeCheckoutModal();
            alert('Order placed successfully!');
            cart = [];
            updateCart();
            // Clear form fields
            document.getElementById('customerName').value = '';
            document.getElementById('customerPhone').value = '';
            document.getElementById('customerEmail').value = '';
            document.getElementById('customerAddress').value = '';
        } else {
            const data = await response.json();
            
            if (data.outOfStockItems && data.outOfStockItems.length > 0) {
                // Mark items as out of stock
                data.outOfStockItems.forEach(itemName => {
                    const outOfStockItem = cart.find(item => item.name === itemName);
                    if (outOfStockItem) {
                        outOfStockItem.outOfStock = true;
                    }
                });
                
                updateCart();
                
                // Show error message and keep modal open
                alert(`The following items are out of stock: ${data.outOfStockItems.join(', ')}. Please remove them from your cart before placing the order.`);
            } else if (data.itemName) {
                // Legacy support for single item out of stock
                const outOfStockItem = cart.find(item => item.name === data.itemName);
                if (outOfStockItem) {
                    outOfStockItem.outOfStock = true;
                    updateCart();
                    
                    // Show error message and keep modal open
                    alert(`${data.itemName} is out of stock. Please remove it from your cart before placing the order.`);
                }
            } else {
                closeCheckoutModal();
                alert(data.error || 'Failed to place order');
            }
        }
    } catch (error) {
        console.error('Error placing order:', error);
        alert(error.message || 'Failed to place order. Please try again.');
        
        // Reset button state in case of error
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
}


async function bookTable(event) {
    event.preventDefault();
    
    if (!token) {
        alert('Please login to book a table');
        showSection('login');
        return;
    }

    // Get user information from the form
    const name = document.getElementById('bookingName').value;
    const email = document.getElementById('bookingEmail').value;
    const phone = document.getElementById('bookingPhone').value;
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;
    const guests = document.getElementById('guests').value;
    const special_requests = document.getElementById('bookingSpecialRequests').value;

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                userId: getUserIdFromToken(), 
                name, 
                email, 
                phone, 
                date, 
                time, 
                guests, 
                special_requests 
            })
        });

        if (response.ok) {
            alert('Table booked successfully!');
            document.getElementById('bookingForm').reset();
        } else {
            throw new Error('Failed to book table');
        }
    } catch (error) {
        console.error('Error booking table:', error);
        alert('Failed to book table. Please try again.');
    }
}

// Helper function to extract user ID from JWT token
function getUserIdFromToken() {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload).userId;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

async function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    submitButton.disabled = true;

    try {
        const response = await fetch('/api/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            updateAuthUI();
            showSection('menu');
            document.getElementById('loginForm').reset();
            showToast('Login successful!');
        } else {
            throw new Error(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        showToast('Login failed. Please check your credentials.');
    } finally {
        // Restore button state
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

async function register(event) {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const submitButton = document.querySelector('#registerForm button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
    try {
        const response = await fetch('/api/user/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            throw new Error('Registration failed: Server returned invalid response.');
        }
        if (response.ok) {
            alert(data.message || 'Registration successful!');
            document.getElementById('registerForm').reset();
            showSection('login');
        } else {
            alert(data.error || 'Registration failed.');
        }
    } catch (error) {
        alert(error.message || 'Registration failed: Network or server error.');
        console.error('Error registering:', error);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Register';
    }
}

// Function to register an admin
async function registerAdmin(event) {
    event.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const phone = document.getElementById('adminPhone').value;
    const submitButton = document.querySelector('#adminRegisterForm button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
    
    try {
        const response = await fetch('/api/admin/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, phone })
        });
        
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            throw new Error('Admin registration failed: Server returned invalid response.');
        }
        
        if (response.ok) {
            alert(data.message || 'Admin registered successfully!');
            document.getElementById('adminRegisterForm').reset();
            showSection('login');
        } else {
            alert(data.error || 'Admin registration failed.');
        }
    } catch (error) {
        alert(error.message || 'Admin registration failed: Network or server error.');
        console.error('Error registering admin:', error);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Register as Admin';
    }
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    updateAuthUI();
    showSection('menu');
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = section.id === sectionId ? 'block' : 'none';
    });
    
    // Update nav buttons active state
    const navButtons = document.querySelectorAll('.nav-links button');
    navButtons.forEach(button => {
        if (button.textContent.toLowerCase().includes(sectionId) || 
            (sectionId === 'book-table' && button.textContent.toLowerCase().includes('book'))) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Scroll to top when changing sections
    window.scrollTo(0, 0);
    
    // Close mobile menu when section changes
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.remove('active');
}

function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('active');
}

function toggleAccordion(header) {
    const item = header.parentElement;
    const content = header.nextElementSibling;
    
    // Toggle active class
    item.classList.toggle('active');
    
    // Toggle icon
    const icon = header.querySelector('i');
    icon.classList.toggle('fa-chevron-down');
    icon.classList.toggle('fa-chevron-up');
    
    // Toggle content visibility
    if (item.classList.contains('active')) {
        content.style.maxHeight = content.scrollHeight + 'px';
    } else {
        content.style.maxHeight = '0';
    }
}

function submitFeedback(event) {
    event.preventDefault();
    
    // Get form values
    const name = document.getElementById('feedbackName').value;
    const email = document.getElementById('feedbackEmail').value;
    const rating = document.getElementById('feedbackRating').value;
    const message = document.getElementById('feedbackMessage').value;
    
    // Disable submit button to prevent multiple submissions
    const submitButton = document.querySelector('#feedbackForm button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    // Submit feedback to server to store in MySQL database (CustomerReviews table)
    fetch('/api/feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            name, 
            email, 
            rating: parseInt(rating), 
            message 
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        // Reset form
        document.getElementById('feedbackForm').reset();
        
        // Show success message
        showToast('Thank you for your feedback!');
        
        // Refresh the feedback display
        loadFeedback();
    })
    .catch(error => {
        console.error('Error submitting feedback:', error);
        showToast('Failed to submit feedback. Please try again.');
    })
    .finally(() => {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    });
}

function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (message) {
        const chatMessages = document.getElementById('chatMessages');
        
        // Add user message
        chatMessages.innerHTML += `<div class="message user">${message}</div>`;
        
        // Clear input
        chatInput.value = '';
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Simulate response after a short delay
        setTimeout(() => {
            chatMessages.innerHTML += `<div class="message system">Thank you for your message. Our team will get back to you shortly.</div>`;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    }
}

async function bookTableOnline(event) {
    event.preventDefault();
    
    const name = document.getElementById('bookingName').value;
    const email = document.getElementById('bookingEmail').value;
    const phone = document.getElementById('bookingPhone').value;
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;
    const guests = document.getElementById('bookingGuests').value;
    const special_requests = document.getElementById('bookingRequests').value;

    try {
        const response = await fetch('/api/public/table-bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                name, 
                email, 
                phone, 
                date, 
                time, 
                guests, 
                special_requests 
            })
        });

        if (response.ok) {
            showToast('Table booked successfully!');
            document.getElementById('tableBookingForm').reset();
        } else {
            throw new Error('Failed to book table');
        }
    } catch (error) {
        console.error('Error booking table:', error);
        showToast('Failed to book table. Please try again.');
    }
}

// Function to load and display customer reviews
function loadCustomerReviews() {
    fetch('/api/feedback')
        .then(response => response.json())
        .then(reviews => {
            const reviewsList = document.getElementById('reviewsList');
            reviewsList.innerHTML = ''; // Clear existing reviews
            
            reviews.forEach(review => {
                const reviewCard = document.createElement('div');
                reviewCard.className = 'review-card';
                reviewCard.innerHTML = `
                    <div class="review-header">
                        <h4>${review.CustomerName}</h4>
                        <div class="rating">${'★'.repeat(review.Rating)}${'☆'.repeat(5-review.Rating)}</div>
                    </div>
                    <p>"${review.Message}"</p>
                `;
                reviewsList.appendChild(reviewCard);
            });
        })
        .catch(error => {
            console.error('Error loading reviews:', error);
            showToast('Failed to load reviews. Please try again.');
        });
}

// Load reviews when the page loads
document.addEventListener('DOMContentLoaded', loadCustomerReviews);