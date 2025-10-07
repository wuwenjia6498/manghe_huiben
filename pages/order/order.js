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
    finalAmount: 29.00, // 应付金额
    fullReductionEnabled: false,
    fullReductionThreshold: 0,
    fullReductionAmount: 0,
    
    // 新增配送相关信息
    freeShippingThreshold: 50, // 免邮门槛
    showFreeShippingTip: false, // 是否显示免邮提示
    shippingTime: '48小时内发货', // 发货时间
    deliveryCompany: '顺丰速运' // 配送公司
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取系统信息，设置状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 20;
    wx.setStorageSync('statusBarHeight', statusBarHeight);
    
    // 加载默认地址
    this.loadDefaultAddress();
    
    // 加载系统设置
    this.loadSystemSettings();
    
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
    console.log('订单页面显示');
    // 检查是否有选中的地址
    const selectedAddress = wx.getStorageSync('selectedAddress');
    console.log('检查选中的地址:', selectedAddress);
    
    if (selectedAddress) {
      console.log('发现选中地址，更新页面数据');
      // 确保地址数据结构匹配
      const addressInfo = {
        name: selectedAddress.name,
        phone: selectedAddress.phone,
        detail: selectedAddress.detail
      };
      console.log('格式化后的地址信息:', addressInfo);
      
      this.setData({
        addressInfo: addressInfo
      });
      // 清除临时存储的地址
      wx.removeStorageSync('selectedAddress');
      console.log('地址已更新，临时存储已清除');
      
      wx.showToast({
        title: '地址已更新',
        icon: 'success'
      });
    }
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
   * 加载系统设置
   */
  loadSystemSettings() {
    // 先从本地存储获取设置
    const settings = wx.getStorageSync('adminSettings');
    if (settings) {
      this.applyDiscountSettings(settings);
      // 重新计算价格，包括运费
      this.calculatePrice();
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
        console.log('订单页面获取到系统设置:', adminSettings);
        
        // 应用设置
        this.applyDiscountSettings(adminSettings);
        
        // 保存到本地存储
        wx.setStorageSync('adminSettings', adminSettings);
        
        // 重新计算价格
        this.calculatePrice();
      }
    }).catch(err => {
      console.log('获取系统设置失败:', err);
    });
  },

  /**
   * 应用优惠设置
   */
  applyDiscountSettings(settings) {
    const updateData = {};
    
    // 应用首单优惠
    if (settings.firstOrderDiscountEnabled && settings.firstOrderDiscount) {
      const firstDiscount = parseFloat(settings.firstOrderDiscount) || 0;
      updateData.firstDiscount = firstDiscount;
    } else {
      updateData.firstDiscount = 0;
    }
    
    // 应用满减优惠
    if (settings.fullReductionEnabled && settings.fullReductionAmount && settings.fullReductionThreshold) {
      const threshold = parseFloat(settings.fullReductionThreshold) || 0;
      const reduction = parseFloat(settings.fullReductionAmount) || 0;
      
      // 检查是否满足满减条件（这里需要在计算价格时判断）
      updateData.fullReductionThreshold = threshold;
      updateData.fullReductionAmount = reduction;
      updateData.fullReductionEnabled = true;
    } else {
      updateData.fullReductionEnabled = false;
      updateData.fullDiscount = 0;
    }
    
    // 应用免邮门槛
    if (settings.freeShippingThreshold) {
      updateData.freeShippingThreshold = parseFloat(settings.freeShippingThreshold) || 50;
    }
    
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
    
    console.log('应用优惠设置:', updateData);
    this.setData(updateData);
    
    // 更新免邮提示
    this.updateFreeShippingTip();
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
    const { orderItems, firstDiscount, fullReductionEnabled, fullReductionThreshold, fullReductionAmount, deliveryType, freeShippingThreshold } = this.data;
    
    // 计算商品总金额
    const orderAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // 计算满减优惠
    let fullDiscount = 0;
    if (fullReductionEnabled && fullReductionThreshold && fullReductionAmount) {
      if (orderAmount >= fullReductionThreshold) {
        fullDiscount = fullReductionAmount;
      }
    }
    
    // 重新计算运费（考虑免邮门槛）
    let deliveryFee = 0;
    const settings = wx.getStorageSync('adminSettings');
    
    if (deliveryType === 'express') {
      // 快递配送，使用系统设置的配送费
      if (settings && settings.deliveryFee !== undefined) {
        deliveryFee = parseFloat(settings.deliveryFee) || 0;
        
        // 检查是否满足免邮条件
        if (freeShippingThreshold && freeShippingThreshold > 0) {
          if (orderAmount >= freeShippingThreshold) {
            deliveryFee = 0; // 满足免邮条件
          }
        }
      }
    } else if (deliveryType === 'pickup') {
      // 门店自取，免运费
      deliveryFee = 0;
    }
    
    // 计算最终金额，确保为整数
    const finalAmount = Math.max(0, Math.round(orderAmount - firstDiscount - fullDiscount + deliveryFee));
    
    console.log('价格计算详情:', {
      orderAmount,
      firstDiscount,
      fullDiscount,
      deliveryFee,
      finalAmount,
      fullReductionEnabled,
      fullReductionThreshold,
      fullReductionAmount,
      freeShippingThreshold,
      deliveryType
    });
    
    this.setData({
      orderAmount: Math.round(orderAmount),
      fullDiscount: Math.round(fullDiscount),
      deliveryFee: Math.round(deliveryFee), // 更新运费
      finalAmount: finalAmount
    });
    
    // 更新免邮提示
    this.updateFreeShippingTip();
  },

  /**
   * 更新免邮提示
   */
  updateFreeShippingTip() {
    const { orderAmount, freeShippingThreshold, deliveryType } = this.data;
    
    if (deliveryType === 'express' && freeShippingThreshold > 0) {
      const difference = freeShippingThreshold - orderAmount;
      if (difference > 0) {
        this.setData({
          showFreeShippingTip: true,
          freeShippingTipText: `再购买¥${Math.round(difference)}即可享受免邮`
        });
      } else {
        this.setData({
          showFreeShippingTip: true,
          freeShippingTipText: `已达到免邮门槛¥${freeShippingThreshold}`
        });
      }
    } else {
      this.setData({
        showFreeShippingTip: false
      });
    }
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
    
    // 根据配送方式和系统设置计算运费
    let deliveryFee = 0;
    const settings = wx.getStorageSync('adminSettings');
    
    if (type === 'express') {
      // 快递配送，使用系统设置的配送费
      if (settings && settings.deliveryFee !== undefined) {
        deliveryFee = parseFloat(settings.deliveryFee) || 0;
        
        // 检查是否满足免邮条件
        if (settings.freeShippingThreshold) {
          const threshold = parseFloat(settings.freeShippingThreshold) || 0;
          const { orderItems } = this.data;
          const orderAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
          
          if (orderAmount >= threshold) {
            deliveryFee = 0; // 满足免邮条件
          }
        }
      }
    } else if (type === 'pickup') {
      // 门店自取，免运费
      deliveryFee = 0;
    }
    
    console.log('配送方式变更:', {
      type,
      deliveryFee,
      settings: settings
    });
    
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
  async onConfirmPayment() {
    const { addressInfo, orderItems, deliveryType, orderNote, finalAmount, deliveryFee, firstDiscount, fullDiscount } = this.data;
    
    if (!orderItems || orderItems.length === 0) {
      wx.showToast({
        title: '订单商品为空',
        icon: 'error'
      });
      return;
    }
    
    // 显示支付加载状态
    wx.showLoading({
      title: '支付中...'
    });
    
    try {
      // 计算商品总金额
      const orderAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      // 创建订单
      const orderResult = await wx.cloud.callFunction({
        name: 'order',
        data: {
          action: 'createOrder',
          products: orderItems.map(item => ({
            productId: item.productId || item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            ageRange: item.age,
            condition: item.condition,
            count: item.count
          })),
          address: addressInfo,
          totalAmount: finalAmount,
          orderAmount: orderAmount, // 商品总金额
          deliveryFee: deliveryFee, // 运费
          firstDiscount: firstDiscount, // 首单优惠
          fullDiscount: fullDiscount, // 满减优惠
          remark: orderNote,
          deliveryType: deliveryType
        }
      });

      wx.hideLoading();

      if (orderResult.result.success) {
        const { orderId, orderNo } = orderResult.result.data;
        
        wx.showToast({
          title: '支付成功',
          icon: 'success',
          duration: 2000,
          success: () => {
            setTimeout(() => {
              // 清空购物车中对应的商品
              this.clearCartItems();
              
              // 跳转到订单详情页，而不是首页
              wx.redirectTo({
                url: `/pages/order-detail/order-detail?orderId=${orderId}&orderNo=${orderNo}`
              });
            }, 2000);
          }
        });
      } else {
        wx.showToast({
          title: orderResult.result.message || '支付失败',
          icon: 'error'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('支付失败:', error);
      wx.showToast({
        title: '支付失败，请重试',
        icon: 'error'
      });
    }
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
  },

  /**
   * 加载默认地址
   */
  loadDefaultAddress() {
    console.log('开始加载默认地址');
    const addressList = wx.getStorageSync('addressList') || [];
    console.log('获取到地址列表:', addressList);
    
    const defaultAddress = addressList.find(addr => addr.isDefault);
    console.log('默认地址:', defaultAddress);
    
    if (defaultAddress) {
      // 确保地址数据结构匹配
      const addressInfo = {
        name: defaultAddress.name,
        phone: defaultAddress.phone,
        detail: defaultAddress.detail
      };
      console.log('设置默认地址信息:', addressInfo);
      this.setData({
        addressInfo: addressInfo
      });
    } else if (addressList.length > 0) {
      // 如果没有默认地址，使用第一个地址
      const firstAddress = addressList[0];
      const addressInfo = {
        name: firstAddress.name,
        phone: firstAddress.phone,
        detail: firstAddress.detail
      };
      console.log('使用第一个地址:', addressInfo);
      this.setData({
        addressInfo: addressInfo
      });
    } else {
      console.log('没有地址数据，保持原有示例地址');
    }
    // 如果没有任何地址，保持原有的示例地址
  }
})