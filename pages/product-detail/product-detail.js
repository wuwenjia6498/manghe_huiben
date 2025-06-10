// pages/product-detail/product-detail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 商品基础信息
    productInfo: {
      id: 1,
      name: '绘本盲盒',
      subtitle: '精选优质绘本，随机组合',
      coverUrl: 'https://picsum.photos/600/400?random=1'
    },

    // 当前选中的配置
    selectedAge: '3-6岁',
    selectedCondition: '九成新',
    selectedCount: 30,

    // 当前价格
    currentPrice: 54,
    originalPrice: 119,

    // 年龄选项
    ageOptions: [
      { label: '0-3岁', value: '0-3岁' },
      { label: '3-6岁', value: '3-6岁' },
      { label: '6岁以上', value: '6岁以上' }
    ],

    // 新旧程度选项
    conditionOptions: [
      { label: '全新', value: '全新' },
      { label: '九成新', value: '九成新' },
      { label: '七成新', value: '七成新' },
      { label: '五成新', value: '五成新' }
    ],

    // 本数选项
    countOptions: [
      { label: '10本装', value: 10 },
      { label: '20本装', value: 20 },
      { label: '30本装', value: 30 }
    ],

    // 成新度说明
    conditionInfo: [
      { condition: '全新', description: '未拆封仅收刀痕未到封，完美品相' },
      { condition: '九成新', description: '少量翻阅痕迹，整体十分完整' },
      { condition: '七成新', description: '正常使用痕迹，内容清晰可读' },
      { condition: '五成新', description: '明显使用痕迹，不影响阅读内容' }
    ],

    // 价格映射表
    priceMap: {
      '0-3岁': {
        '全新': { 10: 35, 20: 60, 30: 85 },
        '九成新': { 10: 25, 20: 45, 30: 60 },
        '七成新': { 10: 18, 20: 32, 30: 45 },
        '五成新': { 10: 12, 20: 22, 30: 32 }
      },
      '3-6岁': {
        '全新': { 10: 45, 20: 80, 30: 110 },
        '九成新': { 10: 32, 20: 58, 30: 80 },
        '七成新': { 10: 24, 20: 42, 30: 58 },
        '五成新': { 10: 16, 20: 28, 30: 40 }
      },
      '6岁以上': {
        '全新': { 10: 40, 20: 70, 30: 95 },
        '九成新': { 10: 28, 20: 50, 30: 70 },
        '七成新': { 10: 20, 20: 36, 30: 50 },
        '五成新': { 10: 14, 20: 24, 30: 34 }
      }
    },

    // 原价映射表
    originalPriceMap: {
      10: 60,
      20: 120,
      30: 180
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 如果有传入的商品ID，加载对应商品信息
    if (options.id) {
      this.loadProductInfo(options.id);
    }
    
    // 初始化价格
    this.updatePrice();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    wx.setNavigationBarTitle({
      title: '商品详情'
    });
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
    wx.stopPullDownRefresh();
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
      title: `绘本盲盒 - ${this.data.selectedAge} ${this.data.selectedCondition} ${this.data.selectedCount}本装`,
      path: `/pages/product-detail/product-detail?id=${this.data.productInfo.id}`,
      imageUrl: this.data.productInfo.coverUrl
    };
  },

  /**
   * 加载商品信息
   */
  loadProductInfo(productId) {
    // TODO: 根据productId从服务器获取商品信息
    console.log('加载商品信息:', productId);
    
    // 这里可以调用API获取商品详情
    // 暂时使用静态数据
  },

  /**
   * 更新价格
   */
  updatePrice() {
    const { selectedAge, selectedCondition, selectedCount, priceMap, originalPriceMap } = this.data;
    
    const currentPrice = priceMap[selectedAge]?.[selectedCondition]?.[selectedCount] || 54;
    const originalPrice = originalPriceMap[selectedCount] || 119;
    
    this.setData({
      currentPrice,
      originalPrice
    });
  },

  /**
   * 选择年龄段
   */
  onSelectAge(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      selectedAge: value
    });
    this.updatePrice();
  },

  /**
   * 选择新旧程度
   */
  onSelectCondition(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      selectedCondition: value
    });
    this.updatePrice();
  },

  /**
   * 选择本数
   */
  onSelectCount(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      selectedCount: value
    });
    this.updatePrice();
  },

  /**
   * 返回按钮点击
   */
  onBackTap() {
    wx.navigateBack();
  },

  /**
   * 分享按钮点击
   */
  onShareTap() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  /**
   * 加入购物车
   */
  onAddToCart() {
    const { selectedAge, selectedCondition, selectedCount, currentPrice, productInfo } = this.data;
    
    // 构建商品信息
    const cartItem = {
      productId: productInfo.id,
      name: `${productInfo.name} - ${selectedAge} ${selectedCondition} ${selectedCount}本装`,
      age: selectedAge,
      condition: selectedCondition,
      count: selectedCount,
      price: currentPrice,
      coverUrl: productInfo.coverUrl,
      quantity: 1
    };

    // 保存到本地存储
    let cart = wx.getStorageSync('cart') || [];
    
    // 检查是否已存在相同配置的商品
    const existingIndex = cart.findIndex(item => 
      item.productId === cartItem.productId &&
      item.age === cartItem.age &&
      item.condition === cartItem.condition &&
      item.count === cartItem.count
    );

    if (existingIndex >= 0) {
      // 如果已存在，增加数量
      cart[existingIndex].quantity += 1;
    } else {
      // 如果不存在，添加新商品
      cart.push(cartItem);
    }

    wx.setStorageSync('cart', cart);
    wx.setStorageSync('cartCount', cart.length);

    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    });

    // 更新tabBar徽章
    if (cart.length > 0) {
      wx.setTabBarBadge({
        index: 2, // 购物车tab索引
        text: cart.length.toString()
      });
    }
  },

  /**
   * 立即购买
   */
  onBuyNow() {
    const { selectedAge, selectedCondition, selectedCount, currentPrice, productInfo } = this.data;
    
    // 构建订单商品信息
    const orderItem = {
      productId: productInfo.id,
      name: `${productInfo.name} - ${selectedAge} ${selectedCondition} ${selectedCount}本装`,
      age: selectedAge,
      condition: selectedCondition,
      count: selectedCount,
      price: currentPrice,
      coverUrl: productInfo.coverUrl,
      quantity: 1
    };

    // 跳转到订单确认页
    wx.setStorageSync('orderData', [orderItem]);
    wx.navigateTo({
      url: '/pages/order/order?type=buy'
    });
  }
})