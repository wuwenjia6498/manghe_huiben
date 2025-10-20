// pages/privacy/privacy.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    updateDate: '2025年10月16日'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    wx.setNavigationBarTitle({
      title: '隐私政策'
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '绘本盲盒隐私政策',
      path: '/pages/privacy/privacy'
    };
  }
});

