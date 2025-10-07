// pages/admin-users/admin-users.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 'users',
    
    // 搜索相关
    showSearch: false,
    searchKeyword: '',
    
    // 筛选相关
    currentFilter: 'all',
    
    // 状态修改
    showStatusSheet: false,
    currentUser: null,
    
    // 用户列表数据 - 改为从数据库获取
    users: [],
    allUsers: [], // 用于搜索和筛选
    
    // 加载状态
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('🚀 用户管理页面加载');
    
    // 首先验证管理员身份
    this.checkAdminStatus();
  },

  /**
   * 验证管理员身份
   */
  checkAdminStatus: function() {
    console.log('🔐 验证管理员身份...');
    
    wx.cloud.callFunction({
      name: 'auth',
      data: {
        action: 'checkAdmin'
      }
    }).then(res => {
      console.log('👑 管理员身份验证结果:', res.result);
      
      if (res.result && res.result.success && res.result.data.isAdmin) {
        console.log('✅ 管理员身份验证通过');
        // 验证通过，加载用户数据
        this.loadUsers();
      } else {
        console.log('❌ 非管理员身份');
        wx.showToast({
          title: '需要管理员权限',
          icon: 'none'
        });
        // 可以跳转回首页或登录页
        setTimeout(() => {
          wx.navigateBack();
        }, 2000);
      }
    }).catch(err => {
      console.error('❌ 验证管理员身份失败:', err);
      wx.showToast({
        title: '验证失败，请重试',
        icon: 'none'
      });
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    wx.setNavigationBarTitle({
      title: '用户管理'
    });
  },

  /**
   * 搜索相关方法
   */
  onToggleSearch() {
    this.setData({
      showSearch: !this.data.showSearch,
      searchKeyword: '',
    }, () => {
      this.filterUsers();
    });
  },

  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    }, () => {
      this.filterUsers();
    });
  },

  onSearchConfirm() {
    this.filterUsers();
  },

  onClearSearch() {
    this.setData({
      searchKeyword: ''
    }, () => {
      this.filterUsers();
    });
  },

  onCancelSearch() {
    this.setData({
      showSearch: false,
      searchKeyword: ''
    }, () => {
      this.filterUsers();
    });
  },

  /**
   * 筛选相关方法
   */
  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      currentFilter: filter
    }, () => {
      this.filterUsers();
    });
  },

  /**
   * 筛选用户列表
   */
  filterUsers() {
    const { allUsers, currentFilter, searchKeyword } = this.data;
    let filteredUsers = [];

    // 先按状态筛选
    if (currentFilter === 'all') {
      filteredUsers = allUsers;
    } else {
      filteredUsers = allUsers.filter(user => user.status === currentFilter);
    }

    // 再按搜索关键词筛选
    if (searchKeyword.trim()) {
      filteredUsers = filteredUsers.filter(user => {
        const keyword = searchKeyword.toLowerCase();
        return user.nickname.toLowerCase().includes(keyword) ||
               user.phone.toLowerCase().includes(keyword);
      });
    }

    this.setData({
      users: filteredUsers
    });
  },

  /**
   * 用户状态修改
   */
  onEditUserStatus(e) {
    const user = e.currentTarget.dataset.user;
    this.setData({
      currentUser: user,
      showStatusSheet: true
    });
  },

  onStatusSheetClose() {
    this.setData({
      showStatusSheet: false,
      currentUser: null
    });
  },

  onChangeStatus(e) {
    const newStatus = e.currentTarget.dataset.status;
    const { currentUser } = this.data;
    
    if (!currentUser) return;

    const statusMap = {
      'active': 'VIP用户',
      'inactive': '普通用户',
      'blocked': '已封禁'
    };

    // 这里应该调用API更新用户状态
    console.log('更新用户状态:', currentUser.id, newStatus);
    
    // 模拟更新本地数据
    const users = this.data.users.map(user => {
      if (user.id === currentUser.id) {
        return {
          ...user,
          status: newStatus,
          statusText: statusMap[newStatus]
        };
      }
      return user;
    });

    this.setData({
      users,
      showStatusSheet: false,
      currentUser: null
    }, () => {
      this.filterUsers();
      wx.showToast({
        title: '状态修改成功',
        icon: 'success'
      });
    });
  },

  /**
   * 导出用户数据
   */
  onExportUsers() {
    const { users } = this.data;
    wx.showModal({
      title: '导出确认',
      content: `确定要导出当前筛选的${users.length}个用户数据吗？`,
      success: (res) => {
        if (res.confirm) {
          // 这里应该调用API导出数据
          console.log('导出用户数据:', users);
          wx.showToast({
            title: '导出成功',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 底部导航切换
   */
  onTabSwitch(e) {
    console.log('用户页底部导航被点击', e.currentTarget.dataset);
    const tab = e.currentTarget.dataset.tab;
    
    console.log('当前点击的tab:', tab);
    
    if (tab === 'users') {
      console.log('当前已在用户页面，不跳转');
      return;
    }

    const tabRoutes = {
      'home': '/pages/admin/admin',
      'products': '/pages/admin-products/admin-products',
      'orders': '/pages/admin-orders/admin-orders',
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
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadUsers();
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
    // 重新加载数据
    this.filterUsers();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 加载更多数据
    console.log('加载更多用户数据');
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  /**
   * 加载用户数据
   */
  loadUsers: function() {
    this.setData({
      loading: true
    });

    console.log('🔄 开始加载用户数据...');

    // 调用 admin 云函数获取用户列表
    wx.cloud.callFunction({
      name: 'admin',
      data: {
        action: 'getUsers',
        page: 1,
        pageSize: 100  // 获取更多用户以便测试
      }
    }).then(res => {
      console.log('📊 用户数据加载响应:', res);
      
      if (res.result && res.result.success) {
        // 正确解析云函数返回的数据结构
        const responseData = res.result.data || {};
        const userData = responseData.list || [];
        const total = responseData.total || 0;
        
        console.log('✅ 成功获取用户数据:', userData.length, '个用户，总计:', total);
        
        // 格式化用户数据
        const formattedUsers = userData.map(user => this.formatUserForDisplay(user));
        
        this.setData({
          allUsers: formattedUsers,
          users: formattedUsers,
          loading: false
        });
        
        console.log('🎯 用户数据设置完成，当前显示:', formattedUsers.length, '个用户');
        
        if (formattedUsers.length === 0) {
          wx.showToast({
            title: '暂无用户数据',
            icon: 'none'
          });
        }
      } else {
        console.error('❌ 获取用户数据失败:', res.result);
        this.setData({
          loading: false
        });
        wx.showToast({
          title: '获取用户数据失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('❌ 调用用户管理云函数失败:', err);
      this.setData({
        loading: false
      });
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    });
  },

  /**
   * 格式化用户数据用于显示
   */
  formatUserForDisplay(user) {
    console.log('🔧 格式化用户数据:', user);
    
    // 计算用户状态
    let status = 'active';
    let statusText = '普通用户';
    
    // 这里可以根据实际业务逻辑判断用户类型
    // 比如根据订单数量、消费金额等判断是否为VIP用户
    if (user.orderCount >= 10 || user.totalAmount >= 1000) {
      statusText = 'VIP用户';
    }
    
    if (user.status === 'blocked') {
      status = 'blocked';
      statusText = '已封禁';
    } else if (user.status === 'inactive') {
      status = 'inactive';
      statusText = '非活跃用户';
    }

    const formattedUser = {
      id: user._id,
      nickname: user.nickName || user.nickname || '未知用户',
      phone: user.phoneNumber || user.phone || '未绑定',
      avatar: user.avatarUrl || user.avatar || '/images/default-avatar.png',
      status: status,
      statusText: statusText,
      registerTime: this.formatTime(user.createTime),
      lastLoginTime: this.formatTime(user.updateTime || user.lastLoginTime || user.createTime),
      orderCount: user.orderCount || 0,
      totalAmount: (user.totalAmount || 0).toFixed(2),
      openid: user.openid || '未知'
    };
    
    console.log('✅ 格式化后的用户数据:', formattedUser);
    return formattedUser;
  },

  /**
   * 格式化时间
   */
  formatTime(date) {
    if (!date) return '未知';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },
})