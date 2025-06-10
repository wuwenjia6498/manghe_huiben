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
    if (options.orderData) {
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
   * 增强订单信息，添加额外字段
   */
  enhanceOrderInfo(orderInfo) {
    // 添加地址信息
    orderInfo.address = {
      name: '张三',
      phone: '138****8888',
      detail: '广东省深圳市南山区科技园南区深南大道9988号'
    };

    // 添加费用明细
    orderInfo.goodsAmount = orderInfo.totalAmount + 5; // 假设有5元优惠
    orderInfo.deliveryFee = 0; // 包邮
    orderInfo.discountAmount = 5; // 优惠金额
    orderInfo.deliveryType = 'express'; // 配送方式

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