// pages/order/order.js
// 引入支付SDK
const paymentSDK = require('../../utils/paymentSDK.js');
const util = require('../../utils/util.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderItems: [],
    addressInfo: null, // 初始为空，从云端加载
    hasAddress: false, // 是否有地址
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
    // 获取系统信息，设置状态栏高度（使用新API）
    const windowInfo = wx.getWindowInfo();
    const statusBarHeight = windowInfo.statusBarHeight || 20;
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
    // 检查是否有选中的地址
    const selectedAddress = wx.getStorageSync('selectedAddress');
    
    if (selectedAddress) {
      const addressInfo = {
        name: selectedAddress.name,
        phone: selectedAddress.phone,
        detail: selectedAddress.detail
      };
      
      this.setData({
        addressInfo: addressInfo,
        hasAddress: true
      });
      
      wx.removeStorageSync('selectedAddress');
      
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
    // 检查用户状态
    const userStatus = await util.checkUserStatus();
    if (userStatus.isBlocked) {
      util.showBlockedAlert();
      return;
    }

    const { addressInfo, orderItems, deliveryType, orderNote, finalAmount, deliveryFee, firstDiscount, fullDiscount } = this.data;
    
    if (!orderItems || orderItems.length === 0) {
      wx.showToast({
        title: '订单商品为空',
        icon: 'error'
      });
      return;
    }
    
    // 检查收货地址（静默登录后，验证必要信息）
    if (!addressInfo || !addressInfo.name || !addressInfo.phone) {
      wx.showModal({
        title: '请填写收货地址',
        content: '下单需要填写收货地址，请先添加地址',
        confirmText: '去添加',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/address/address'
            });
          }
        }
      });
      return;
    }
    
    // 获取登录信息（静默登录后一定有 openid）
    const loginInfo = wx.getStorageSync('loginInfo');
    
    // 显示支付加载状态
    wx.showLoading({
      title: '创建订单中...'
    });
    
    try {
      // 计算商品总金额
      const orderAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      // 创建订单
      console.log('=== 开始创建订单 ===');
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

      console.log('订单创建结果:', orderResult);

      if (orderResult.result.success) {
        const { orderId, orderNo } = orderResult.result.data;
        console.log('订单创建成功，订单号:', orderNo);
        
        // 准备用户信息
        const userInfo = Object.assign({}, loginInfo.userInfo, {
          nickName: loginInfo.userInfo.nickName || loginInfo.userInfo.name || '微信用户',
          name: loginInfo.userInfo.name || loginInfo.userInfo.nickName || '微信用户',
          openid: loginInfo.userInfo.openid || loginInfo.openid || 'mock_openid'
        });
        
        // 准备支付参数（金额转为分）
        const paymentAmount = Math.round(finalAmount * 100); // 转为分
        const paymentOptions = {
          amount: paymentAmount,
          description: `绘本盲盒订单-${orderNo}`,
          // attach字段限制128字节，只传订单号
          attach: orderNo
        };
        
        console.log('=== 开始发起支付 ===');
        console.log('支付金额（分）:', paymentAmount);
        console.log('支付金额（元）:', finalAmount);
        console.log('用户信息:', userInfo);
        
        wx.hideLoading();
        
        // 调用支付SDK发起真实支付
        paymentSDK.processPayment(userInfo, paymentOptions)
          .then((paymentResult) => {
            console.log('支付结果:', paymentResult);
            
            if (paymentResult.success) {
              // 支付成功
              this.handlePaymentSuccess(orderId, orderNo);
            } else if (paymentResult.cancelled) {
              // 用户取消支付
              wx.showModal({
                title: '支付已取消',
                content: '您可以在"我的订单"中继续完成支付',
                confirmText: '查看订单',
                cancelText: '返回',
                success: (res) => {
                  if (res.confirm) {
                    wx.redirectTo({
                      url: `/pages/order-detail/order-detail?orderId=${orderId}&orderNo=${orderNo}`
                    });
                  }
                }
              });
            } else {
              // 支付失败
              wx.showModal({
                title: '支付失败',
                content: paymentResult.message || '支付过程中出现错误，您可以在"我的订单"中继续完成支付',
                confirmText: '查看订单',
                cancelText: '返回',
                success: (res) => {
                  if (res.confirm) {
                    wx.redirectTo({
                      url: `/pages/order-detail/order-detail?orderId=${orderId}&orderNo=${orderNo}`
                    });
                  }
                }
              });
            }
          })
          .catch((error) => {
            console.error('支付异常:', error);
            wx.showModal({
              title: '支付异常',
              content: '支付过程中发生异常，您可以在"我的订单"中继续完成支付',
              showCancel: false
            });
          });
          
      } else {
        wx.hideLoading();
        wx.showToast({
          title: orderResult.result.message || '创建订单失败',
          icon: 'error'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('创建订单失败:', error);
      wx.showToast({
        title: '创建订单失败，请重试',
        icon: 'error'
      });
    }
  },
  
  /**
   * 处理支付成功
   */
  async handlePaymentSuccess(orderId, orderNo) {
    console.log('支付成功，订单ID:', orderId, '订单号:', orderNo);
    
    try {
      // 立即更新订单状态为已支付（待发货）
      await wx.cloud.callFunction({
        name: 'order',
        data: {
          action: 'updateOrderStatus',
          orderId: orderId,
          status: 'paid',
          paymentStatus: 'paid'
        }
      });
      console.log('订单状态已更新为待发货');
    } catch (error) {
      console.error('更新订单状态失败:', error);
      // 即使更新失败也继续，因为支付回调会处理
    }
    
    wx.showToast({
      title: '支付成功',
      icon: 'success',
      duration: 2000,
      success: () => {
        setTimeout(() => {
          // 清空购物车中对应的商品
          this.clearCartItems();
          
          // 跳转到订单详情页
          wx.redirectTo({
            url: `/pages/order-detail/order-detail?orderId=${orderId}&orderNo=${orderNo}`
          });
        }, 2000);
      }
    });
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
   * 加载默认地址（从云端）
   */
  async loadDefaultAddress() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'getAddresses'
        }
      });

      if (res.result && res.result.success) {
        const addressList = res.result.data || [];
        const defaultAddress = addressList.find(addr => addr.isDefault);
        
        if (defaultAddress) {
          this.setData({
            addressInfo: {
              name: defaultAddress.name,
              phone: defaultAddress.phone,
              detail: defaultAddress.detail
            },
            hasAddress: true
          });
        } else if (addressList.length > 0) {
          const firstAddress = addressList[0];
          this.setData({
            addressInfo: {
              name: firstAddress.name,
              phone: firstAddress.phone,
              detail: firstAddress.detail
            },
            hasAddress: true
          });
        } else {
          this.setData({
            addressInfo: null,
            hasAddress: false
          });
        }
      }
    } catch (error) {
      console.error('加载默认地址失败:', error);
    }
  }
})