# 绘本盲盒小程序后端API设计

## API接口规范

### 1. 基础规范

#### 请求格式
- **Base URL**: `https://api.your-domain.com/api/v1`
- **Content-Type**: `application/json`
- **编码**: UTF-8

#### 响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1640995200000
}
```

#### 状态码规范
- **200**: 成功
- **400**: 请求参数错误
- **401**: 未授权
- **403**: 禁止访问
- **404**: 资源不存在
- **500**: 服务器内部错误

### 2. 用户认证相关

#### 2.1 微信登录
```
POST /auth/wx-login
```

**请求参数:**
```json
{
  "code": "微信登录code",
  "encryptedData": "加密数据",
  "iv": "初始向量"
}
```

**响应数据:**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "jwt_token_string",
    "userInfo": {
      "id": 1,
      "openid": "xxx",
      "nickname": "用户昵称",
      "avatarUrl": "头像地址",
      "isAdmin": false
    }
  }
}
```

#### 2.2 获取用户信息
```
GET /auth/user-info
```

**请求头:**
```
Authorization: Bearer {token}
```

**响应数据:**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "nickname": "用户昵称",
    "avatarUrl": "头像地址",
    "phone": "手机号",
    "isAdmin": false
  }
}
```

### 3. 商品相关

#### 3.1 获取商品列表
```
GET /products?page=1&limit=20&ageGroupId=1&conditionId=1
```

**查询参数:**
- `page`: 页码，默认1
- `limit`: 每页数量，默认20
- `ageGroupId`: 年龄段ID（可选）
- `conditionId`: 新旧程度ID（可选）
- `keyword`: 搜索关键词（可选）

**响应数据:**
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "name": "3-6岁绘本盲盒（九成新）",
        "description": "包含10本精选绘本",
        "coverImage": "图片地址",
        "ageGroup": "3-6岁",
        "condition": "九成新",
        "bookCount": 10,
        "originalPrice": 199.00,
        "salePrice": 89.00,
        "stock": 50,
        "salesCount": 120,
        "isRecommended": true
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

#### 3.2 获取商品详情
```
GET /products/{id}
```

**响应数据:**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "name": "3-6岁绘本盲盒（九成新）",
    "description": "详细描述文字...",
    "coverImage": "封面图片地址",
    "bannerImages": ["轮播图1", "轮播图2"],
    "ageGroup": "3-6岁",
    "condition": "九成新",
    "bookCount": 10,
    "originalPrice": 199.00,
    "salePrice": 89.00,
    "stock": 50,
    "salesCount": 120
  }
}
```

#### 3.3 获取商品分类
```
GET /categories
```

**响应数据:**
```json
{
  "code": 200,
  "data": {
    "ageGroups": [
      {"id": 1, "name": "0-3岁"},
      {"id": 2, "name": "3-6岁"},
      {"id": 3, "name": "6岁以上"}
    ],
    "conditions": [
      {"id": 4, "name": "全新"},
      {"id": 5, "name": "九成新"},
      {"id": 6, "name": "七成新"},
      {"id": 7, "name": "五成新"}
    ]
  }
}
```

### 4. 购物车相关

#### 4.1 获取购物车列表
```
GET /cart
```

**响应数据:**
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "productId": 1,
        "productName": "3-6岁绘本盲盒（九成新）",
        "productImage": "图片地址",
        "ageGroup": "3-6岁",
        "condition": "九成新",
        "bookCount": 10,
        "salePrice": 89.00,
        "quantity": 2,
        "totalPrice": 178.00
      }
    ],
    "totalAmount": 178.00,
    "totalQuantity": 2
  }
}
```

#### 4.2 添加到购物车
```
POST /cart/add
```

**请求参数:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

#### 4.3 更新购物车商品数量
```
PUT /cart/{itemId}
```

**请求参数:**
```json
{
  "quantity": 3
}
```

#### 4.4 删除购物车商品
```
DELETE /cart/{itemId}
```

#### 4.5 清空购物车
```
DELETE /cart/clear
```

### 5. 地址管理

#### 5.1 获取地址列表
```
GET /addresses
```

**响应数据:**
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "张三",
      "phone": "13800138000",
      "province": "广东省",
      "city": "深圳市",
      "district": "南山区",
      "detail": "科技园南区",
      "postalCode": "518000",
      "isDefault": true
    }
  ]
}
```

#### 5.2 添加地址
```
POST /addresses
```

**请求参数:**
```json
{
  "name": "张三",
  "phone": "13800138000",
  "province": "广东省",
  "city": "深圳市",
  "district": "南山区",
  "detail": "科技园南区",
  "postalCode": "518000",
  "isDefault": false
}
```

#### 5.3 更新地址
```
PUT /addresses/{id}
```

#### 5.4 删除地址
```
DELETE /addresses/{id}
```

#### 5.5 设置默认地址
```
POST /addresses/{id}/set-default
```

### 6. 订单相关

#### 6.1 创建订单
```
POST /orders/create
```

**请求参数:**
```json
{
  "addressId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "remark": "订单备注"
}
```

**响应数据:**
```json
{
  "code": 200,
  "data": {
    "orderId": 123,
    "orderNo": "202312250001",
    "totalAmount": 178.00,
    "paymentInfo": {
      "appId": "微信AppID",
      "timeStamp": "时间戳",
      "nonceStr": "随机字符串",
      "package": "prepay_id=xxx",
      "signType": "MD5",
      "paySign": "签名"
    }
  }
}
```

#### 6.2 获取订单列表
```
GET /orders?page=1&limit=10&status=all
```

**查询参数:**
- `page`: 页码
- `limit`: 每页数量
- `status`: 订单状态（all/pending/paid/shipped/completed/cancelled）

**响应数据:**
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 123,
        "orderNo": "202312250001",
        "status": "paid",
        "statusText": "已支付",
        "totalAmount": 178.00,
        "paymentAmount": 178.00,
        "createdAt": "2023-12-25 10:00:00",
        "items": [
          {
            "productName": "3-6岁绘本盲盒（九成新）",
            "productImage": "图片地址",
            "quantity": 2,
            "salePrice": 89.00
          }
        ]
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10
  }
}
```

#### 6.3 获取订单详情
```
GET /orders/{orderNo}
```

**响应数据:**
```json
{
  "code": 200,
  "data": {
    "id": 123,
    "orderNo": "202312250001",
    "status": "shipped",
    "statusText": "已发货",
    "totalAmount": 178.00,
    "paymentAmount": 178.00,
    "paymentTime": "2023-12-25 10:05:00",
    "receiverName": "张三",
    "receiverPhone": "13800138000",
    "receiverAddress": "广东省深圳市南山区科技园南区",
    "expressCompany": "顺丰速运",
    "expressNo": "SF1234567890",
    "shippedAt": "2023-12-25 14:00:00",
    "remark": "订单备注",
    "createdAt": "2023-12-25 10:00:00",
    "items": [
      {
        "productName": "3-6岁绘本盲盒（九成新）",
        "productImage": "图片地址",
        "ageGroup": "3-6岁",
        "condition": "九成新",
        "bookCount": 10,
        "quantity": 2,
        "salePrice": 89.00,
        "totalPrice": 178.00
      }
    ]
  }
}
```

#### 6.4 取消订单
```
POST /orders/{orderNo}/cancel
```

#### 6.5 确认收货
```
POST /orders/{orderNo}/confirm
```

### 7. 支付相关

#### 7.1 微信支付回调
```
POST /payments/wx-notify
```

#### 7.2 查询支付状态
```
GET /payments/status/{orderNo}
```

### 8. 管理端API

#### 8.1 商品管理

##### 8.1.1 获取商品列表（管理端）
```
GET /admin/products?page=1&limit=20&status=all
```

##### 8.1.2 创建商品
```
POST /admin/products
```

**请求参数:**
```json
{
  "name": "3-6岁绘本盲盒（九成新）",
  "description": "商品描述",
  "coverImage": "封面图片",
  "bannerImages": ["轮播图1", "轮播图2"],
  "ageGroupId": 2,
  "conditionId": 5,
  "bookCount": 10,
  "originalPrice": 199.00,
  "salePrice": 89.00,
  "stock": 100,
  "isRecommended": false
}
```

##### 8.1.3 更新商品
```
PUT /admin/products/{id}
```

##### 8.1.4 删除/下架商品
```
DELETE /admin/products/{id}
```

##### 8.1.5 批量操作
```
POST /admin/products/batch
```

**请求参数:**
```json
{
  "action": "online|offline|delete",
  "productIds": [1, 2, 3]
}
```

#### 8.2 订单管理

##### 8.2.1 获取订单列表（管理端）
```
GET /admin/orders?page=1&limit=20&status=all&startDate=2023-12-01&endDate=2023-12-31
```

##### 8.2.2 更新订单状态
```
PUT /admin/orders/{orderNo}/status
```

**请求参数:**
```json
{
  "status": "shipped",
  "expressCompany": "顺丰速运",
  "expressNo": "SF1234567890",
  "adminRemark": "管理员备注"
}
```

##### 8.2.3 批量发货
```
POST /admin/orders/batch-ship
```

**请求参数:**
```json
{
  "orders": [
    {
      "orderNo": "202312250001",
      "expressCompany": "顺丰速运",
      "expressNo": "SF1234567890"
    }
  ]
}
```

#### 8.3 数据统计

##### 8.3.1 获取概览数据
```
GET /admin/statistics/overview
```

**响应数据:**
```json
{
  "code": 200,
  "data": {
    "todayOrders": 25,
    "todayRevenue": 2580.00,
    "totalOrders": 1250,
    "totalRevenue": 158000.00,
    "totalUsers": 860,
    "totalProducts": 45,
    "pendingOrders": 12,
    "lowStockProducts": 5
  }
}
```

##### 8.3.2 获取销售趋势
```
GET /admin/statistics/sales-trend?days=30
```

##### 8.3.3 获取商品销量排行
```
GET /admin/statistics/top-products?limit=10
```

#### 8.4 系统配置

##### 8.4.1 获取配置
```
GET /admin/configs
```

##### 8.4.2 更新配置
```
PUT /admin/configs
```

**请求参数:**
```json
{
  "wechat_app_id": "微信AppID",
  "wechat_app_secret": "微信AppSecret",
  "home_banner": [
    {
      "image": "banner图片地址",
      "link": "跳转链接"
    }
  ],
  "contact_info": {
    "phone": "客服电话",
    "wechat": "客服微信"
  }
}
```

### 9. 文件上传

#### 9.1 上传图片
```
POST /upload/image
```

**请求格式:** `multipart/form-data`

**响应数据:**
```json
{
  "code": 200,
  "data": {
    "url": "图片访问地址",
    "filename": "文件名",
    "size": 102400
  }
}
```

### 10. 通用接口

#### 10.1 获取快递公司列表
```
GET /express/companies
```

#### 10.2 查询快递信息
```
GET /express/track?company=顺丰速运&no=SF1234567890
```

## 错误处理

### 业务错误码
- **10001**: 用户未登录
- **10002**: 用户被禁用
- **20001**: 商品不存在
- **20002**: 库存不足
- **30001**: 订单不存在
- **30002**: 订单状态不允许操作
- **40001**: 支付失败
- **40002**: 支付超时

### 错误响应示例
```json
{
  "code": 20002,
  "message": "库存不足",
  "data": null,
  "timestamp": 1640995200000
}
``` 