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
    
    // 用户列表数据
    users: [
      {
        id: 'u001',
        nickname: '张小明',
        phone: '138****8888',
        avatar: '/images/avatar1.png',
        status: 'active',
        statusText: 'VIP用户',
        registerTime: '2024-01-15 10:30',
        lastLoginTime: '2024-01-20 14:25',
        orderCount: 12,
        totalAmount: '2,580.00'
      },
      {
        id: 'u002',
        nickname: '李美丽',
        phone: '139****6666',
        avatar: '/images/avatar2.png',
        status: 'active',
        statusText: 'VIP用户',
        registerTime: '2024-01-10 09:15',
        lastLoginTime: '2024-01-19 16:40',
        orderCount: 8,
        totalAmount: '1,350.00'
      },
      {
        id: 'u003',
        nickname: '王大强',
        phone: '136****9999',
        avatar: '/images/avatar3.png',
        status: 'inactive',
        statusText: '普通用户',
        registerTime: '2023-12-05 14:20',
        lastLoginTime: '2023-12-28 11:10',
        orderCount: 3,
        totalAmount: '459.00'
      },
      {
        id: 'u004',
        nickname: '陈小花',
        phone: '137****7777',
        avatar: '/images/avatar4.png',
        status: 'blocked',
        statusText: '已封禁',
        registerTime: '2023-11-20 16:45',
        lastLoginTime: '2024-01-05 13:22',
        orderCount: 0,
        totalAmount: '0.00'
      },
      {
        id: 'u005',
        nickname: '赵小龙',
        phone: '135****5555',
        avatar: '/images/avatar5.png',
        status: 'active',
        statusText: 'VIP用户',
        registerTime: '2024-01-18 11:30',
        lastLoginTime: '2024-01-20 15:45',
        orderCount: 15,
        totalAmount: '3,280.00'
      },
      {
        id: 'u006',
        nickname: '刘晓雯',
        phone: '152****1234',
        avatar: '/images/avatar6.png',
        status: 'active',
        statusText: 'VIP用户',
        registerTime: '2024-01-12 08:45',
        lastLoginTime: '2024-01-20 09:30',
        orderCount: 6,
        totalAmount: '890.00'
      },
      {
        id: 'u007',
        nickname: '周大伟',
        phone: '159****8765',
        avatar: '/images/avatar7.png',
        status: 'active',
        statusText: 'VIP用户',
        registerTime: '2023-10-28 15:20',
        lastLoginTime: '2024-01-19 20:15',
        orderCount: 28,
        totalAmount: '5,680.00'
      },
      {
        id: 'u008',
        nickname: '孙小美',
        phone: '186****3456',
        avatar: '/images/avatar8.png',
        status: 'inactive',
        statusText: '普通用户',
        registerTime: '2023-09-15 12:30',
        lastLoginTime: '2023-11-20 14:25',
        orderCount: 2,
        totalAmount: '198.00'
      },
      {
        id: 'u009',
        nickname: '林志强',
        phone: '147****7890',
        avatar: '/images/avatar9.png',
        status: 'blocked',
        statusText: '已封禁',
        registerTime: '2023-08-05 10:15',
        lastLoginTime: '2023-12-30 16:40',
        orderCount: 1,
        totalAmount: '49.90'
      },
      {
        id: 'u010',
        nickname: '吴佳佳',
        phone: '173****2468',
        avatar: '/images/avatar10.png',
        status: 'active',
        statusText: 'VIP用户',
        registerTime: '2024-01-08 14:50',
        lastLoginTime: '2024-01-20 11:20',
        orderCount: 4,
        totalAmount: '320.00'
      },
      {
        id: 'u011',
        nickname: '马小军',
        phone: '182****1357',
        avatar: '/images/avatar11.png',
        status: 'active',
        statusText: 'VIP用户',
        registerTime: '2023-12-20 09:40',
        lastLoginTime: '2024-01-20 18:30',
        orderCount: 18,
        totalAmount: '2,890.00'
      },
      {
        id: 'u012',
        nickname: '杨雪梅',
        phone: '155****9876',
        avatar: '/images/avatar12.png',
        status: 'inactive',
        statusText: '普通用户',
        registerTime: '2023-07-12 16:25',
        lastLoginTime: '2023-10-15 13:45',
        orderCount: 5,
        totalAmount: '678.00'
      },
      {
        id: 'u013',
        nickname: '黄小帅',
        phone: '134****5432',
        avatar: '/images/avatar13.png',
        status: 'active',
        statusText: 'VIP用户',
        registerTime: '2024-01-20 10:15',
        lastLoginTime: '2024-01-20 19:45',
        orderCount: 1,
        totalAmount: '128.00'
      },
      {
        id: 'u014',
        nickname: '郑丽华',
        phone: '198****6543',
        avatar: '/images/avatar14.png',
        status: 'active',
        statusText: 'VIP用户',
        registerTime: '2023-11-08 11:30',
        lastLoginTime: '2024-01-19 15:20',
        orderCount: 22,
        totalAmount: '4,560.00'
      },
      {
        id: 'u015',
        nickname: '徐大海',
        phone: '176****7654',
        avatar: '/images/avatar15.png',
        status: 'blocked',
        statusText: '已封禁',
        registerTime: '2023-06-20 14:45',
        lastLoginTime: '2023-12-25 10:30',
        orderCount: 3,
        totalAmount: '156.50'
      },
      {
        id: 'u016',
        nickname: '何小薇',
        phone: '166****8901',
        avatar: '/images/avatar16.png',
        status: 'active',
        statusText: 'VIP用户',
        registerTime: '2024-01-16 13:20',
        lastLoginTime: '2024-01-20 12:40',
        orderCount: 3,
        totalAmount: '245.00'
      },
      {
        id: 'u017',
        nickname: '谢大明',
        phone: '191****2345',
        avatar: '/images/avatar17.png',
        status: 'inactive',
        statusText: '普通用户',
        registerTime: '2023-05-15 09:30',
        lastLoginTime: '2023-08-20 16:15',
        orderCount: 7,
        totalAmount: '834.00'
      },
      {
        id: 'u018',
        nickname: '袁小颖',
        phone: '165****3456',
        avatar: '/images/avatar18.png',
        status: 'active',
        statusText: 'VIP用户',
        registerTime: '2023-12-01 15:45',
        lastLoginTime: '2024-01-20 14:50',
        orderCount: 9,
        totalAmount: '1,180.00'
      }
    ],
    
    filteredUsers: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.filterUsers();
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

  filterUsers() {
    const { users, currentFilter, searchKeyword } = this.data;
    
    let filtered = users;
    
    // 按状态筛选
    if (currentFilter !== 'all') {
      filtered = filtered.filter(user => user.status === currentFilter);
    }
    
    // 按关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      filtered = filtered.filter(user => 
        (user.nickname && user.nickname.toLowerCase().includes(keyword)) ||
        (user.phone && user.phone.includes(keyword))
      );
    }
    
    this.setData({
      filteredUsers: filtered
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
    const { filteredUsers } = this.data;
    wx.showModal({
      title: '导出确认',
      content: `确定要导出当前筛选的${filteredUsers.length}个用户数据吗？`,
      success: (res) => {
        if (res.confirm) {
          // 这里应该调用API导出数据
          console.log('导出用户数据:', filteredUsers);
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

  }
})