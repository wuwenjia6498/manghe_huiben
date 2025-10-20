Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 当前选中的标签页
    currentTab: 'orders',
    
    // 统计数据
    statistics: {
      total: 0,        // 总订单
      unpaid: 0,       // 待支付（pending状态）
      pending: 0,      // 待发货（paid状态）
      shipped: 0,      // 已发货
      completed: 0,    // 已完成
      cancelled: 0     // 已取消
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

    // 订单列表 - 移除模拟数据
    orders: [],
    
    // 筛选后的订单列表
    filteredOrders: [],
    
    // 加载状态
    loading: true,
    
    // 分页信息
    page: 1,
    pageSize: 100,  // 增加到100，适合管理端使用
    hasMore: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('订单管理页面加载', options);
    
    // 从URL参数获取筛选条件
    if (options.filter) {
      this.setData({
        currentFilter: options.filter
      });
      console.log('自动筛选:', options.filter);
    }
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
  async loadOrders() {
    this.setData({
      loading: true
    });

    try {
      console.log('开始加载管理端订单数据...');

      const res = await wx.cloud.callFunction({
        name: 'admin',
        data: {
          action: 'getOrders',
          page: this.data.page,
          pageSize: this.data.pageSize
        }
      });

      console.log('云函数返回结果:', res);

      if (res.result && res.result.success) {
        const orderData = res.result.data || {};
        const orders = orderData.list || [];
        
        console.log('🔍 获取到订单数据:', orders.length, '个订单');
        
        // 打印原始订单状态分布
        const rawStatusCount = {};
        orders.forEach(order => {
          rawStatusCount[order.status] = (rawStatusCount[order.status] || 0) + 1;
        });
        console.log('🔍 原始订单状态分布:', rawStatusCount);

        // 转换订单数据格式，并过滤掉无效订单
        const validOrders = orders.filter(order => this.isValidOrder(order));
        const invalidOrders = orders.filter(order => !this.isValidOrder(order));
        
        console.log('✅ 有效订单数量:', validOrders.length, '个');
        if (invalidOrders.length > 0) {
          console.warn('❌ 被过滤的订单数量:', invalidOrders.length, '个');
          console.warn('❌ 被过滤的订单:', invalidOrders);
        }
        
        const formattedOrders = validOrders.map(order => this.formatOrderForAdmin(order));

        this.setData({
          orders: formattedOrders,
          loading: false,
          hasMore: orders.length >= this.data.pageSize
        });

        this.filterOrders();
        this.updateStatistics();
      } else {
        console.error('获取订单失败:', res.result && res.result.message);
        wx.showToast({
          title: (res.result && res.result.message) || '订单加载失败',
          icon: 'none'
        });
        
        // 设置空数据
        this.setData({
          orders: [],
          loading: false
        });
        this.filterOrders();
        this.updateStatistics();
      }

    } catch (error) {
      console.error('加载订单数据出错:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
      
      // 设置空数据
      this.setData({
        orders: [],
        loading: false
      });
      this.filterOrders();
      this.updateStatistics();
    }
  },

  /**
   * 验证订单数据是否有效
   */
  isValidOrder(order) {
    // 检查必要字段
    if (!order || !order._id || !order.orderNo) {
      console.warn('订单数据缺少必要字段:', order);
      return false;
    }
    
    // 检查状态字段
    if (!order.status) {
      console.warn('订单缺少状态字段:', order.orderNo);
      return false;
    }
    
    // 检查是否有地址信息（至少要有地址对象）
    if (!order.address || typeof order.address !== 'object') {
      console.warn('订单缺少地址信息:', order.orderNo);
      return false;
    }
    
    // 检查金额字段
    if (order.totalAmount === undefined || order.totalAmount === null) {
      console.warn('订单缺少金额信息:', order.orderNo);
      return false;
    }
    
    return true;
  },

  /**
   * 格式化订单数据用于管理端显示
   */
  formatOrderForAdmin(order) {
    // 状态映射
    const statusMap = {
      'pending': '待支付',   // 修正：pending是待支付状态
      'paid': '待发货',      // paid才是待发货状态
      'shipped': '已发货',
      'completed': '已完成',
      'cancelled': '已取消'
    };

    // 提取主要商品信息用于显示（添加安全检查）
    const products = order.products || [];
    const mainProduct = products.length > 0 ? products[0] : null;
    
    return {
      id: order._id,
      orderNo: order.orderNo,
      customerName: (order.address && order.address.name) || '未知用户',
      phone: (order.address && order.address.phone) || '未知号码',
      address: (order.address && order.address.detail) || '未知地址',
      status: order.status,
      statusText: statusMap[order.status] || '未知状态',
      createTime: this.formatTime(order.createTime),
      totalAmount: order.totalAmount,
      paymentMethod: '微信支付',
      ageGroup: (mainProduct && mainProduct.ageRange) || '未知',
      condition: (mainProduct && mainProduct.condition) || '未知',
      bookCount: (mainProduct && mainProduct.count) || 0,
      quantity: products.reduce((sum, p) => sum + (p.quantity || 0), 0),
      selected: false,
      trackingNumber: order.trackingNo || '',
      shippingStatus: order.shippingStatus || ''
    };
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
   * 更新统计数据
   */
  updateStatistics() {
    const orders = this.data.orders;
    
    // 调试日志：查看订单状态分布
    const statusCount = {};
    orders.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });
    console.log('=== 订单状态统计 ===');
    console.log('📦 总订单数:', orders.length);
    console.log('📊 各状态分布:', statusCount);
    
    const statistics = {
      total: orders.length,
      unpaid: orders.filter(order => order.status === 'pending').length,    // 待支付
      pending: orders.filter(order => order.status === 'paid').length,      // 待发货
      shipped: orders.filter(order => order.status === 'shipped').length,   // 已发货
      completed: orders.filter(order => order.status === 'completed').length, // 已完成
      cancelled: orders.filter(order => order.status === 'cancelled').length  // 已取消
    };
    
    console.log('📋 统计结果:', statistics);
    console.log('==================');

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
    } else if (currentFilter === 'pending') {
      // 待支付：只包括 pending 状态
      filteredOrders = orders.filter(order => order.status === 'pending');
    } else if (currentFilter === 'paid') {
      // 待发货：只包括 paid 状态
      filteredOrders = orders.filter(order => order.status === 'paid');
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
    
    const updatedOrders = filteredOrders.map(order => Object.assign({}, order, {
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
        return Object.assign({}, order, { selected: !order.selected });
      }
      return order;
    });

    const updatedFilteredOrders = filteredOrders.map(order => {
      if (order.id === orderId) {
        return Object.assign({}, order, { selected: !order.selected });
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

    // 筛选出可发货的订单（只有 paid 状态可以发货）
    const selectedOrders = filteredOrders.filter(order => 
      order.selected && order.status === 'paid'
    );
    
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
  async doBatchShip(selectedOrders) {
    wx.showLoading({
      title: '批量发货中...',
      mask: true
    });

    try {
      let successCount = 0;
      let failCount = 0;

      // 逐个调用云函数更新订单状态
      for (let i = 0; i < selectedOrders.length; i++) {
        const order = selectedOrders[i];
        try {
          const trackingNumber = 'SF' + Date.now() + Math.floor(Math.random() * 1000);
          
          const res = await wx.cloud.callFunction({
            name: 'admin',
            data: {
              action: 'updateOrderStatus',
              orderId: order.id,
              status: 'shipped',
              trackingNumber: trackingNumber
            }
          });

          if (res.result && res.result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error('批量发货单个订单失败:', order.orderNo, error);
          failCount++;
        }
      }

      wx.hideLoading();

      if (successCount > 0) {
        // 更新本地数据
        const orders = this.data.orders.map(order => {
          const shipped = selectedOrders.find(item => item.id === order.id);
          if (shipped) {
            return Object.assign({}, order, {
              status: 'shipped',
              statusText: '已发货',
              selected: false,
              shippingStatus: '已从仓库发出',
              trackingNumber: 'SF' + Date.now()
            });
          }
          return Object.assign({}, order, { selected: false });
        });

        this.setData({
          orders: orders,
          selectAll: false,
          selectedCount: 0
        });

        this.filterOrders();
        this.updateStatistics();

        if (failCount === 0) {
          wx.showToast({
            title: `已成功发货 ${successCount} 个订单`,
            icon: 'success'
          });
        } else {
          wx.showModal({
            title: '批量发货完成',
            content: `成功: ${successCount}个\n失败: ${failCount}个`,
            showCancel: false
          });
        }
      } else {
        wx.showToast({
          title: '批量发货失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('批量发货失败:', error);
      wx.showToast({
        title: '批量发货失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 发货
   */
  onShipOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    const order = this.data.orders.find(item => item.id === orderId);

    // 只有 paid 状态的订单可以发货
    if (!order || order.status !== 'paid') {
      wx.showToast({
        title: order.status === 'pending' ? '订单未支付，无法发货' : '订单状态异常',
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
  async doShipOrder(orderId) {
    wx.showLoading({
      title: '发货中...',
      mask: true
    });

    try {
      // 生成快递单号（示例格式）
      const trackingNumber = 'SF' + Date.now();

      // 调用云函数更新数据库
      const res = await wx.cloud.callFunction({
        name: 'admin',
        data: {
          action: 'updateOrderStatus',
          orderId: orderId,
          status: 'shipped',
          trackingNumber: trackingNumber
        }
      });

      wx.hideLoading();

      if (res.result && res.result.success) {
        // 更新本地数据
        const orders = this.data.orders.map(order => {
          if (order.id === orderId) {
            return Object.assign({}, order, {
              status: 'shipped',
              statusText: '已发货',
              shippingStatus: '已从仓库发出',
              trackingNumber: trackingNumber
            });
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
      } else {
        wx.showToast({
          title: res.result?.message || '发货失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('发货失败:', error);
      wx.showToast({
        title: '发货失败，请重试',
        icon: 'none'
      });
    }
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
      url: `/pages/order-detail/order-detail?orderId=${orderId}`
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

    // 状态选项（包含待支付）
    const statusOptions = [
      { value: 'pending', text: '待支付' },  // 待支付状态
      { value: 'paid', text: '待发货' },     // 待发货状态
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
  async updateOrderStatus(orderId, status, statusText) {
    // 显示加载提示
    wx.showLoading({
      title: '更新中...',
      mask: true
    });

    try {
      // 调用云函数更新数据库
      const res = await wx.cloud.callFunction({
        name: 'admin',
        data: {
          action: 'updateOrderStatus',
          orderId: orderId,
          status: status
        }
      });

      wx.hideLoading();

      if (res.result && res.result.success) {
        // 更新成功后，更新本地数据
        const orders = this.data.orders.map(order => {
          if (order.id === orderId) {
            return Object.assign({}, order, {
              status: status,
              statusText: statusText
            });
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
      } else {
        wx.showToast({
          title: res.result?.message || '更新失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('更新订单状态失败:', error);
      wx.showToast({
        title: '更新失败，请重试',
        icon: 'none'
      });
    }
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