USE restaurant_db;

CREATE TABLE IF NOT EXISTS menu_quantity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  quantity INT DEFAULT 20,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- Insert data from menu_items with default quantity of 20
INSERT INTO menu_quantity (menu_item_id, name, description, price, category)
SELECT id, name, description, price, category
FROM menu_items;