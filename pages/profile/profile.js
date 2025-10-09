// pages/profile/profile.js
// 引入微信支付SDK（从utils目录）
const paymentSDK = require('../../utils/paymentSDK.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isLoggedIn: false, // 登录状态
    userInfo: {
      name: '张先生',
      status: '微信用户 · 普通会员',
      avatar: 'https://picsum.photos/200/200?random=user',
      nickName: '张先生' // SDK需要的nickName字段
    },
    settingsClickCount: 0, // 设置按钮点击次数
    showAdminEntry: false // 是否显示管理端入口
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
              nickName: res.userInfo.nickName || '微信用户', // SDK需要的nickName字段
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
          
          // 清除购物车数据
          wx.removeStorageSync('cart');
          wx.removeStorageSync('cartCount');
          
          // 清除订单数据
          wx.removeStorageSync('orderData');
          
          // 清除tabBar徽章
          wx.removeTabBarBadge({
            index: 2
          });
          
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
  },

  /**
   * 支付测试点击
   */
  onPaymentTestTap() {
    console.log('=== 点击支付测试按钮 ===');
    
    // 检查登录状态
    if (!this.data.isLoggedIn) {
      this.showLoginTip();
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: '正在创建订单...',
      mask: true
    });

    // 准备支付参数
    const paymentOptions = {
      amount: 5,  // 支付金额：5分（0.05元）
      description: '绘本盲盒测试购买',
      attach: JSON.stringify({
        productType: 'test',
        productName: '绘本盲盒',
        testMode: true
      })
    };

    console.log('支付参数:', paymentOptions);
    console.log('用户信息:', this.data.userInfo);

    // 调用支付SDK
    paymentSDK.processPayment(this.data.userInfo, paymentOptions)
      .then((result) => {
        console.log('支付结果:', result);

        // 隐藏加载提示
        wx.hideLoading();

        // 处理支付结果
        if (result.success) {
          // 支付成功
          this.handlePaymentSuccess(result);
        } else if (result.cancelled) {
          // 用户取消支付
          wx.showToast({
            title: '支付已取消',
            icon: 'none',
            duration: 2000
          });
        } else {
          // 支付失败
          wx.showModal({
            title: '支付失败',
            content: result.message || '支付过程中出现错误，请重试',
            showCancel: false,
            confirmText: '我知道了'
          });
        }
      })
      .catch((error) => {
        console.error('支付异常:', error);
        wx.hideLoading();
        
        wx.showModal({
          title: '支付异常',
          content: error.message || '支付过程中发生异常，请稍后重试',
          showCancel: false,
          confirmText: '我知道了'
        });
      });
  },

  /**
   * 处理支付成功后的业务逻辑
   */
  handlePaymentSuccess(paymentResult) {
    console.log('✅ 支付成功处理开始');
    console.log('支付结果详情:', paymentResult);
    
    const { orderNo, transactionId } = paymentResult;
    
    // 显示支付成功提示
    wx.showModal({
      title: '支付成功！',
      content: `订单号：${orderNo}\n交易号：${transactionId}\n支付金额：0.05元\n\n订单已记录到云数据库orders表中`,
      showCancel: false,
      confirmText: '确定',
      success: () => {
        console.log('✅ 支付成功处理完成');
        
        // 可以在这里添加其他业务逻辑
        // 例如：刷新用户信息、跳转到订单页面等
      }
    });
  }
})