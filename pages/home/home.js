Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    // 简化的首页数据
    promoText: '🎉 欢迎来到八爪鱼绘本馆！首单立减10元，分享得5元券！'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadData();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '绘本盲盒'
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 刷新购物车数量等状态
    this.updateCartCount();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.loadData();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    // 简化后的首页不需要加载更多内容
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '绘本盲盒 - 超值惊喜，适龄推荐',
      path: '/pages/home/home',
      imageUrl: '/images/share-banner.jpg'
    };
  },

  /**
   * 加载页面数据
   */
  loadData: function() {
    // 加载公告设置
    this.loadPromoSettings();
  },

  /**
   * 加载公告设置
   */
  loadPromoSettings: function() {
    // 从系统设置中加载公告信息
    wx.cloud.callFunction({
      name: 'admin',
      data: {
        action: 'getSettings'
      }
    }).then(res => {
      if (res.result.success && res.result.data) {
        const settings = res.result.data;
        
        // 使用系统设置中的公告内容
        let promoText = '🎉 欢迎来到八爪鱼绘本馆！';
        
        // 优先使用系统公告内容
        if (settings.systemNoticeEnabled && settings.systemNotice) {
          promoText = settings.systemNotice;
        }
        
        this.setData({
          promoText: promoText
        });
      } else {
        this.setData({
          promoText: '🎉 欢迎来到八爪鱼绘本馆！首单立减10元，分享得5元券！'
        });
      }
    }).catch(err => {
      console.error('获取系统设置失败:', err);
      // 使用默认公告
      this.setData({
        promoText: '🎉 欢迎来到八爪鱼绘本馆！首单立减10元，分享得5元券！'
      });
    });
  },

  /**
   * 更新购物车数量
   */
  updateCartCount: function() {
    // TODO: 获取购物车数量并更新tabBar徽章
    const cartCount = wx.getStorageSync('cartCount') || 0;
    if (cartCount > 0) {
      wx.setTabBarBadge({
        index: 2, // 购物车tab的索引（首页、盲盒、购物车、我的）
        text: cartCount.toString()
      });
    } else {
      wx.removeTabBarBadge({
        index: 2
      });
    }
  },

  /**
   * 开始选择盲盒 - 跳转到盲盒配置页面
   */
  goToBlindboxSelect: function() {
    // 跳转到盲盒tab页面
    wx.switchTab({
      url: '/pages/product-detail/product-detail',
      fail: () => {
        // 如果switchTab失败，尝试使用navigateTo
        wx.navigateTo({
          url: '/pages/product-detail/product-detail'
        });
      }
    });
  }
}); 