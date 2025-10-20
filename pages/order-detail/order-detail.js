// pages/order-detail/order-detail.js
// 引入支付SDK
const paymentSDK = require('../../utils/paymentSDK.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    orderInfo: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取传递的订单信息
    if (options.orderId) {
      // 通过订单ID从数据库加载
      this.loadOrderById(options.orderId);
    } else if (options.orderData) {
      // 通过传递的订单数据加载（兼容旧版本）
      try {
        const orderInfo = JSON.parse(decodeURIComponent(options.orderData));
        this.setData({
          orderInfo: this.enhanceOrderInfo(orderInfo)
        });
      } catch (error) {
        console.error('解析订单数据失败:', error);
        wx.showToast({
          title: '订单信息加载失败',
          icon: 'error'
        });
      }
    } else {
      wx.showToast({
        title: '订单信息不存在',
        icon: 'error'
      });
    }
  },

  /**
   * 通过订单ID从数据库加载订单信息
   */
  async loadOrderById(orderId) {
    try {
      wx.showLoading({
        title: '加载中...'
      });

      const res = await wx.cloud.callFunction({
        name: 'order',
        data: {
          action: 'getOrderById',
          orderId: orderId
        }
      });

      wx.hideLoading();

      if (res.result.success) {
        const orderData = res.result.data;
        console.log('加载到的订单数据:', orderData);
        
        // 转换订单数据格式
        const orderInfo = this.convertDatabaseOrderToUI(orderData);
        this.setData({
          orderInfo: orderInfo
        });
      } else {
        wx.showToast({
          title: res.result.message || '订单加载失败',
          icon: 'error'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 2000);
      }
    } catch (error) {
      wx.hideLoading();
      console.error('加载订单详情失败:', error);
      wx.showToast({
        title: '网络错误',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }
  },

  /**
   * 将数据库订单数据转换为UI显示格式
   */
  convertDatabaseOrderToUI(orderData) {
    // 状态映射
    const statusMap = {
      'pending': { text: '待支付', desc: '请尽快完成支付，超时订单将自动取消' },
      'paid': { text: '待发货', desc: '您的订单已付款，正在准备发货' },
      'shipped': { text: '待收货', desc: '您的包裹正在路上，请耐心等待' },
      'completed': { text: '已完成', desc: '订单已完成，感谢您的购买' },
      'cancelled': { text: '已取消', desc: '订单已取消' }
    };

    const statusInfo = statusMap[orderData.status] || { text: '未知状态', desc: '' };

    // 从数据库订单数据中获取真实的金额信息
    const orderAmount = Math.round(orderData.orderAmount || orderData.totalAmount);
    const deliveryFee = Math.round(orderData.deliveryFee || 0);
    const firstDiscount = Math.round(orderData.firstDiscount || 0);
    const fullDiscount = Math.round(orderData.fullDiscount || 0);
    const totalAmount = Math.round(orderData.totalAmount);

    console.log('订单金额信息:', {
      orderAmount,
      deliveryFee,
      firstDiscount,
      fullDiscount,
      totalAmount
    });

    return {
      id: orderData._id,
      orderNo: orderData.orderNo,
      status: orderData.status,
      statusText: statusInfo.text,
      statusDesc: statusInfo.desc,
      createTime: this.formatTime(orderData.createTime),
      address: orderData.address,
      deliveryType: orderData.deliveryType || 'express',
      remark: orderData.remark || '',
      
      // 商品信息
      goods: orderData.products.map(product => ({
        id: product.productId,
        name: product.name,
        age: product.ageRange,
        condition: product.condition,
        count: product.count + '本装',
        price: Math.round(product.price),
        quantity: product.quantity,
        averagePrice: Math.round(product.price / parseInt(product.count))
      })),
      
      // 金额信息 - 从数据库读取真实数据
      goodsAmount: orderAmount,
      deliveryFee: deliveryFee,
      firstDiscount: firstDiscount,
      fullDiscount: fullDiscount,
      discountAmount: firstDiscount + fullDiscount, // 总优惠金额
      totalAmount: totalAmount,
      
      // 物流信息
      trackingNumber: orderData.trackingNo || '',
      shippingCompany: this.getShippingCompanyName(orderData.deliveryType)
    };
  },

  /**
   * 根据配送方式获取配送公司名称
   */
  getShippingCompanyName(deliveryType) {
    if (deliveryType === 'pickup') {
      return '门店自取';
    }
    
    // 从系统设置中获取配送公司
    const settings = wx.getStorageSync('adminSettings');
    if (settings && settings.deliveryCompanyIndex !== undefined) {
      const companies = ['顺丰速运', '中通快递', '圆通速递', '申通快递', '韵达快递', '公司配送人员'];
      return companies[settings.deliveryCompanyIndex] || '圆通速递';
    }
    
    return '圆通速递';
  },

  /**
   * 格式化时间
   */
  formatTime(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  /**
   * 增强订单信息，添加额外字段
   */
  enhanceOrderInfo(orderInfo) {
    // 添加地址信息
    orderInfo.address = {
      name: '张三',
      phone: '138****8888',
      detail: '广东省深圳市南山区科技园南区深南大道9988号'
    };

    // 使用真实的费用明细而不是硬编码
    const orderAmount = Math.round(orderInfo.totalAmount);
    const deliveryFee = Math.round(orderInfo.deliveryFee || 0);
    const discountAmount = Math.round((orderInfo.firstDiscount || 0) + (orderInfo.fullDiscount || 0));
    
    orderInfo.goodsAmount = orderAmount + discountAmount - deliveryFee; // 商品原价
    orderInfo.deliveryFee = deliveryFee; // 使用真实运费
    orderInfo.discountAmount = discountAmount; // 使用真实优惠金额
    orderInfo.deliveryType = orderInfo.deliveryType || 'express'; // 配送方式

    console.log('增强订单信息:', {
      goodsAmount: orderInfo.goodsAmount,
      deliveryFee: orderInfo.deliveryFee,
      discountAmount: orderInfo.discountAmount,
      totalAmount: orderInfo.totalAmount
    });

    return orderInfo;
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

  },

  /**
   * 返回按钮点击
   */
  onBackTap() {
    console.log('订单详情页返回按钮被点击');
    
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
          console.log('跳转到订单列表页面');
          // 如果返回失败，跳转到订单列表页面
          wx.navigateTo({
            url: '/pages/orders/orders'
          });
        }
      });
    } else {
      console.log('当前是第一个页面，跳转到订单列表');
      // 如果是第一个页面，跳转到订单列表
      wx.navigateTo({
        url: '/pages/orders/orders'
      });
    }
  },

  /**
   * 联系客服
   */
  onContactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-123-4567\n工作时间：9:00-18:00',
      showCancel: false,
      confirmText: '确定'
    });
  },

  /**
   * 再次购买
   */
  onBuyAgain() {
    const { orderInfo } = this.data;
    
    // 将订单商品加入购物车
    let cart = wx.getStorageSync('cart') || [];
    
    orderInfo.goods.forEach(goods => {
      // 检查购物车中是否已有相同商品
      const existIndex = cart.findIndex(item => 
        item.productId === goods.id && 
        item.age === goods.age && 
        item.condition === goods.condition &&
        item.count === goods.count
      );
      
      if (existIndex >= 0) {
        // 如果已存在，增加数量
        cart[existIndex].quantity += goods.quantity;
      } else {
        // 如果不存在，添加新商品
        cart.push({
          id: Date.now() + Math.random(), // 生成唯一ID
          productId: goods.id,
          name: goods.name,
          age: goods.age,
          condition: goods.condition,
          count: goods.count,
          price: goods.price,
          quantity: goods.quantity,
          selected: false,
          coverUrl: goods.coverUrl,
          averagePrice: goods.averagePrice,
          description: '再次购买'
        });
      }
    });
    
    // 保存购物车
    wx.setStorageSync('cart', cart);
    
    wx.showToast({
      title: '已加入购物车',
      icon: 'success',
      success: () => {
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/cart/cart'
          });
        }, 1500);
      }
    });
  },

  /**
   * 确认收货
   */
  onConfirmReceive() {
    wx.showModal({
      title: '确认收货',
      content: '确认已收到商品吗？确认后订单将完成。',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '收货成功',
            icon: 'success',
            success: () => {
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            }
          });
        }
      }
    });
  },

  /**
   * 继续支付
   */
  async onContinuePay() {
    const { orderInfo } = this.data;
    const orderId = orderInfo.id;
    const orderNo = orderInfo.orderNo;
    const totalAmount = orderInfo.totalAmount;
    
    console.log('=== 继续支付订单 ===');
    console.log('订单ID:', orderId);
    console.log('订单号:', orderNo);
    console.log('订单金额:', totalAmount);
    
    wx.showModal({
      title: '继续支付',
      content: `订单金额：¥${totalAmount}\n是否继续完成支付？`,
      confirmText: '去支付',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '准备支付...' });
          
          try {
            // 获取用户信息
            const loginInfo = wx.getStorageSync('loginInfo');
            const userInfo = loginInfo.userInfo || {};
            
            // 构建支付参数
            const paymentAmount = Math.round(totalAmount * 100); // 转换为分
            const paymentOptions = {
              orderId: orderId,
              orderNo: orderNo,
              amount: paymentAmount,  // ⚠️ 必须使用 amount 字段
              description: `订单号：${orderNo}`
            };
            
            console.log('支付参数:', paymentOptions);
            
            wx.hideLoading();
            
            // 调用支付SDK发起支付
            const paymentResult = await paymentSDK.processPayment(userInfo, paymentOptions);
            
            console.log('支付结果:', paymentResult);
            
            if (paymentResult.success) {
              // 支付成功，立即更新订单状态
              await wx.cloud.callFunction({
                name: 'order',
                data: {
                  action: 'updateOrderStatus',
                  orderId: orderId,
                  status: 'paid',
                  paymentStatus: 'paid'
                }
              });
              
              wx.showToast({
                title: '支付成功',
                icon: 'success'
              });
              
              // 刷新订单详情
              setTimeout(() => {
                this.loadOrderDetail();
              }, 1500);
            } else if (paymentResult.cancelled) {
              // 用户取消支付
              wx.showToast({
                title: '支付已取消',
                icon: 'none'
              });
            } else {
              // 支付失败
              wx.showToast({
                title: paymentResult.message || '支付失败',
                icon: 'none'
              });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('支付异常:', error);
            wx.showToast({
              title: '支付异常，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  /**
   * 取消订单
   */
  onCancelOrder() {
    wx.showModal({
      title: '取消订单',
      content: '确定要取消这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '订单已取消',
            icon: 'success',
            success: () => {
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            }
          });
        }
      }
    });
  }
}) 