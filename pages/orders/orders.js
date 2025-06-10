Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 'all', // 当前选中的标签页
    orderList: [], // 订单列表
    allOrders: [] // 所有订单数据（用于筛选）
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
    this.loadOrderData();
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
      title: '绘本盲盒订单 - 精选优质绘本',
      path: '/pages/home/home'
    };
  },

  /**
   * 加载订单数据
   */
  loadOrderData() {
    // 模拟订单数据
    const mockOrders = [
      {
        id: 1,
        orderNo: '202501010001',
        status: 'shipping',
        statusText: '待收货',
        createTime: '2025-01-01 14:30',
        totalAmount: 29.00,
        goods: [
          {
            id: 1,
            name: '3-6岁绘本盲盒·九成新',
            age: '3-6岁',
            condition: '九成新',
            count: 30,
            price: 54,
            quantity: 1,
            coverUrl: 'https://picsum.photos/200/150?random=1',
            averagePrice: '1.8'
          }
        ]
      },
      {
        id: 2,
        orderNo: '202412280002',
        status: 'completed',
        statusText: '已完成',
        createTime: '2024-12-28 16:45',
        totalAmount: 75.00,
        goods: [
          {
            id: 2,
            name: '0-3岁绘本盲盒·七成新',
            age: '0-3岁',
            condition: '七成新',
            count: 20,
            price: 30,
            quantity: 2,
            coverUrl: 'https://picsum.photos/200/150?random=2',
            averagePrice: '1.5'
          },
          {
            id: 3,
            name: '6岁以上绘本盲盒·九成新',
            age: '6岁以上',
            condition: '九成新',
            count: 20,
            price: 45,
            quantity: 1,
            coverUrl: 'https://picsum.photos/200/150?random=3',
            averagePrice: '2.25'
          }
        ]
      },
      {
        id: 3,
        orderNo: '202412250003',
        status: 'pending',
        statusText: '待发货',
        createTime: '2024-12-25 09:15',
        totalAmount: 54.00,
        goods: [
          {
            id: 4,
            name: '3-6岁绘本盲盒·全新',
            age: '3-6岁',
            condition: '全新',
            count: 10,
            price: 54,
            quantity: 1,
            coverUrl: 'https://picsum.photos/200/150?random=4',
            averagePrice: '5.4'
          }
        ]
      }
    ];

    this.setData({
      allOrders: mockOrders
    });

    this.filterOrders();
  },

  /**
   * 根据当前选中的标签筛选订单
   */
  filterOrders() {
    const { currentTab, allOrders } = this.data;
    let filteredOrders = allOrders;

    if (currentTab !== 'all') {
      filteredOrders = allOrders.filter(order => order.status === currentTab);
    }

    this.setData({
      orderList: filteredOrders
    });
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
      currentTab: tab
    });
    this.filterOrders();
  },

  /**
   * 查看订单详情
   */
  onOrderDetail(e) {
    const order = e.currentTarget.dataset.order;
    // 将订单数据转为JSON字符串并编码
    const orderData = encodeURIComponent(JSON.stringify(order));
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderData=${orderData}`
    });
  },

  /**
   * 再次购买
   */
  onBuyAgain(e) {
    const order = e.currentTarget.dataset.order;
    
    // 将订单商品加入购物车
    let cart = wx.getStorageSync('cart') || [];
    
    order.goods.forEach(goods => {
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
  onConfirmReceive(e) {
    const order = e.currentTarget.dataset.order;
    
    wx.showModal({
      title: '确认收货',
      content: '确认已收到商品吗？确认后订单将完成。',
      success: (res) => {
        if (res.confirm) {
          // 更新订单状态
          const { allOrders } = this.data;
          const orderIndex = allOrders.findIndex(item => item.id === order.id);
          if (orderIndex >= 0) {
            allOrders[orderIndex].status = 'completed';
            allOrders[orderIndex].statusText = '已完成';
            
            this.setData({
              allOrders
            });
            this.filterOrders();
          }
          
          wx.showToast({
            title: '收货成功',
            icon: 'success'
          });
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
      success: (res) => {
        if (res.confirm) {
          // 从订单列表中移除
          const { allOrders } = this.data;
          const filteredOrders = allOrders.filter(item => item.id !== order.id);
          
          this.setData({
            allOrders: filteredOrders
          });
          this.filterOrders();
          
          wx.showToast({
            title: '订单已取消',
            icon: 'success'
          });
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