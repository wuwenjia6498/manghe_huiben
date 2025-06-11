# 绘本盲盒小程序数据库设计

## 数据库表结构设计

### 1. 用户表 (users)
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(100) UNIQUE NOT NULL COMMENT '微信openid',
  unionid VARCHAR(100) COMMENT '微信unionid',
  nickname VARCHAR(100) COMMENT '用户昵称',
  avatar_url VARCHAR(500) COMMENT '头像地址',
  phone VARCHAR(20) COMMENT '手机号',
  gender TINYINT DEFAULT 0 COMMENT '性别：0未知，1男，2女',
  city VARCHAR(50) COMMENT '城市',
  province VARCHAR(50) COMMENT '省份',
  country VARCHAR(50) COMMENT '国家',
  is_admin TINYINT DEFAULT 0 COMMENT '是否管理员：0否，1是',
  status TINYINT DEFAULT 1 COMMENT '状态：0禁用，1正常',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. 收货地址表 (addresses)
```sql
CREATE TABLE addresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(50) NOT NULL COMMENT '收货人姓名',
  phone VARCHAR(20) NOT NULL COMMENT '手机号',
  province VARCHAR(50) NOT NULL COMMENT '省份',
  city VARCHAR(50) NOT NULL COMMENT '城市',
  district VARCHAR(50) NOT NULL COMMENT '区/县',
  detail VARCHAR(200) NOT NULL COMMENT '详细地址',
  postal_code VARCHAR(10) COMMENT '邮编',
  is_default TINYINT DEFAULT 0 COMMENT '是否默认地址：0否，1是',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3. 商品分类表 (categories)
```sql
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '分类名称',
  type VARCHAR(20) NOT NULL COMMENT '分类类型：age_group(年龄段), condition(新旧程度)',
  sort_order INT DEFAULT 0 COMMENT '排序',
  status TINYINT DEFAULT 1 COMMENT '状态：0禁用，1启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始化分类数据
INSERT INTO categories (name, type, sort_order) VALUES
('0-3岁', 'age_group', 1),
('3-6岁', 'age_group', 2),
('6岁以上', 'age_group', 3),
('全新', 'condition', 1),
('九成新', 'condition', 2),
('七成新', 'condition', 3),
('五成新', 'condition', 4);
```

### 4. 商品表 (products)
```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '商品名称',
  description TEXT COMMENT '商品描述',
  cover_image VARCHAR(500) COMMENT '封面图片',
  banner_images JSON COMMENT '轮播图片数组',
  age_group_id INT NOT NULL COMMENT '年龄段ID',
  condition_id INT NOT NULL COMMENT '新旧程度ID',
  book_count INT NOT NULL COMMENT '包含绘本数量',
  original_price DECIMAL(10,2) NOT NULL COMMENT '原价',
  sale_price DECIMAL(10,2) NOT NULL COMMENT '售价',
  stock INT DEFAULT 0 COMMENT '库存数量',
  sales_count INT DEFAULT 0 COMMENT '销量',
  status TINYINT DEFAULT 1 COMMENT '状态：0下架，1上架',
  is_recommended TINYINT DEFAULT 0 COMMENT '是否推荐：0否，1是',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (age_group_id) REFERENCES categories(id),
  FOREIGN KEY (condition_id) REFERENCES categories(id)
);
```

### 5. 购物车表 (cart_items)
```sql
CREATE TABLE cart_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE KEY uk_user_product (user_id, product_id)
);
```

### 6. 订单表 (orders)
```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(50) UNIQUE NOT NULL COMMENT '订单号',
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL COMMENT '订单总金额',
  payment_amount DECIMAL(10,2) NOT NULL COMMENT '实付金额',
  status VARCHAR(20) DEFAULT 'pending' COMMENT '订单状态：pending待支付，paid已支付，shipped已发货，completed已完成，cancelled已取消',
  payment_status VARCHAR(20) DEFAULT 'unpaid' COMMENT '支付状态：unpaid未支付，paid已支付，refunded已退款',
  payment_method VARCHAR(20) DEFAULT 'wechat' COMMENT '支付方式',
  payment_time TIMESTAMP NULL COMMENT '支付时间',
  
  -- 收货地址信息
  receiver_name VARCHAR(50) NOT NULL COMMENT '收货人',
  receiver_phone VARCHAR(20) NOT NULL COMMENT '收货人电话',
  receiver_address VARCHAR(300) NOT NULL COMMENT '收货地址',
  
  -- 物流信息
  express_company VARCHAR(50) COMMENT '快递公司',
  express_no VARCHAR(100) COMMENT '快递单号',
  shipped_at TIMESTAMP NULL COMMENT '发货时间',
  
  -- 备注
  remark TEXT COMMENT '订单备注',
  admin_remark TEXT COMMENT '管理员备注',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 7. 订单商品表 (order_items)
```sql
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(100) NOT NULL COMMENT '商品名称快照',
  product_image VARCHAR(500) COMMENT '商品图片快照',
  age_group VARCHAR(20) NOT NULL COMMENT '年龄段快照',
  condition_name VARCHAR(20) NOT NULL COMMENT '新旧程度快照',
  book_count INT NOT NULL COMMENT '绘本数量快照',
  original_price DECIMAL(10,2) NOT NULL COMMENT '原价快照',
  sale_price DECIMAL(10,2) NOT NULL COMMENT '售价快照',
  quantity INT NOT NULL COMMENT '购买数量',
  total_price DECIMAL(10,2) NOT NULL COMMENT '小计金额',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### 8. 支付记录表 (payments)
```sql
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  payment_no VARCHAR(50) UNIQUE NOT NULL COMMENT '支付单号',
  wx_transaction_id VARCHAR(100) COMMENT '微信支付交易号',
  payment_method VARCHAR(20) NOT NULL DEFAULT 'wechat',
  amount DECIMAL(10,2) NOT NULL COMMENT '支付金额',
  status VARCHAR(20) DEFAULT 'pending' COMMENT '支付状态：pending待支付，success成功，failed失败，cancelled取消',
  paid_at TIMESTAMP NULL COMMENT '支付完成时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### 9. 系统配置表 (system_configs)
```sql
CREATE TABLE system_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
  config_value TEXT COMMENT '配置值',
  config_desc VARCHAR(200) COMMENT '配置描述',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 初始化系统配置
INSERT INTO system_configs (config_key, config_value, config_desc) VALUES
('wechat_app_id', '', '微信小程序AppID'),
('wechat_app_secret', '', '微信小程序AppSecret'),
('wechat_mch_id', '', '微信支付商户号'),
('wechat_pay_key', '', '微信支付密钥'),
('express_companies', '["顺丰速运", "中通快递", "圆通速递", "申通快递", "韵达速递", "百世快递"]', '快递公司列表'),
('home_banner', '[]', '首页轮播图配置'),
('contact_info', '{"phone": "", "wechat": ""}', '联系方式配置');
```

### 10. 操作日志表 (admin_logs)
```sql
CREATE TABLE admin_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL,
  action VARCHAR(100) NOT NULL COMMENT '操作类型',
  target_type VARCHAR(50) COMMENT '操作对象类型',
  target_id INT COMMENT '操作对象ID',
  content TEXT COMMENT '操作内容',
  ip_address VARCHAR(50) COMMENT 'IP地址',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id)
);
```

## 索引优化

```sql
-- 用户表索引
CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_users_phone ON users(phone);

-- 地址表索引
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default);

-- 商品表索引
CREATE INDEX idx_products_age_condition ON products(age_group_id, condition_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_recommended ON products(is_recommended, status);

-- 购物车索引
CREATE INDEX idx_cart_user_id ON cart_items(user_id);

-- 订单表索引
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_orders_created ON orders(created_at);

-- 订单商品表索引
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 支付记录索引
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_wx_transaction ON payments(wx_transaction_id);
```

## 数据库设计说明

### 设计原则
1. **规范化设计**：避免数据冗余，确保数据一致性
2. **性能优化**：合理设置索引，提高查询效率
3. **扩展性**：预留扩展字段，便于功能迭代
4. **数据完整性**：使用外键约束，确保数据关联正确

### 关键特性
1. **订单快照**：order_items表保存商品信息快照，避免商品信息变更影响历史订单
2. **软删除**：重要数据使用状态字段标记删除，而非物理删除
3. **时间戳**：所有表都包含创建和更新时间，便于数据追踪
4. **JSON字段**：使用JSON类型存储复杂数据结构，如图片数组、配置信息等

### 业务流程支持
1. **用户注册登录**：通过微信授权获取用户信息
2. **商品浏览购买**：支持多维度筛选和购物车功能
3. **订单管理**：完整的订单生命周期管理
4. **支付集成**：微信支付完整对接
5. **物流跟踪**：订单发货和物流信息管理
6. **后台管理**：商品、订单、用户的完整管理功能 