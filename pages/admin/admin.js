// pages/admin/admin.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 当前选中的标签页
    currentTab: 'home',
    
    stats: {
      todaySales: '1,345',
      salesGrowth: '12.5',
      todayOrders: 37,
      ordersGrowth: '8.3',
      newUsers: 12,
      usersChange: '3.2',
      pendingOrders: 8,
      pendingShipment: 8,
      lowInventory: 2
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取系统信息，设置状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 20;
    wx.setStorageSync('statusBarHeight', statusBarHeight);
    
    // 检查管理员权限
    this.checkAdminPermission();
    
    // 加载统计数据
    this.loadStats();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    wx.setNavigationBarTitle({
      title: '数据看板'
    });
    
    // 绘制图表
    setTimeout(() => {
      this.drawPieChart();
    }, 500);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadStats();
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
    this.loadStats();
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
      title: '绘本盲盒管理后台',
      path: '/pages/admin/admin'
    };
  },

  /**
   * 检查管理员权限
   */
  checkAdminPermission() {
    const adminFlag = wx.getStorageSync('adminAccess');
    if (!adminFlag) {
      wx.showModal({
        title: '权限不足',
        content: '您没有访问管理后台的权限',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
      return false;
    }
    return true;
  },

  /**
   * 加载统计数据
   */
  loadStats() {
    // 模拟数据，实际项目中从服务器获取
    const stats = {
      todaySales: '1,345',
      salesGrowth: '12.5',
      todayOrders: 37,
      ordersGrowth: '8.3',
      newUsers: 12,
      usersChange: '3.2',
      pendingOrders: 8,
      pendingShipment: 8,
      lowInventory: 2
    };
    
    this.setData({
      stats
    });
  },

  /**
   * 绘制饼图
   */
  drawPieChart() {
    const ctx = wx.createCanvasContext('pieChart', this);
    const radius = 120;
    const centerX = 150;
    const centerY = 150;
    
    const data = [
      { value: 35, color: '#22d3ee', label: '3-6岁九成新' },
      { value: 25, color: '#fb923c', label: '0-3岁全新' },
      { value: 30, color: '#ef4444', label: '6岁以上七成新' },
      { value: 10, color: '#d1d5db', label: '其他' }
    ];
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -Math.PI / 2; // 从12点钟位置开始
    
    // 绘制饼图
    data.forEach(item => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.setFillStyle(item.color);
      ctx.fill();
      
      currentAngle += sliceAngle;
    });
    
    // 绘制中心圆
    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI);
    ctx.setFillStyle('#ffffff');
    ctx.fill();
    
    ctx.draw();
  },

  /**
   * 回退按钮点击
   */
  onBackTap() {
    console.log('回退按钮被点击');
    
    // 显示点击反馈
    wx.showToast({
      title: '正在返回...',
      icon: 'loading',
      duration: 1000
    });
    
    // 尝试返回上一页
    const pages = getCurrentPages();
    console.log('当前页面栈长度:', pages.length);
    
    if (pages.length > 1) {
      // 如果页面栈中有上一页，正常返回
      wx.navigateBack({
        success: () => {
          console.log('返回成功');
        },
        fail: (error) => {
          console.error('返回失败:', error);
          // 返回失败时跳转到首页
          wx.switchTab({
            url: '/pages/home/home'
          });
        }
      });
    } else {
      // 如果没有上一页，直接跳转到首页
      console.log('没有上一页，跳转到首页');
      wx.switchTab({
        url: '/pages/home/home'
      });
    }
  },

  /**
   * 待发货订单点击
   */
  onPendingOrdersTap() {
    wx.showToast({
      title: '订单管理功能开发中',
      icon: 'none'
    });
  },

  /**
   * 库存预警点击
   */
  onInventoryWarningTap() {
    wx.showToast({
      title: '库存管理功能开发中',
      icon: 'none'
    });
  },

  /**
   * 全部订单查看
   */
  onAllOrdersTap() {
    wx.navigateTo({
      url: '/pages/admin-orders/admin-orders'
    });
  },

  /**
   * 商品管理
   */
  onProductManageTap() {
    wx.navigateTo({
      url: '/pages/admin-products/admin-products'
    });
  },

  /**
   * 销售分析
   */
  onSalesAnalyticsTap() {
    wx.showToast({
      title: '销售分析功能开发中',
      icon: 'none'
    });
  },

  /**
   * 用户分析
   */
  onUserAnalyticsTap() {
    wx.showToast({
      title: '用户分析功能开发中',
      icon: 'none'
    });
  },

  /**
   * 应用配置
   */
  onAppConfigTap() {
    wx.showToast({
      title: '应用配置功能开发中',
      icon: 'none'
    });
  },

  /**
   * 退出登录
   */
  onLogoutTap() {
    wx.showModal({
      title: '退出确认',
      content: '确定要退出管理后台吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除管理员标记
          wx.removeStorageSync('adminAccess');
          
          // 返回用户端
          wx.switchTab({
            url: '/pages/home/home',
            success: () => {
              wx.showToast({
                title: '已退出管理后台',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  },

  /**
   * 订单管理
   */
  onOrderManageTap() {
    wx.showToast({
      title: '订单管理功能开发中',
      icon: 'none'
    });
  },

  /**
   * 库存管理
   */
  onInventoryManageTap() {
    wx.showToast({
      title: '库存管理功能开发中',
      icon: 'none'
    });
  },

  /**
   * 导出数据
   */
  onExportDataTap() {
    wx.showLoading({
      title: '正在导出...'
    });
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '数据导出成功',
        icon: 'success'
      });
    }, 2000);
  },

  /**
   * 数据备份
   */
  onBackupDataTap() {
    wx.showModal({
      title: '数据备份',
      content: '确定要备份当前数据吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '正在备份...'
          });
          
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
              title: '数据备份成功',
              icon: 'success'
            });
          }, 1500);
        }
      }
    });
  },

  /**
   * 底部导航切换
   */
  onTabSwitch(e) {
    console.log('首页底部导航被点击', e.currentTarget.dataset);
    const tab = e.currentTarget.dataset.tab;
    
    console.log('当前点击的tab:', tab);
    
    // 如果点击的是当前页面，不做处理
    if (tab === 'home') {
      console.log('当前已在首页，不跳转');
      return;
    }

    // 根据选择的tab跳转到对应页面
    const tabRoutes = {
      'products': '/pages/admin-products/admin-products',
      'orders': '/pages/admin-orders/admin-orders', 
      'users': '/pages/admin-users/admin-users',
      'settings': '/pages/admin-settings/admin-settings'
    };

    if (tabRoutes[tab]) {
      console.log('准备跳转到:', tabRoutes[tab]);
      wx.redirectTo({
        url: tabRoutes[tab]
      });
    } else {
      console.log('未找到对应的路由');
    }
  }
}); 