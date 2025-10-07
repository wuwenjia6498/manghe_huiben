// API工具类 - 封装云函数调用
const app = getApp();

class API {
  // 通用云函数调用方法
  static async callCloudFunction(functionName, data = {}) {
    try {
      const result = await wx.cloud.callFunction({
        name: functionName,
        data: data
      });
      
      if (result.result && result.result.success) {
        return {
          success: true,
          data: result.result.data,
          message: result.result.message
        };
      } else {
        console.error(`云函数 ${functionName} 调用失败:`, result.result);
        return {
          success: false,
          message: result.result?.message || '调用失败',
          error: result.result
        };
      }
    } catch (error) {
      console.error(`云函数 ${functionName} 调用异常:`, error);
      return {
        success: false,
        message: '网络异常，请重试',
        error: error
      };
    }
  }

  // 显示加载提示
  static showLoading(title = '加载中...') {
    wx.showLoading({
      title: title,
      mask: true
    });
  }

  // 隐藏加载提示
  static hideLoading() {
    wx.hideLoading();
  }

  // 显示成功提示
  static showSuccess(message) {
    wx.showToast({
      title: message,
      icon: 'success',
      duration: 2000
    });
  }

  // 显示错误提示
  static showError(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  }

  // ==================== 用户认证相关 ====================
  
  // 用户登录
  static async login(userInfo = null) {
    return await this.callCloudFunction('auth', {
      action: 'login',
      userInfo: userInfo
    });
  }

  // 获取用户信息
  static async getUserInfo() {
    return await this.callCloudFunction('auth', {
      action: 'getUserInfo'
    });
  }

  // 更新用户信息
  static async updateUserInfo(userInfo) {
    return await this.callCloudFunction('auth', {
      action: 'updateUserInfo',
      userInfo: userInfo
    });
  }

  // 检查管理员权限
  static async checkAdmin() {
    return await this.callCloudFunction('auth', {
      action: 'checkAdmin'
    });
  }

  // ==================== 商品相关 ====================
  
  // 获取商品列表
  static async getProducts(params = {}) {
    return await this.callCloudFunction('product', {
      action: 'getProducts',
      ...params
    });
  }

  // 获取商品详情
  static async getProductDetail(productId) {
    return await this.callCloudFunction('product', {
      action: 'getProductDetail',
      productId: productId
    });
  }

  // 获取分类列表
  static async getCategories() {
    return await this.callCloudFunction('product', {
      action: 'getCategories'
    });
  }

  // 开盲盒
  static async openBlindBox(productId) {
    return await this.callCloudFunction('product', {
      action: 'openBlindBox',
      productId: productId
    });
  }

  // 添加商品（管理员）
  static async addProduct(product) {
    return await this.callCloudFunction('product', {
      action: 'addProduct',
      product: product
    });
  }

  // 更新商品（管理员）
  static async updateProduct(productId, product) {
    return await this.callCloudFunction('product', {
      action: 'updateProduct',
      productId: productId,
      product: product
    });
  }

  // 删除商品（管理员）
  static async deleteProduct(productId) {
    return await this.callCloudFunction('product', {
      action: 'deleteProduct',
      productId: productId
    });
  }

  // ==================== 购物车相关 ====================
  
  // 添加到购物车
  static async addToCart(productId, quantity = 1) {
    return await this.callCloudFunction('cart', {
      action: 'addToCart',
      productId: productId,
      quantity: quantity
    });
  }

  // 获取购物车列表
  static async getCartItems() {
    return await this.callCloudFunction('cart', {
      action: 'getCartItems'
    });
  }

  // 更新购物车商品数量
  static async updateCartItem(cartItemId, quantity) {
    return await this.callCloudFunction('cart', {
      action: 'updateCartItem',
      cartItemId: cartItemId,
      quantity: quantity
    });
  }

  // 删除购物车商品
  static async removeFromCart(cartItemId) {
    return await this.callCloudFunction('cart', {
      action: 'removeFromCart',
      cartItemId: cartItemId
    });
  }

  // 清空购物车
  static async clearCart() {
    return await this.callCloudFunction('cart', {
      action: 'clearCart'
    });
  }

  // 获取购物车商品数量
  static async getCartCount() {
    return await this.callCloudFunction('cart', {
      action: 'getCartCount'
    });
  }

  // ==================== 订单相关 ====================
  
  // 创建订单
  static async createOrder(products, address, totalAmount, remark = '') {
    return await this.callCloudFunction('order', {
      action: 'createOrder',
      products: products,
      address: address,
      totalAmount: totalAmount,
      remark: remark
    });
  }

  // 获取用户订单列表
  static async getOrders(params = {}) {
    return await this.callCloudFunction('order', {
      action: 'getOrders',
      ...params
    });
  }

  // 获取订单详情
  static async getOrderDetail(orderId) {
    return await this.callCloudFunction('order', {
      action: 'getOrderDetail',
      orderId: orderId
    });
  }

  // 更新订单状态
  static async updateOrderStatus(orderId, status, paymentStatus = null) {
    return await this.callCloudFunction('order', {
      action: 'updateOrderStatus',
      orderId: orderId,
      status: status,
      paymentStatus: paymentStatus
    });
  }

  // 取消订单
  static async cancelOrder(orderId) {
    return await this.callCloudFunction('order', {
      action: 'cancelOrder',
      orderId: orderId
    });
  }

  // 获取所有订单（管理员）
  static async getAllOrders(params = {}) {
    return await this.callCloudFunction('order', {
      action: 'getAllOrders',
      ...params
    });
  }

  // 更新订单状态（管理员）
  static async updateOrderStatusAdmin(orderId, status, paymentStatus = null, trackingNo = null) {
    return await this.callCloudFunction('order', {
      action: 'updateOrderStatusAdmin',
      orderId: orderId,
      status: status,
      paymentStatus: paymentStatus,
      trackingNo: trackingNo
    });
  }
}

module.exports = API; 