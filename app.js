// app.js
const { ENV_ID } = require('./cloud/env.js');

App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: ENV_ID,
        traceUser: true,
      });
    }

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log('登录成功，code:', res.code);
        this.getUserInfo();
      }
    })
  },

  // 获取用户信息
  getUserInfo() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        this.globalData.userInfo = res.userInfo;
        console.log('用户信息:', res.userInfo);
      },
      fail: (err) => {
        console.log('获取用户信息失败:', err);
      }
    })
  },

  globalData: {
    userInfo: null,
    // 添加云开发相关的全局数据
    db: null,
    isAdmin: false,
    cartCount: 0
  },

  // 获取云数据库实例
  getDB() {
    if (!this.globalData.db) {
      this.globalData.db = wx.cloud.database();
    }
    return this.globalData.db;
  }
})
