// app.js
const { ENV_ID } = require('./env.js');

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

    // 静默登录
    this.silentLogin();
  },

  /**
   * 静默登录 - 用户无感知自动登录
   */
  async silentLogin() {
    try {
      // 检查本地是否已有登录信息
      const localLoginInfo = wx.getStorageSync('loginInfo');
      if (localLoginInfo && localLoginInfo.openid) {
        console.log('本地已有登录信息，从云端获取最新用户数据...');
        
        // 从数据库获取最新用户信息
        try {
          const cloudRes = await wx.cloud.callFunction({
            name: 'auth',
            data: { action: 'getUserInfo' }
          });
          
          console.log('云端获取用户信息结果:', cloudRes);
          
          if (cloudRes.result && cloudRes.result.success) {
            const user = cloudRes.result.data;
            console.log('用户数据:', user);
            
            // 修复：即使 nickname 或 avatar 为空字符串，也应该创建 userInfo 对象
            const userInfo = user ? {
              nickName: user.nickname || '',
              avatar: user.avatar || ''
            } : null;
            
            console.log('格式化后的 userInfo:', userInfo);
            
            const loginInfo = {
              isLoggedIn: true,
              openid: localLoginInfo.openid,
              userInfo: userInfo,
              loginTime: Date.now()
            };
            
            wx.setStorageSync('loginInfo', loginInfo);
            this.globalData.userInfo = userInfo;
            this.globalData.openid = localLoginInfo.openid;
            
            console.log('✅ 用户信息已更新到本地缓存');
            return;
          } else {
            console.error('云端获取用户信息失败:', cloudRes.result);
          }
        } catch (error) {
          console.error('获取用户信息异常:', error);
          // 使用本地缓存
          this.globalData.userInfo = localLoginInfo.userInfo || null;
          this.globalData.openid = localLoginInfo.openid;
          return;
        }
      }

      // 新用户登录
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject });
      });

      const cloudRes = await wx.cloud.callFunction({
        name: 'auth',
        data: { action: 'login' }
      });

      if (cloudRes.result && cloudRes.result.success) {
        const { openid, user } = cloudRes.result.data;
        console.log('新用户登录，用户数据:', user);
        
        // 修复：即使 nickname 或 avatar 为空字符串，也应该创建 userInfo 对象
        const userInfo = user ? {
          nickName: user.nickname || '',
          avatar: user.avatar || ''
        } : null;
        
        console.log('格式化后的 userInfo:', userInfo);
        
        const loginInfo = {
          isLoggedIn: true,
          openid: openid,
          userInfo: userInfo,
          loginTime: Date.now()
        };

        wx.setStorageSync('loginInfo', loginInfo);
        this.globalData.userInfo = userInfo;
        this.globalData.openid = openid;
        
        console.log('✅ 新用户登录信息已保存');
      }
    } catch (error) {
      console.error('静默登录失败:', error);
    }
  },

  globalData: {
    userInfo: null,
    openid: null, // 用户的 openid
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
