// pages/order/order.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderItems: [],
    addressInfo: {
      name: '张先生',
      phone: '138****8888',
      detail: '宁波江北外滩大厦506'
    },
    deliveryType: 'express', // express: 快递配送, pickup: 门店自取
    orderNote: '',
    orderAmount: 54.00, // 商品金额
    firstDiscount: 10.00, // 首单优惠
    fullDiscount: 15.00, // 满减优惠
    deliveryFee: 0, // 运费
    finalAmount: 29.00 // 应付金额
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取系统信息，设置状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 20;
    wx.setStorageSync('statusBarHeight', statusBarHeight);
    
    // 加载订单数据
    this.loadOrderData();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '绘本盲盒订单确认 - 精选优质绘本',
      path: '/pages/order/order'
    };
  },

  /**
   * 加载订单数据
   */
  loadOrderData() {
    const orderData = wx.getStorageSync('orderData') || [];
    
    // 如果没有订单数据，添加示例数据
    if (orderData.length === 0) {
      orderData.push({
        id: 1,
        productId: 1,
        name: '3-6岁绘本盲盒·九成新',
        age: '3-6岁',
        condition: '九成新',
        count: 30,
        price: 54,
        quantity: 1,
        coverUrl: 'https://picsum.photos/200/150?random=1',
        averagePrice: '1.8'
      });
    }

    this.setData({
      orderItems: orderData
    });

    // 计算价格
    this.calculatePrice();
  },

  /**
   * 计算价格
   */
  calculatePrice() {
    const { orderItems, firstDiscount, fullDiscount, deliveryFee } = this.data;
    
    // 计算商品总金额
    const orderAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // 计算最终金额
    const finalAmount = Math.max(0, orderAmount - firstDiscount - fullDiscount + deliveryFee);
    
    this.setData({
      orderAmount: orderAmount,
      finalAmount: finalAmount
    });
  },

  /**
   * 返回按钮点击
   */
  onBackTap() {
    console.log('订单页面返回按钮被点击');
    
    // 获取当前页面栈
    const pages = getCurrentPages();
    console.log('当前页面栈长度:', pages.length);
    
    // 优先使用原生的返回功能
    if (pages.length > 1) {
      console.log('执行页面返回操作');
      wx.navigateBack({
        delta: 1,
        success: () => {
          console.log('页面返回成功');
        },
        fail: (error) => {
          console.log('页面返回失败:', error);
          console.log('跳转到购物车页面');
          // 如果返回失败，跳转到购物车页面
          wx.switchTab({
            url: '/pages/cart/cart'
          });
        }
      });
    } else {
      console.log('当前是第一个页面，跳转到购物车');
      // 如果是第一个页面，跳转到购物车
      wx.switchTab({
        url: '/pages/cart/cart'
      });
    }
  },

  /**
   * 选择收货地址
   */
  onSelectAddress() {
    wx.navigateTo({
      url: '/pages/address/address?from=order'
    });
  },

  /**
   * 添加新地址
   */
  onAddAddress() {
    wx.navigateTo({
      url: '/pages/address-edit/address-edit?mode=add&from=order'
    });
  },

  /**
   * 选择配送方式
   */
  onSelectDelivery(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      deliveryType: type
    });
    
    // 更新运费（这里可以根据实际业务逻辑调整）
    const deliveryFee = type === 'express' ? 0 : 0; // 都免费
    this.setData({
      deliveryFee: deliveryFee
    });
    
    this.calculatePrice();
  },

  /**
   * 订单备注输入
   */
  onNoteInput(e) {
    this.setData({
      orderNote: e.detail.value
    });
  },

  /**
   * 确认支付
   */
  onConfirmPayment() {
    const { addressInfo, orderItems, deliveryType, orderNote, finalAmount } = this.data;
    
    // 模拟支付流程
    wx.showLoading({
      title: '支付中...'
    });
    
    setTimeout(() => {
      wx.hideLoading();
      
      wx.showToast({
        title: '支付成功',
        icon: 'success',
        duration: 2000,
        success: () => {
          setTimeout(() => {
            // 清空购物车中对应的商品
            this.clearCartItems();
            
            // 跳转到首页
            wx.switchTab({
              url: '/pages/home/home'
            });
          }, 2000);
        }
      });
    }, 1500);
  },

  /**
   * 清空购物车中的已购买商品
   */
  clearCartItems() {
    const { orderItems } = this.data;
    let cart = wx.getStorageSync('cart') || [];
    
    // 从购物车中移除已购买的商品
    orderItems.forEach(orderItem => {
      cart = cart.filter(cartItem => cartItem.id !== orderItem.id);
    });
    
    // 更新购物车
    wx.setStorageSync('cart', cart);
    wx.setStorageSync('cartCount', cart.length);
    
    // 清空订单数据
    wx.removeStorageSync('orderData');
  }
})