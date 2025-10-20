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
    // 验证管理员身份
    this.checkAdminStatus();
  },

  /**
   * 验证管理员身份
   */
  checkAdminStatus: function() {
    wx.cloud.callFunction({
      name: 'auth',
      data: {
        action: 'checkAdmin'
      }
    }).then(res => {
      if (res.result && res.result.success && res.result.data.isAdmin) {
        // 验证通过，加载用户数据
        this.loadUsers();
      } else {
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

    // 按状态筛选
    if (currentFilter === 'all') {
      // 全部用户
      filteredUsers = allUsers;
    } else if (currentFilter === 'vip') {
      // VIP用户：status=active 且（订单≥10 或 消费≥1000）
      filteredUsers = allUsers.filter(user => 
        user.status === 'active' && (user.orderCount >= 10 || parseFloat(user.totalAmount) >= 1000)
      );
    } else if (currentFilter === 'normal') {
      // 普通用户：status=active 且（订单<10 且 消费<1000）
      filteredUsers = allUsers.filter(user => 
        user.status === 'active' && user.orderCount < 10 && parseFloat(user.totalAmount) < 1000
      );
    } else if (currentFilter === 'blocked') {
      // 已封禁用户
      filteredUsers = allUsers.filter(user => user.status === 'blocked');
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
    
    // 根据当前用户状态决定显示的选项
    const itemList = [];
    if (user.status === 'blocked') {
      itemList.push('✅ 解除封禁');
    } else {
      itemList.push('🚫 封禁用户');
    }
    
    wx.showActionSheet({
      itemList: itemList,
      success: (res) => {
        if (res.tapIndex === 0) {
          // 确定要修改的状态
          const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
          this.confirmChangeStatus(user, newStatus);
        }
      }
    });
  },

  /**
   * 确认修改状态
   */
  confirmChangeStatus(user, newStatus) {
    const statusMap = {
      'active': '正常',
      'blocked': '已封禁'
    };

    // 友好的确认提示
    const confirmText = newStatus === 'blocked' 
      ? '确定要封禁该用户吗？封禁后用户将无法使用小程序。' 
      : '确定要解除封禁吗？用户将恢复正常使用权限。';

    wx.showModal({
      title: '确认操作',
      content: confirmText,
      confirmText: '确定',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return;

        wx.showLoading({ title: '更新中...' });

        try {
          // 调用云函数更新用户状态
          const cloudRes = await wx.cloud.callFunction({
            name: 'admin',
            data: {
              action: 'updateUserStatus',
              userId: user.id,
              status: newStatus
            }
          });

          wx.hideLoading();

          if (cloudRes.result && cloudRes.result.success) {
            // 重新加载用户数据以获取完整的格式化信息
            this.loadUsers();
            
            wx.showToast({
              title: `已设为${statusMap[newStatus]}`,
              icon: 'success'
            });
          } else {
            throw new Error(cloudRes.result?.message || '更新失败');
          }
        } catch (error) {
          wx.hideLoading();
          console.error('更新用户状态失败:', error);
          wx.showToast({
            title: error.message || '更新失败',
            icon: 'none'
          });
        }
      }
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
          // TODO: 实现导出功能
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
    const tab = e.currentTarget.dataset.tab;
    
    if (tab === 'users') {
      return;
    }

    const tabRoutes = {
      'home': '/pages/admin/admin',
      'products': '/pages/admin-products/admin-products',
      'orders': '/pages/admin-orders/admin-orders',
      'settings': '/pages/admin-settings/admin-settings'
    };

    if (tabRoutes[tab]) {
      wx.redirectTo({
        url: tabRoutes[tab]
      });
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
    // TODO: 实现分页加载
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  /**
   * 加载用户数据（重构版）
   */
  loadUsers: async function() {
    this.setData({
      loading: true
    });

    try {
      // 第一步：获取用户列表
      const res = await wx.cloud.callFunction({
        name: 'admin',
        data: {
          action: 'getUsers',
          page: 1,
          pageSize: 100
        }
      });
      
      if (!res.result || !res.result.success) {
        throw new Error('获取用户数据失败');
      }
      
      const responseData = res.result.data || {};
      const userData = responseData.list || [];
      const total = responseData.total || 0;
      
      if (userData.length === 0) {
        this.setData({
          allUsers: [],
          users: [],
          loading: false
        });
        wx.showToast({
          title: '暂无用户数据',
          icon: 'none'
        });
        return;
      }
      
      // 第二步：为每个用户获取订单统计
      const usersWithStats = await Promise.all(
        userData.map(async (user) => {
          try {
            const statsRes = await wx.cloud.callFunction({
              name: 'admin',
              data: {
                action: 'getUserOrderStats',
                openid: user.openid
              }
            });
            
            if (statsRes.result && statsRes.result.success) {
              const stats = statsRes.result.data;
              return Object.assign({}, user, {
                orderCount: stats.orderCount || 0,
                totalAmount: stats.totalAmount || 0
              });
            } else {
              return Object.assign({}, user, {
                orderCount: 0,
                totalAmount: 0
              });
            }
          } catch (error) {
            console.error(`获取用户订单统计异常:`, error);
            return Object.assign({}, user, {
              orderCount: 0,
              totalAmount: 0
            });
          }
        })
      );
      
      // 格式化用户数据
      const formattedUsers = usersWithStats.map(user => this.formatUserForDisplay(user));
      
      this.setData({
        allUsers: formattedUsers,
        users: formattedUsers,
        loading: false
      });
      
    } catch (error) {
      console.error('❌ 加载用户数据失败:', error);
      this.setData({
        loading: false
      });
      wx.showToast({
        title: error.message || '网络错误，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 格式化用户数据用于显示（重构版）
   */
  formatUserForDisplay(user) {
    // 获取订单统计数据
    const orderCount = user.orderCount || 0;
    const totalAmount = user.totalAmount || 0;
    
    // 计算用户状态和等级
    let status = user.status || 'active';
    let statusText = '普通用户';
    
    // 优先检查是否被封禁
    if (status === 'blocked') {
      statusText = '已封禁';
    } else {
      // 正常用户，根据消费判断等级
      // 兼容旧数据：将 inactive 视为 active
      if (status === 'inactive') {
        status = 'active';
      }
      
      if (orderCount >= 10 || totalAmount >= 1000) {
        statusText = 'VIP用户';
      } else {
        statusText = '普通用户';
      }
    }

    // 如果用户昵称是"测试用户"，显示为"用户+openid后4位"以便区分
    let displayNickname = user.nickname || '未设置昵称';
    if (displayNickname === '测试用户' && user.openid) {
      const suffix = user.openid.slice(-4);
      displayNickname = `测试用户${suffix}`;
    }
    
    // 计算活跃度
    const activityData = this.calculateActivity(user.updateTime || user.createTime);
    
    const formattedUser = {
      _id: user._id,  // 保留 _id 用于更新
      id: user._id,
      nickname: displayNickname,
      phone: user.phone || '未绑定手机',
      avatar: user.avatar || '',
      status: status,
      statusText: statusText,
      registerTime: this.formatTime(user.createTime),
      lastLoginTime: this.formatTime(user.updateTime || user.lastLoginTime || user.createTime),
      orderCount: orderCount,
      totalAmount: totalAmount.toFixed(2),
      openid: user.openid || '未知',
      // 活跃度相关
      activityText: activityData.text,
      activityIndicator: activityData.indicator,
      activityClass: activityData.class,
      activityDays: activityData.days
    };
    
    return formattedUser;
  },
  
  /**
   * 计算用户活跃度
   */
  calculateActivity(lastActiveTime) {
    if (!lastActiveTime) {
      return {
        text: '未知',
        indicator: '',
        class: '',
        days: 999
      };
    }
    
    const now = new Date();
    const lastTime = new Date(lastActiveTime);
    const daysDiff = Math.floor((now - lastTime) / (1000 * 60 * 60 * 24));
    
    let text = '';
    let indicator = '';
    let activityClass = '';
    
    if (daysDiff === 0) {
      text = '今日活跃';
      indicator = '🟢';
      activityClass = 'active-today';
    } else if (daysDiff <= 3) {
      text = `${daysDiff}天前`;
      indicator = '🟢';
      activityClass = 'active-recent';
    } else if (daysDiff <= 7) {
      text = `${daysDiff}天前`;
      indicator = '🟡';
      activityClass = 'active-week';
    } else if (daysDiff <= 30) {
      text = `${daysDiff}天前`;
      indicator = '🟠';
      activityClass = 'active-month';
    } else {
      text = `${daysDiff}天前`;
      indicator = '🔴';
      activityClass = 'active-inactive';
    }
    
    return {
      text: text,
      indicator: indicator,
      class: activityClass,
      days: daysDiff
    };
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