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
      subtitle: '精选优质绘本，随机组合'
    },

    // 当前选中的配置
    selectedAge: '0-3',
    selectedCondition: '全新',
    selectedCount: 10,

    // 当前价格
    currentPrice: 35,
    originalPrice: 60,

    // 年龄选项
    ageOptions: [
      { label: '0-3岁', value: '0-3' },
      { label: '3-6岁', value: '3-6' },
      { label: '6-12岁', value: '6-12' }
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

    // 从数据库加载的商品价格映射
    productPriceMap: {},
    
    // 商品详细信息映射
    productMap: {},
    
    // 数据加载状态
    priceLoading: true,
    
    // 系统设置信息
    shippingTime: '48小时内发货', // 发货时间
    deliveryCompany: '顺丰速运' // 配送公司
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 如果有传入的商品ID，加载对应商品信息
    if (options.id) {
      this.loadProductInfo(options.id);
    }
    
    // 加载系统设置
    this.loadSystemSettings();
    
    // 加载商品价格数据
    this.loadProductPrices();
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
      path: `/pages/product-detail/product-detail?id=${this.data.productInfo.id}`
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
   * 从数据库加载商品价格数据
   */
  async loadProductPrices() {
    try {
      this.setData({
        priceLoading: true
      });

      console.log('开始加载商品价格数据...');

      const res = await wx.cloud.callFunction({
        name: 'product',
        data: {
          action: 'getProducts',
          pageSize: 100
        }
      });

      console.log('云函数返回结果:', res);

      if (res.result.success) {
        const data = res.result.data;
        const products = data.products || [];
        
        console.log('获取到商品数据:', products.length, '个商品');

        // 构建价格映射表和商品映射表
        const priceMap = {};
        const productMap = {};
        const availableOptions = {
          ageRanges: new Set(),
          conditions: new Set(),
          quantities: new Set()
        };
        
        // 首先收集所有可用的选项
        products.forEach(product => {
          if (product.status === 'active') {
            availableOptions.ageRanges.add(product.ageRange);
            availableOptions.conditions.add(product.conditionName);
            availableOptions.quantities.add(product.quantityName);
          }
        });

        // 构建选项组合的有效性映射
        const validCombinations = new Set();
        products.forEach(product => {
          if (product.status === 'active') {
            const key = `${product.ageRange}-${product.conditionName}-${product.quantityName}`;
            validCombinations.add(key);
          }
        });

        // 构建价格和商品映射
        products.forEach(product => {
          if (product.status === 'active') {
            const ageRange = product.ageRange;
            const condition = product.conditionName;
            const quantity = product.quantityName;
            
            if (!priceMap[ageRange]) {
              priceMap[ageRange] = {};
            }
            if (!priceMap[ageRange][condition]) {
              priceMap[ageRange][condition] = {};
            }
            
            if (!productMap[ageRange]) {
              productMap[ageRange] = {};
            }
            if (!productMap[ageRange][condition]) {
              productMap[ageRange][condition] = {};
            }
            
            // 提取数字部分作为key
            const quantityNum = parseInt(quantity.replace(/[^0-9]/g, ''));
            priceMap[ageRange][condition][quantityNum] = product.price;
            productMap[ageRange][condition][quantityNum] = product;
            
            console.log(`添加价格映射: ${ageRange} -> ${condition} -> ${quantityNum} = ¥${product.price}`);
          }
        });

        // 更新页面数据
        this.setData({
          priceMap,
          productMap,
          availableOptions: {
            ageRanges: Array.from(availableOptions.ageRanges).sort(),
            conditions: Array.from(availableOptions.conditions).sort(),
            quantities: Array.from(availableOptions.quantities).sort((a, b) => {
              const numA = parseInt(a.replace(/[^0-9]/g, ''));
              const numB = parseInt(b.replace(/[^0-9]/g, ''));
              return numA - numB;
            })
          },
          validCombinations: Array.from(validCombinations),
          priceLoading: false
        });

        // 初始化选中状态
        this.initializeSelection();
      } else {
        throw new Error('获取商品数据失败');
      }
    } catch (error) {
      console.error('加载商品价格失败:', error);
      this.setData({
        priceLoading: false
      });
      wx.showToast({
        title: '加载商品信息失败',
        icon: 'none'
      });
    }
  },

  /**
   * 初始化选中状态
   */
  initializeSelection() {
    const { availableOptions, validCombinations } = this.data;
    
    // 默认选中第一个可用的年龄段
    if (availableOptions.ageRanges.length > 0) {
      this.setData({
        selectedAgeRange: availableOptions.ageRanges[0]
      });
      this.updateAvailableOptions();
    }
  },

  /**
   * 更新可用的选项
   */
  updateAvailableOptions() {
    const { selectedAgeRange, selectedCondition, validCombinations } = this.data;
    
    // 根据已选择的选项，过滤出可用的选项
    const availableConditions = this.data.availableOptions.conditions.filter(condition => {
      if (!selectedAgeRange) return true;
      const key = `${selectedAgeRange}-${condition}-`;
      return validCombinations.some(combo => combo.startsWith(key));
    });

    const availableQuantities = this.data.availableOptions.quantities.filter(quantity => {
      if (!selectedAgeRange || !selectedCondition) return true;
      const key = `${selectedAgeRange}-${selectedCondition}-${quantity}`;
      return validCombinations.includes(key);
    });

    this.setData({
      availableConditions,
      availableQuantities
    });

    // 如果当前选中的选项不再可用，重置选择
    if (selectedCondition && !availableConditions.includes(selectedCondition)) {
      this.setData({ selectedCondition: '' });
    }
    if (this.data.selectedQuantity && !availableQuantities.includes(this.data.selectedQuantity)) {
      this.setData({ selectedQuantity: '' });
    }
  },

  /**
   * 选择年龄段
   */
  onAgeRangeSelect(e) {
    const ageRange = e.currentTarget.dataset.age;
    this.setData({
      selectedAgeRange: ageRange,
      selectedCondition: '',
      selectedQuantity: ''
    });
    this.updateAvailableOptions();
    // 选择年龄段后清空价格
    this.setData({
      currentPrice: 0,
      originalPrice: 0
    });
  },

  /**
   * 选择成色
   */
  onConditionSelect(e) {
    const condition = e.currentTarget.dataset.condition;
    this.setData({
      selectedCondition: condition,
      selectedQuantity: ''
    });
    this.updateAvailableOptions();
    // 选择成色后清空价格
    this.setData({
      currentPrice: 0,
      originalPrice: 0
    });
  },

  /**
   * 选择本数
   */
  onQuantitySelect(e) {
    const quantity = e.currentTarget.dataset.quantity;
    this.setData({
      selectedQuantity: quantity
    });
    // 选择本数后更新价格
    this.updateCurrentPrice();
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
   * 获取当前选择组合对应的商品
   */
  getCurrentProduct() {
    const { selectedAgeRange, selectedCondition, selectedQuantity, productMap } = this.data;
    if (!selectedAgeRange || !selectedCondition || !selectedQuantity) return null;
    
    const quantityNum = parseInt(selectedQuantity.replace(/[^0-9]/g, ''));
    return productMap[selectedAgeRange]?.[selectedCondition]?.[quantityNum];
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const loginInfo = wx.getStorageSync('loginInfo');
    return loginInfo && loginInfo.isLoggedIn;
  },

  /**
   * 显示登录提示
   */
  showLoginTip() {
    wx.showModal({
      title: '需要登录',
      content: '此功能需要登录后使用，是否立即登录？',
      success: (res) => {
        if (res.confirm) {
          this.performLogin();
        }
      }
    });
  },

  /**
   * 执行登录操作
   */
  performLogin() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        console.log('获取用户信息成功:', res);
        
        // 调用微信登录
        wx.login({
          success: (loginRes) => {
            console.log('微信登录成功:', loginRes);
            
            // 模拟登录成功
            const userInfo = {
              name: res.userInfo.nickName || '微信用户',
              status: '微信用户 · 普通会员',
              avatar: res.userInfo.avatarUrl || 'https://picsum.photos/200/200?random=user'
            };
            
            // 保存登录信息
            const loginInfo = {
              isLoggedIn: true,
              userInfo: userInfo,
              loginTime: Date.now(),
              openid: 'mock_openid_' + Date.now() // 模拟openid
            };
            
            wx.setStorageSync('loginInfo', loginInfo);
            
            wx.showToast({
              title: '登录成功',
              icon: 'success'
            });
          },
          fail: (error) => {
            console.error('微信登录失败:', error);
            wx.showToast({
              title: '登录失败',
              icon: 'error'
            });
          }
        });
      },
      fail: (error) => {
        console.error('获取用户信息失败:', error);
        wx.showToast({
          title: '取消授权',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 加入购物车
   */
  onAddToCart() {
    // 检查登录状态
    if (!this.checkLoginStatus()) {
      this.showLoginTip();
      return;
    }
    
    const { selectedAgeRange, selectedCondition, selectedQuantity, currentPrice } = this.data;
    
    if (!selectedAgeRange || !selectedCondition || !selectedQuantity) {
      wx.showToast({
        title: '请选择完整的商品规格',
        icon: 'none'
      });
      return;
    }
    
    if (currentPrice <= 0) {
      wx.showToast({
        title: '请稍等价格加载',
        icon: 'none'
      });
      return;
    }

    const currentProduct = this.getCurrentProduct();
    if (!currentProduct) {
      wx.showToast({
        title: '商品信息加载中',
        icon: 'none'
      });
      return;
    }
    
    const quantityNum = parseInt(selectedQuantity.replace(/[^0-9]/g, ''));
    
    // 构建商品信息
    const cartItem = {
      productId: currentProduct._id,
      name: currentProduct.name,
      age: selectedAgeRange,
      condition: selectedCondition,
      count: quantityNum,
      price: currentPrice,
      quantity: 1,
      originalProductData: currentProduct
    };

    // 保存到本地存储
    let cart = wx.getStorageSync('cart') || [];
    
    // 检查是否已存在相同配置的商品
    const existingIndex = cart.findIndex(item => 
      item.productId === cartItem.productId
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
    // 检查登录状态
    if (!this.checkLoginStatus()) {
      this.showLoginTip();
      return;
    }
    
    const { selectedAgeRange, selectedCondition, selectedQuantity, currentPrice } = this.data;
    
    if (!selectedAgeRange || !selectedCondition || !selectedQuantity) {
      wx.showToast({
        title: '请选择完整的商品规格',
        icon: 'none'
      });
      return;
    }
    
    if (currentPrice <= 0) {
      wx.showToast({
        title: '请稍等价格加载',
        icon: 'none'
      });
      return;
    }

    const currentProduct = this.getCurrentProduct();
    if (!currentProduct) {
      wx.showToast({
        title: '商品信息加载中',
        icon: 'none'
      });
      return;
    }
    
    const quantityNum = parseInt(selectedQuantity.replace(/[^0-9]/g, ''));
    
    // 构建订单商品信息
    const orderItem = {
      productId: currentProduct._id,
      name: currentProduct.name,
      age: selectedAgeRange,
      condition: selectedCondition,
      count: quantityNum,
      price: currentPrice,
      quantity: 1,
      originalProductData: currentProduct
    };

    // 跳转到订单确认页
    wx.setStorageSync('orderData', [orderItem]);
    wx.navigateTo({
      url: '/pages/order/order?type=buy'
    });
  },

  /**
   * 加载系统设置
   */
  loadSystemSettings() {
    // 先从本地存储获取设置
    const settings = wx.getStorageSync('adminSettings');
    if (settings) {
      this.applySystemSettings(settings);
    }
    
    // 从云函数获取最新设置
    wx.cloud.callFunction({
      name: 'admin',
      data: {
        action: 'getSettings'
      }
    }).then(res => {
      if (res.result.success && res.result.data) {
        const adminSettings = res.result.data;
        console.log('商品详情页获取到系统设置:', adminSettings);
        
        // 应用设置
        this.applySystemSettings(adminSettings);
        
        // 保存到本地存储
        wx.setStorageSync('adminSettings', adminSettings);
      }
    }).catch(err => {
      console.log('获取系统设置失败:', err);
    });
  },

  /**
   * 应用系统设置
   */
  applySystemSettings(settings) {
    const updateData = {};
    
    // 应用发货时间
    if (settings.shippingTimeIndex !== undefined) {
      const shippingTimeOptions = ['24小时内发货', '48小时内发货', '72小时内发货', '7天内发货'];
      updateData.shippingTime = shippingTimeOptions[settings.shippingTimeIndex] || '48小时内发货';
    }
    
    // 应用配送公司
    if (settings.deliveryCompanyIndex !== undefined) {
      const deliveryCompanyOptions = ['顺丰速运', '中通快递', '圆通速递', '申通快递', '韵达快递', '公司配送人员'];
      updateData.deliveryCompany = deliveryCompanyOptions[settings.deliveryCompanyIndex] || '顺丰速运';
    }
    
    console.log('商品详情页应用系统设置:', updateData);
    this.setData(updateData);
  },

  /**
   * 更新当前价格
   */
  updateCurrentPrice() {
    const { selectedAgeRange, selectedCondition, selectedQuantity, priceMap } = this.data;
    
    if (selectedAgeRange && selectedCondition && selectedQuantity) {
      const quantityNum = parseInt(selectedQuantity.replace(/[^0-9]/g, ''));
      const price = priceMap[selectedAgeRange]?.[selectedCondition]?.[quantityNum];
      
      if (price) {
        const currentPrice = Math.round(price); // 确保价格为整数
        const originalPrice = Math.round(price * 1.4); // 原价为现价的1.4倍，确保为整数
        
        this.setData({
          currentPrice,
          originalPrice,
          // 同时更新旧的字段名，保持兼容性
          selectedAge: selectedAgeRange,
          selectedCondition: selectedCondition,
          selectedCount: quantityNum
        });
        
        console.log('价格更新:', {
          selectedAgeRange,
          selectedCondition,
          selectedQuantity,
          quantityNum,
          currentPrice,
          originalPrice
        });
      }
    }
  }
})