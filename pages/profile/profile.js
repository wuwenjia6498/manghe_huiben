// pages/profile/profile.js

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isLoggedIn: false, // 是否已静默登录（有openid）
    hasUserInfo: false, // 是否已完善用户信息
    userInfo: null, // 用户信息，未登录或未设置时为 null
    displayName: '用户昵称', // 显示的昵称（用于界面展示）
    tempAvatar: '', // 临时头像
    tempNickname: '', // 临时昵称
    settingsClickCount: 0, // 设置按钮点击次数
    showAdminEntry: false, // 是否显示管理端入口
    showAboutModal: false, // 是否显示关于我们弹窗
    orderCounts: {
      all: 0,
      pending: 0,  // 待支付
      paid: 0,     // 待发货
      shipped: 0   // 待收货
    },
    showQrcodeModal: false  // 控制二维码弹窗显示
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取系统信息，设置状态栏高度（使用新API）
    const windowInfo = wx.getWindowInfo();
    const statusBarHeight = windowInfo.statusBarHeight || 20;
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
    this.loadOrderCounts();
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
   * 优先使用本地缓存，仅在需要时刷新
   */
  async checkLoginStatus() {
    console.log('🔄 检查登录状态...');
    const loginInfo = wx.getStorageSync('loginInfo');
    console.log('本地缓存的 loginInfo:', loginInfo);
    
    if (loginInfo && loginInfo.openid) {
      // 优先显示本地缓存的用户信息
      const userInfo = loginInfo.userInfo || null;
      console.log('用户信息:', userInfo);
      
      // 修复：只要有 userInfo 对象就认为已登录，不要求必须有头像和昵称
      const hasUserInfo = !!userInfo;
      const displayName = this.getDisplayName(userInfo);
      
      console.log('hasUserInfo:', hasUserInfo, 'displayName:', displayName);
      
      this.setData({
        isLoggedIn: true,
        hasUserInfo: hasUserInfo,
        userInfo: userInfo,
        displayName: displayName
      });
      
      console.log('✅ 登录状态已更新');
    } else {
      // 没有登录信息
      console.log('❌ 无登录信息');
      this.setData({
        isLoggedIn: false,
        hasUserInfo: false,
        userInfo: null,
        displayName: '用户昵称'
      });
    }
  },

  /**
   * 获取显示的用户昵称
   * 如果用户设置了昵称就显示昵称，否则显示默认值"用户昵称"
   */
  getDisplayName(userInfo) {
    if (!userInfo) return '用户昵称';
    return userInfo.nickName || userInfo.name || '用户昵称';
  },

  /**
   * 设置按钮点击
   */
  onSettingsTap(e) {
    // 阻止事件冒泡
    if (e) {
      e.stopPropagation && e.stopPropagation();
    }
    
    wx.showToast({
      title: '设置功能开发中',
      icon: 'none'
    });
  },

  /**
   * 进入管理模式
   */
  enterAdminMode() {
    // 设置管理员访问标记
    wx.setStorageSync('adminAccess', true);
    
    // 跳转到管理端页面
    wx.navigateTo({
      url: '/pages/admin/admin',
      success: () => {
        wx.showToast({
          title: '已进入管理后台',
          icon: 'success'
        });
      },
      fail: (error) => {
        console.error('跳转管理端失败:', error);
        wx.showToast({
          title: '跳转失败',
          icon: 'error'
        });
      }
    });
  },

  /**
   * 点击编辑头像（触发button的选择）
   */
  onEditAvatar() {
    // 由button的open-type="chooseAvatar"自动处理
    console.log('点击编辑头像');
  },

  /**
   * 选择头像后的回调
   */
  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    console.log('选择的头像临时路径:', avatarUrl);
    
    if (!avatarUrl) return;
    
    wx.showLoading({ title: '上传中...' });
    
    try {
      const loginInfo = wx.getStorageSync('loginInfo');
      if (!loginInfo || !loginInfo.openid) {
        wx.hideLoading();
        wx.showToast({ title: '请先登录', icon: 'none' });
        return;
      }

      // 第一步：上传到云存储
      console.log('开始上传头像到云存储...');
      const timestamp = Date.now();
      const cloudPath = `avatars/${loginInfo.openid}_${timestamp}.jpg`;
      
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: avatarUrl
      });
      
      console.log('云存储上传成功:', uploadResult);
      const cloudAvatarUrl = uploadResult.fileID;
      console.log('云存储URL:', cloudAvatarUrl);

      // 第二步：保存云存储URL到数据库
      const cloudRes = await wx.cloud.callFunction({
        name: 'auth',
        data: {
          action: 'updateUserInfo',
          userInfo: {
            avatar: cloudAvatarUrl  // 保存云存储URL
          }
        }
      });

      wx.hideLoading();

      if (cloudRes.result && cloudRes.result.success) {
        const { user } = cloudRes.result.data;
        
        // 更新本地数据
        const updatedUserInfo = {
          nickName: user.nickname,
          avatar: user.avatar
        };
        
        const updatedLoginInfo = Object.assign({}, loginInfo, {
          userInfo: updatedUserInfo
        });

        wx.setStorageSync('loginInfo', updatedLoginInfo);

        // 更新页面显示
        this.setData({
          hasUserInfo: true,
          userInfo: updatedUserInfo,
          displayName: this.getDisplayName(updatedUserInfo)
        });

        wx.showToast({
          title: '头像已更新',
          icon: 'success'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('更新头像失败:', error);
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      });
    }
  },

  /**
   * 点击编辑昵称
   */
  onEditNickname() {
    const currentName = this.data.displayName;
    
    wx.showModal({
      title: '设置昵称',
      editable: true,
      placeholderText: '请输入昵称',
      content: currentName === '用户昵称' ? '' : currentName,
      confirmText: '保存',
      success: async (res) => {
        if (res.confirm && res.content) {
          const newNickname = res.content.trim();
          
          if (!newNickname) {
            wx.showToast({ title: '昵称不能为空', icon: 'none' });
            return;
          }

          wx.showLoading({ title: '保存中...' });

          try {
            const loginInfo = wx.getStorageSync('loginInfo');
            
            const cloudRes = await wx.cloud.callFunction({
              name: 'auth',
              data: {
                action: 'updateUserInfo',
                userInfo: { nickname: newNickname }
              }
            });

            wx.hideLoading();

            if (cloudRes.result && cloudRes.result.success) {
              const { user } = cloudRes.result.data;
              
              // 更新本地数据
              const updatedUserInfo = {
                nickName: user.nickname,
                avatar: user.avatar
              };
              
              const updatedLoginInfo = Object.assign({}, loginInfo, {
                userInfo: updatedUserInfo
              });

              wx.setStorageSync('loginInfo', updatedLoginInfo);

              // 更新页面显示
              this.setData({
                hasUserInfo: true,
                userInfo: updatedUserInfo,
                displayName: this.getDisplayName(updatedUserInfo)
              });

              wx.showToast({
                title: '昵称已更新',
                icon: 'success'
              });
            } else {
              wx.showToast({
                title: '更新失败',
                icon: 'none'
              });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('更新昵称失败:', error);
            wx.showToast({
              title: '更新失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },


  /**
   * 订单相关点击
   */
  onOrdersTap(e) {
    const type = e.currentTarget.dataset.type || 'all';
    
    wx.navigateTo({
      url: `/pages/orders/orders?type=${type}`
    });
  },

  /**
   * 收货地址点击
   */
  onAddressTap() {
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
      content: '此功能需要登录后使用，请前往个人中心登录',
      confirmText: '前往登录',
      cancelText: '稍后再说',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({
            url: '/pages/profile/profile'
          });
        }
      }
    });
  },

  /**
   * 联系客服点击 - 显示二维码弹窗
   */
  onCustomerServiceTap() {
    this.setData({
      showQrcodeModal: true
    });
  },

  /**
   * 关闭二维码弹窗
   */
  onCloseQrcode() {
    this.setData({
      showQrcodeModal: false
    });
  },

  /**
   * 用户协议点击
   */
  onAgreementTap() {
    wx.navigateTo({
      url: '/pages/agreement/agreement'
    });
  },

  /**
   * 隐私政策点击
   */
  onPrivacyTap() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    });
  },

  /**
   * 关于我们点击
   */
  onAboutTap() {
    this.setData({
      showAboutModal: true
    });
  },

  /**
   * 关闭关于我们弹窗
   */
  onCloseAboutModal() {
    this.setData({
      showAboutModal: false
    });
  },

  /**
   * 阻止弹窗内容点击事件冒泡
   */
  onModalContentTap() {
    // 阻止事件冒泡，避免点击内容时关闭弹窗
  },

  /**
   * 加载订单数量统计
   */
  async loadOrderCounts() {
    if (!this.data.isLoggedIn) {
      return;
    }

    try {
      // 调用云函数获取订单统计
      const res = await wx.cloud.callFunction({
        name: 'order',
        data: {
          action: 'getOrderStats'
        }
      });

      if (res.result && res.result.success) {
        this.setData({ 
          orderCounts: res.result.data 
        });
      }
    } catch (error) {
      console.error('加载订单统计失败:', error);
    }
  }

})