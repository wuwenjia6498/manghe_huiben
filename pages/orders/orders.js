Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 'all', // 当前选中的标签页
    orderList: [], // 订单列表
    allOrders: [], // 所有订单数据（用于筛选）
    loading: true, // 加载状态
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取系统信息，设置状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 20;
    wx.setStorageSync('statusBarHeight', statusBarHeight);
    
    // 获取传递的订单类型参数
    const { type } = options;
    if (type) {
      this.setData({
        currentTab: type
      });
    }
    
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
    this.loadOrderData(); // 每次显示时刷新订单数据
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
    this.setData({
      page: 1,
      hasMore: true
    });
    this.loadOrderData();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreOrders();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '绘本盲盒订单 - 精选优质绘本',
      path: '/pages/home/home'
    };
  },

  /**
   * 加载订单数据
   */
  async loadOrderData() {
    this.setData({ loading: true });
    
    try {
      console.log('开始加载订单数据...');
      const res = await wx.cloud.callFunction({
        name: 'order',
        data: {
          action: 'getOrders',
          page: 1,
          pageSize: this.data.pageSize,
          status: this.data.currentTab === 'all' ? '' : this.data.currentTab
        }
      });

      console.log('获取订单数据结果:', res);

      if (res.result && res.result.success) {
        const orderData = res.result.data;
        const orders = orderData.orders || [];
        
        console.log('获取到订单数据:', orders.length, '个订单');

        // 转换订单数据格式
        const formattedOrders = orders.map(order => this.formatOrderForUI(order));

        this.setData({
          allOrders: formattedOrders,
          orderList: formattedOrders,
          loading: false,
          hasMore: orders.length >= this.data.pageSize,
          page: 1
        });
      } else {
        console.error('获取订单失败:', res.result?.message);
        wx.showToast({
          title: res.result?.message || '订单加载失败',
          icon: 'none'
        });
        
        this.setData({
          allOrders: [],
          orderList: [],
          loading: false
        });
      }
    } catch (error) {
      console.error('加载订单数据出错:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
      
      this.setData({
        allOrders: [],
        orderList: [],
        loading: false
      });
    }
  },

  /**
   * 加载更多订单
   */
  async loadMoreOrders() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    const nextPage = this.data.page + 1;
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'order',
        data: {
          action: 'getOrders',
          page: nextPage,
          pageSize: this.data.pageSize,
          status: this.data.currentTab === 'all' ? '' : this.data.currentTab
        }
      });

      if (res.result && res.result.success) {
        const orderData = res.result.data;
        const orders = orderData.orders || [];
        
        if (orders.length > 0) {
          const formattedOrders = orders.map(order => this.formatOrderForUI(order));
          const newAllOrders = [...this.data.allOrders, ...formattedOrders];
          
          this.setData({
            allOrders: newAllOrders,
            orderList: newAllOrders,
            page: nextPage,
            hasMore: orders.length >= this.data.pageSize
          });
        } else {
          this.setData({ hasMore: false });
        }
      }
    } catch (error) {
      console.error('加载更多订单失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 格式化订单数据用于UI显示
   */
  formatOrderForUI(orderData) {
    // 状态映射
    const statusMap = {
      'pending': { text: '待发货', color: 'pending' },
      'paid': { text: '待发货', color: 'pending' },
      'shipped': { text: '待收货', color: 'shipping' },
      'completed': { text: '已完成', color: 'completed' },
      'cancelled': { text: '已取消', color: 'cancelled' }
    };

    const statusInfo = statusMap[orderData.status] || { text: '未知状态', color: 'pending' };

    return {
      id: orderData._id,
      orderNo: orderData.orderNo,
      status: orderData.status,
      statusText: statusInfo.text,
      createTime: this.formatTime(orderData.createTime),
      totalAmount: Math.round(orderData.totalAmount),
      goods: orderData.products.map(product => ({
        id: product.productId,
        name: `${product.ageRange}${product.condition}${product.count}本装绘本盲盒`,
        age: product.ageRange,
        condition: product.condition,
        count: product.count,
        price: Math.round(product.price),
        quantity: product.quantity,
        averagePrice: Math.round(product.price / parseInt(product.count))
      }))
    };
  },

  /**
   * 格式化时间
   */
  formatTime(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  /**
   * 返回按钮点击
   */
  onBackTap() {
    wx.navigateBack();
  },

  /**
   * 标签页切换
   */
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab,
      page: 1,
      hasMore: true
    });
    this.loadOrderData();
  },

  /**
   * 查看订单详情
   */
  onOrderDetail(e) {
    const order = e.currentTarget.dataset.order;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderId=${order.id}`
    });
  },

  /**
   * 再次购买
   */
  onBuyAgain(e) {
    const order = e.currentTarget.dataset.order;
    // TODO: 实现再次购买逻辑
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  /**
   * 确认收货
   */
  onConfirmReceive(e) {
    const order = e.currentTarget.dataset.order;
    wx.showModal({
      title: '确认收货',
      content: '确认已收到商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'order',
              data: {
                action: 'confirmReceive',
                orderId: order.id
              }
            });

            if (result.result && result.result.success) {
              wx.showToast({
                title: '确认收货成功',
                icon: 'success'
              });
              this.loadOrderData();
            } else {
              wx.showToast({
                title: result.result?.message || '确认收货失败',
                icon: 'none'
              });
            }
          } catch (error) {
            console.error('确认收货失败:', error);
            wx.showToast({
              title: '操作失败，请重试',
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
  onCancelOrder(e) {
    const order = e.currentTarget.dataset.order;
    wx.showModal({
      title: '取消订单',
      content: '确定要取消这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'order',
              data: {
                action: 'cancelOrder',
                orderId: order.id
              }
            });

            if (result.result && result.result.success) {
              wx.showToast({
                title: '订单已取消',
                icon: 'success'
              });
              this.loadOrderData();
            } else {
              wx.showToast({
                title: result.result?.message || '取消订单失败',
                icon: 'none'
              });
            }
          } catch (error) {
            console.error('取消订单失败:', error);
            wx.showToast({
              title: '操作失败，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  /**
   * 去首页
   */
  onGoToHome() {
    wx.switchTab({
      url: '/pages/home/home'
    });
  }
}) 