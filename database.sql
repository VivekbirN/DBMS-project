CREATE DATABASE IF NOT EXISTS restaurant_db;
USE restaurant_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  items JSON NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  order_notes TEXT,
  delivery_address TEXT,
  contact_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  guests INT NOT NULL,
  special_requests TEXT,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS CustomerReviews (
  ReviewID INT AUTO_INCREMENT PRIMARY KEY,
  CustomerName VARCHAR(100) NOT NULL,
  Email VARCHAR(100) NOT NULL,
  Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
  Message TEXT NOT NULL,
  SubmittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category, image_url) VALUES
-- Chef's Specials
('Paneer Tikka Taco', 'Fusion taco with marinated paneer tikka filling', 399, 'Chef\'s Specials', 'paneer_tikka_taco.jpg'),
('Truffle Mushroom Pizza', 'Gourmet pizza with truffle oil and wild mushrooms', 1299, 'Chef\'s Specials', 'truffle_pizza.jpg'),
('Masala Chai Affogato', 'Italian dessert with Indian masala chai twist', 349, 'Chef\'s Specials', 'chai_affogato.jpg'),

-- Tacos
('Classic Bean Taco', 'Traditional taco with seasoned beans and fresh toppings', 299, 'Tacos', 'bean_taco.jpg'),
('Spicy Chicken Taco', 'Fiery chicken taco with special hot sauce', 349, 'Tacos', 'chicken_taco.jpg'),
('Fish Taco', 'Crispy fish taco with tangy slaw and lime', 399, 'Tacos', 'fish_taco.jpg'),
('Veggie Taco', 'Fresh vegetable taco with guacamole', 249, 'Tacos', 'veggie_taco.jpg'),

-- Pizzas
('Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and basil', 899, 'Pizzas', 'margherita.jpg'),
('Paneer Tikka Pizza', 'Indian-Italian fusion with spiced paneer topping', 999, 'Pizzas', 'paneer_pizza.jpg'),
('Veg Taco Pizza', 'Innovative pizza with taco-inspired toppings', 1199, 'Pizzas', 'taco_pizza.jpg'),
('Vegetarian Pizza', 'Loaded with fresh vegetables and cheese', 1099, 'Pizzas', 'veg_pizza.jpg'),

-- Main Courses - Burgers
('Chicken Burger', 'Grilled chicken with lettuce and special sauce', 999, 'Burgers', 'burger.jpg'),
('Classic Beef Burger', 'Juicy beef patty with cheese, lettuce, and tomato', 1099, 'Burgers', 'beef_burger.jpg'),
('Veggie Burger', 'Plant-based patty with avocado and sprouts', 999, 'Burgers', 'veggie_burger.jpg'),
('Bacon Cheeseburger', 'Beef patty with crispy bacon and melted cheese', 1299, 'Burgers', 'bacon_burger.jpg'),

-- Coffee
('Espresso', 'Strong concentrated coffee shot', 149, 'Coffee', 'espresso.jpg'),
('Cappuccino', 'Espresso with steamed milk and foam', 199, 'Coffee', 'cappuccino.jpg'),
('Iced Mocha', 'Chilled coffee with chocolate and milk', 249, 'Coffee', 'iced_mocha.jpg'),
('Mexican Spiced Coffee', 'Coffee with cinnamon and spices', 179, 'Coffee', 'mexican_coffee.jpg'),

-- Desserts
('Churros', 'Spanish fried dough with cinnamon sugar', 199, 'Desserts', 'churros.jpg'),
('Tiramisu', 'Italian coffee-flavored dessert with mascarpone', 249, 'Desserts', 'tiramisu.jpg'),
('Cheesecake', 'New York style cheesecake with berry compote', 249, 'Desserts', 'cheesecake.jpg'),
('Apple Pie', 'Warm apple pie with vanilla ice cream', 199, 'Desserts', 'apple_pie.jpg');