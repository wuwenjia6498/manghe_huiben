Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 当前选中的标签页
    currentTab: 'orders',
    
    // 统计数据
    statistics: {
      total: 50,        // 总订单
      pending: 16,      // 待发货
      shipped: 24,      // 已发货
      completed: 8,     // 已完成
      cancelled: 2      // 已取消
    },

    // 当前筛选条件
    currentFilter: 'all',
    
    // 批量操作相关
    selectAll: false,
    selectedCount: 0,
    
    // 搜索相关
    showSearch: false,
    searchKeyword: '',
    searchFocus: false,

    // 订单列表
    orders: [
      {
        id: '2024123001',
        orderNo: '2024123001',
        customerName: '李小明',
        phone: '138****5678',
        address: '北京市朝阳区某街道某小区xxx号楼xxx单元',
        status: 'pending',
        statusText: '待发货',
        createTime: '2024-12-23 14:32',
        totalAmount: 48.0,
        paymentMethod: '微信支付',
        ageGroup: '3-6岁',
        condition: '九成新',
        bookCount: 20,
        quantity: 1,
        selected: false
      },
      {
        id: '2024122089',
        orderNo: '2024122089',
        customerName: '王小红',
        phone: 'SF1234567890',
        address: '上海市浦东新区某路某号',
        status: 'shipped',
        statusText: '已发货',
        createTime: '2024-12-22 16:45',
        totalAmount: 30.0,
        paymentMethod: '支付宝',
        ageGroup: '0-3岁',
        condition: '全新',
        bookCount: 10,
        quantity: 1,
        shippingStatus: '已从北京分拣中心发出，预计明日到达',
        trackingNumber: 'SF1234567890',
        selected: false
      },
      {
        id: '2024121055',
        orderNo: '2024121055',
        customerName: '张三丰',
        phone: '138****5678',
        address: '广州市天河区某大厦',
        status: 'completed',
        statusText: '已完成',
        createTime: '2024-12-21 10:30',
        totalAmount: 64.8,
        paymentMethod: '微信支付',
        ageGroup: '6岁以上',
        condition: '七成新',
        bookCount: 30,
        quantity: 1,
        selected: false
      },
      {
        id: '2024122001',
        orderNo: '2024122001',
        customerName: '刘晓华',
        phone: '139****8765',
        address: '深圳市南山区科技园某路666号',
        status: 'paid',
        statusText: '已付款',
        createTime: '2024-12-20 09:15',
        totalAmount: 52.5,
        paymentMethod: '微信支付',
        ageGroup: '3-6岁',
        condition: '八成新',
        bookCount: 25,
        quantity: 1,
        selected: false
      },
      {
        id: '2024121588',
        orderNo: '2024121588',
        customerName: '陈美丽',
        phone: '137****4321',
        address: '杭州市西湖区某街道123号',
        status: 'cancelled',
        statusText: '已取消',
        createTime: '2024-12-15 20:45',
        totalAmount: 0,
        paymentMethod: '支付宝',
        ageGroup: '0-3岁',
        condition: '全新',
        bookCount: 15,
        quantity: 1,
        selected: false
      },
      {
        id: '2024122456',
        orderNo: '2024122456',
        customerName: '赵大明',
        phone: '186****9999',
        address: '成都市锦江区某商城B座',
        status: 'pending',
        statusText: '待发货',
        createTime: '2024-12-24 11:20',
        totalAmount: 39.9,
        paymentMethod: '微信支付',
        ageGroup: '6岁以上',
        condition: '九成新',
        bookCount: 18,
        quantity: 1,
        selected: false
      }
    ],

    // 筛选后的订单列表
    filteredOrders: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.filterOrders();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    wx.setNavigationBarTitle({
      title: '订单管理'
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadOrders();
    this.updateStatistics();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadOrders();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 加载更多订单数据
    console.log('加载更多订单数据');
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '绘本订单管理',
      path: '/pages/admin-orders/admin-orders'
    };
  },

  /**
   * 加载订单数据
   */
  loadOrders() {
    // 这里可以调用API获取订单数据
    // 目前使用模拟数据
    this.setData({
      orders: this.data.orders
    });
    this.filterOrders();
  },

  /**
   * 更新统计数据
   */
  updateStatistics() {
    const orders = this.data.orders;
    const statistics = {
      total: orders.length,
      pending: orders.filter(order => order.status === 'pending').length,
      shipped: orders.filter(order => order.status === 'shipped').length,
      completed: orders.filter(order => order.status === 'completed').length,
      cancelled: orders.filter(order => order.status === 'cancelled').length
    };

    this.setData({
      statistics: statistics
    });
  },

  /**
   * 筛选订单列表
   */
  filterOrders() {
    const { orders, currentFilter, searchKeyword } = this.data;
    let filteredOrders = [];

    // 先按状态筛选
    if (currentFilter === 'all') {
      filteredOrders = orders;
    } else {
      filteredOrders = orders.filter(order => order.status === currentFilter);
    }

    // 再按搜索关键词筛选
    if (searchKeyword.trim()) {
      filteredOrders = filteredOrders.filter(order => {
        const keyword = searchKeyword.toLowerCase();
        return order.orderNo.toLowerCase().includes(keyword) ||
               order.customerName.toLowerCase().includes(keyword);
      });
    }

    this.setData({
      filteredOrders: filteredOrders
    });
  },

  /**
   * 筛选条件改变
   */
  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      currentFilter: filter
    });
    this.filterOrders();
  },

  /**
   * 点击搜索图标
   */
  onSearchTap() {
    this.setData({
      showSearch: true,
      searchFocus: true
    });
  },

  /**
   * 点击导出图标
   */
  onExportTap() {
    const { filteredOrders } = this.data;
    
    if (filteredOrders.length === 0) {
      wx.showToast({
        title: '没有可导出的订单',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '导出订单',
      content: `确定要导出 ${filteredOrders.length} 个订单的数据吗？`,
      success: (res) => {
        if (res.confirm) {
          this.exportOrders(filteredOrders);
        }
      }
    });
  },

  /**
   * 导出订单数据
   */
  exportOrders(orders) {
    // 这里可以实现实际的导出逻辑
    // 比如生成CSV文件或调用导出API
    console.log('导出订单数据：', orders);
    
    wx.showToast({
      title: `已导出 ${orders.length} 个订单`,
      icon: 'success'
    });
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
    this.filterOrders();
  },

  /**
   * 搜索确认
   */
  onSearchConfirm(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
    this.filterOrders();
  },

  /**
   * 清除搜索
   */
  onClearSearch() {
    this.setData({
      searchKeyword: ''
    });
    this.filterOrders();
  },

  /**
   * 取消搜索
   */
  onCancelSearch() {
    this.setData({
      showSearch: false,
      searchKeyword: '',
      searchFocus: false
    });
    this.filterOrders();
  },

  /**
   * 全选/取消全选
   */
  onSelectAll() {
    const { selectAll, filteredOrders } = this.data;
    const newSelectAll = !selectAll;
    
    const updatedOrders = filteredOrders.map(order => ({
      ...order,
      selected: newSelectAll
    }));

    // 更新原始orders数组中对应的订单
    const orders = this.data.orders.map(order => {
      const updatedOrder = updatedOrders.find(item => item.id === order.id);
      return updatedOrder || order;
    });

    this.setData({
      selectAll: newSelectAll,
      selectedCount: newSelectAll ? filteredOrders.length : 0,
      orders: orders,
      filteredOrders: updatedOrders
    });
  },

  /**
   * 选择单个订单
   */
  onSelectOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    const { orders, filteredOrders } = this.data;

    // 更新选中状态
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        return { ...order, selected: !order.selected };
      }
      return order;
    });

    const updatedFilteredOrders = filteredOrders.map(order => {
      if (order.id === orderId) {
        return { ...order, selected: !order.selected };
      }
      return order;
    });

    // 计算选中数量
    const selectedCount = updatedFilteredOrders.filter(order => order.selected).length;
    const selectAll = selectedCount === filteredOrders.length;

    this.setData({
      orders: updatedOrders,
      filteredOrders: updatedFilteredOrders,
      selectedCount: selectedCount,
      selectAll: selectAll
    });
  },

  /**
   * 批量发货
   */
  onBatchShip() {
    const { selectedCount, filteredOrders } = this.data;
    
    if (selectedCount === 0) {
      wx.showToast({
        title: '请选择要发货的订单',
        icon: 'none'
      });
      return;
    }

    const selectedOrders = filteredOrders.filter(order => order.selected && order.status === 'pending');
    
    if (selectedOrders.length === 0) {
      wx.showToast({
        title: '所选订单中没有可发货的订单',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '批量发货',
      content: `确定要发货 ${selectedOrders.length} 个订单吗？`,
      success: (res) => {
        if (res.confirm) {
          // 执行批量发货逻辑
          this.doBatchShip(selectedOrders);
        }
      }
    });
  },

  /**
   * 执行批量发货
   */
  doBatchShip(selectedOrders) {
    // 这里调用API执行批量发货
    console.log('批量发货订单：', selectedOrders);
    
    wx.showToast({
      title: `已发货 ${selectedOrders.length} 个订单`,
      icon: 'success'
    });

    // 更新订单状态
    const orders = this.data.orders.map(order => {
      if (selectedOrders.find(item => item.id === order.id)) {
        return {
          ...order,
          status: 'shipped',
          statusText: '已发货',
          selected: false,
          shippingStatus: '已从仓库发出',
          trackingNumber: 'SF' + Date.now()
        };
      }
      return { ...order, selected: false };
    });

    this.setData({
      orders: orders,
      selectAll: false,
      selectedCount: 0
    });

    this.filterOrders();
    this.updateStatistics();
  },

  /**
   * 发货
   */
  onShipOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    const order = this.data.orders.find(item => item.id === orderId);

    if (!order || order.status !== 'pending') {
      wx.showToast({
        title: '订单状态异常',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认发货',
      content: `确定要发货订单 ${order.orderNo} 吗？`,
      success: (res) => {
        if (res.confirm) {
          // 调用发货API
          this.doShipOrder(orderId);
        }
      }
    });
  },

  /**
   * 执行发货
   */
  doShipOrder(orderId) {
    const orders = this.data.orders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'shipped',
          statusText: '已发货',
          shippingStatus: '已从仓库发出',
          trackingNumber: 'SF' + Date.now()
        };
      }
      return order;
    });

    this.setData({
      orders: orders
    });

    this.filterOrders();
    this.updateStatistics();

    wx.showToast({
      title: '发货成功',
      icon: 'success'
    });
  },

  /**
   * 跟踪物流
   */
  onTrackShipping(e) {
    const orderId = e.currentTarget.dataset.id;
    const order = this.data.orders.find(item => item.id === orderId);
    
    wx.showModal({
      title: '物流信息',
      content: `运单号：${order.trackingNumber}\n${order.shippingStatus}`,
      showCancel: false
    });
  },

  /**
   * 查看详情
   */
  onViewDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    });
  },

  /**
   * 查看评价
   */
  onReview(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showToast({
      title: '查看评价功能开发中',
      icon: 'none'
    });
  },

  /**
   * 编辑订单状态
   */
  onEditStatus(e) {
    const orderId = e.currentTarget.dataset.id;
    const order = this.data.orders.find(item => item.id === orderId);
    
    if (!order) return;

    const statusOptions = [
      { value: 'pending', text: '待发货' },
      { value: 'paid', text: '已付款' },
      { value: 'shipped', text: '已发货' },
      { value: 'completed', text: '已完成' },
      { value: 'cancelled', text: '已取消' }
    ];

    wx.showActionSheet({
      itemList: statusOptions.map(item => item.text),
      success: (res) => {
        if (res.tapIndex < statusOptions.length) {
          const selectedStatus = statusOptions[res.tapIndex];
          this.updateOrderStatus(orderId, selectedStatus.value, selectedStatus.text);
        }
      }
    });
  },

  /**
   * 更新订单状态
   */
  updateOrderStatus(orderId, status, statusText) {
    const orders = this.data.orders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: status,
          statusText: statusText
        };
      }
      return order;
    });

    this.setData({
      orders: orders
    });

    // 重新筛选订单
    this.filterOrders();
    // 更新统计数据
    this.updateStatistics();

    wx.showToast({
      title: '状态已更新',
      icon: 'success'
    });

    // 这里可以调用API更新服务器数据
    // this.updateOrderStatusToServer(orderId, status);
  },

  /**
   * 底部导航切换
   */
  onTabSwitch(e) {
    const tab = e.currentTarget.dataset.tab;
    
    const tabPages = {
      'home': '/pages/admin/admin',
      'products': '/pages/admin-products/admin-products',
      'orders': '/pages/admin-orders/admin-orders',
      'users': '/pages/admin-users/admin-users',
      'settings': '/pages/admin-settings/admin-settings'
    };

    if (tabPages[tab] && tab !== 'orders') {
      wx.redirectTo({
        url: tabPages[tab]
      });
    }
  }
}); 