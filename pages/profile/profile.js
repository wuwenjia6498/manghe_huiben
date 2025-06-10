// pages/profile/profile.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isLoggedIn: false, // 登录状态
    userInfo: {
      name: '张先生',
      status: '微信用户 · 普通会员',
      avatar: 'https://picsum.photos/200/200?random=user'
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
    
    this.checkLoginStatus();
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
    this.checkLoginStatus();
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
    this.checkLoginStatus();
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
      title: '绘本盲盒小程序 - 精选优质绘本',
      path: '/pages/home/home'
    };
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const loginInfo = wx.getStorageSync('loginInfo');
    
    if (loginInfo && loginInfo.isLoggedIn) {
      this.setData({
        isLoggedIn: true,
        userInfo: loginInfo.userInfo
      });
    } else {
      this.setData({
        isLoggedIn: false
      });
    }
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    // 模拟从服务器获取用户信息
    // 实际项目中可以调用wx.getUserProfile()获取用户信息
    const userInfo = {
      name: '张先生',
      status: '微信用户 · 普通会员',
      avatar: 'https://picsum.photos/200/200?random=user'
    };
    
    this.setData({
      userInfo
    });
  },

  /**
   * 设置按钮点击
   */
  onSettingsTap() {
    wx.showToast({
      title: '设置功能开发中',
      icon: 'none'
    });
  },

  /**
   * 微信登录
   */
  onLoginTap() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        console.log('获取用户信息成功:', res);
        
        // 调用微信登录
        wx.login({
          success: (loginRes) => {
            console.log('微信登录成功:', loginRes);
            
            // 模拟登录成功
            const userInfo = {
              name: res.userInfo.nickName || '微信用户',
              status: '微信用户 · 普通会员',
              avatar: res.userInfo.avatarUrl || 'https://picsum.photos/200/200?random=user'
            };
            
            // 保存登录信息
            const loginInfo = {
              isLoggedIn: true,
              userInfo: userInfo,
              loginTime: Date.now(),
              openid: 'mock_openid_' + Date.now() // 模拟openid
            };
            
            wx.setStorageSync('loginInfo', loginInfo);
            
            // 更新页面状态
            this.setData({
              isLoggedIn: true,
              userInfo: userInfo
            });
            
            wx.showToast({
              title: '登录成功',
              icon: 'success'
            });
          },
          fail: (error) => {
            console.error('微信登录失败:', error);
            wx.showToast({
              title: '登录失败',
              icon: 'error'
            });
          }
        });
      },
      fail: (error) => {
        console.error('获取用户信息失败:', error);
        wx.showToast({
          title: '取消授权',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 退出登录
   */
  onLogoutTap() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录信息
          wx.removeStorageSync('loginInfo');
          
          // 更新页面状态
          this.setData({
            isLoggedIn: false
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 订单相关点击
   */
  onOrdersTap(e) {
    // 检查登录状态
    if (!this.data.isLoggedIn) {
      this.showLoginTip();
      return;
    }
    
    const type = e.currentTarget.dataset.type || 'all';
    
    wx.navigateTo({
      url: `/pages/orders/orders?type=${type}`
    });
  },

  /**
   * 收货地址点击
   */
  onAddressTap() {
    // 检查登录状态
    if (!this.data.isLoggedIn) {
      this.showLoginTip();
      return;
    }
    
    wx.navigateTo({
      url: '/pages/address/address'
    });
  },

  /**
   * 显示登录提示
   */
  showLoginTip() {
    wx.showModal({
      title: '需要登录',
      content: '此功能需要登录后使用，是否立即登录？',
      confirmText: '立即登录',
      cancelText: '稍后再说',
      success: (res) => {
        if (res.confirm) {
          this.onLoginTap();
        }
      }
    });
  },

  /**
   * 联系客服点击
   */
  onCustomerServiceTap() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-123-4567\n工作时间：09:00-18:00',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  /**
   * 用户协议点击
   */
  onAgreementTap() {
    wx.showToast({
      title: '用户协议页面开发中',
      icon: 'none'
    });
  },

  /**
   * 隐私政策点击
   */
  onPrivacyTap() {
    wx.showToast({
      title: '隐私政策页面开发中',
      icon: 'none'
    });
  },

  /**
   * 关于我们点击
   */
  onAboutTap() {
    wx.showModal({
      title: '关于我们',
      content: '绘本童书小程序\n专注于为孩子提供优质绘本\n版本：v1.0.0',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  /**
   * 推荐给朋友点击
   */
  onRecommendTap() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    wx.showToast({
      title: '请点击右上角分享',
      icon: 'none'
    });
  }
})