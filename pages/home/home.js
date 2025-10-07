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
    // 测试云函数部署情况
    this.testCloudFunctions();
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
    // 简化后的首页不需要加载复杂数据
    console.log('加载首页数据');
    
    // 加载公告设置
    this.loadPromoSettings();
  },

  /**
   * 加载公告设置
   */
  loadPromoSettings: function() {
    console.log('开始加载公告设置...');
    
    // 从系统设置中加载公告信息
    wx.cloud.callFunction({
      name: 'admin',
      data: {
        action: 'getSettings'
      }
    }).then(res => {
      console.log('获取系统设置结果:', res.result);
      
      if (res.result.success && res.result.data) {
        const settings = res.result.data;
        console.log('系统设置详情:', settings);
        console.log('公告开关状态:', settings.systemNoticeEnabled);
        console.log('公告内容:', settings.systemNotice);
        
        // 使用系统设置中的公告内容
        let promoText = '🎉 欢迎来到八爪鱼绘本馆！';
        
        // 优先使用系统公告内容
        if (settings.systemNoticeEnabled && settings.systemNotice) {
          promoText = settings.systemNotice;
          console.log('使用系统公告:', promoText);
        } else {
          console.log('系统公告未启用或内容为空，使用默认公告');
        }
        
        console.log('最终设置公告内容:', promoText);
        this.setData({
          promoText: promoText
        });
      } else {
        console.log('获取系统设置失败或数据为空');
        this.setData({
          promoText: '🎉 欢迎来到八爪鱼绘本馆！首单立减10元，分享得5元券！'
        });
      }
    }).catch(err => {
      console.log('获取系统设置失败，使用默认公告:', err);
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
   * 测试云函数部署情况
   */
  testCloudFunctions: function() {
    console.log('🧪 开始测试云函数部署情况...');
    
    // 测试 auth 云函数 - 用户登录
    wx.cloud.callFunction({
      name: 'auth',
      data: {
        action: 'login',
        userInfo: {
          nickName: '测试用户',
          avatarUrl: ''
        }
      }
    }).then(res => {
      console.log('✅ auth 云函数测试成功:', res.result);
      if (res.result.success) {
        // 保存用户信息
        wx.setStorageSync('userInfo', res.result.data.user);
        wx.setStorageSync('openid', res.result.data.openid);
        console.log('📝 用户信息已保存, OpenID:', res.result.data.openid);
      }
    }).catch(err => {
      console.error('❌ auth 云函数测试失败:', err);
    });

    // 测试 product 云函数 - 获取商品列表
    wx.cloud.callFunction({
      name: 'product',
      data: {
        action: 'getProducts',
        page: 1,
        pageSize: 5
      }
    }).then(res => {
      console.log('✅ product 云函数测试成功:', res.result);
    }).catch(err => {
      console.error('❌ product 云函数测试失败:', err);
    });

    // 测试 cart 云函数 - 获取购物车
    wx.cloud.callFunction({
      name: 'cart',
      data: {
        action: 'getCart'
      }
    }).then(res => {
      console.log('✅ cart 云函数测试成功:', res.result);
    }).catch(err => {
      console.error('❌ cart 云函数测试失败:', err);
    });

    // 测试 user 云函数 - 获取用户资料
    wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'getProfile'
      }
    }).then(res => {
      console.log('✅ user 云函数测试成功:', res.result);
    }).catch(err => {
      console.error('❌ user 云函数测试失败:', err);
    });

    // 测试 order 云函数 - 获取订单列表
    wx.cloud.callFunction({
      name: 'order',
      data: {
        action: 'getOrders',
        page: 1,
        pageSize: 5
      }
    }).then(res => {
      console.log('✅ order 云函数测试成功:', res.result);
    }).catch(err => {
      console.error('❌ order 云函数测试失败:', err);
    });

    console.log('🔍 请查看控制台日志确认所有云函数测试结果');
    
    // 等待2秒后初始化数据库数据
    setTimeout(() => {
      this.initDatabaseData();
    }, 2000);
  },

  /**
   * 初始化数据库数据
   */
  initDatabaseData: function() {
    console.log('🗄️ 开始初始化数据库数据...');
    
    // 先检查现有数据
    wx.cloud.callFunction({
      name: 'init',
      data: {
        action: 'checkData'
      }
    }).then(res => {
      console.log('📊 当前数据库状态:', res.result);
      
      if (res.result.success) {
        const { categories, products } = res.result.data;
        
        // 如果没有数据，则初始化
        if (categories === 0 || products === 0) {
          console.log('🚀 检测到数据库为空，开始初始化...');
          
          wx.cloud.callFunction({
            name: 'init',
            data: {
              action: 'initAll'
            }
          }).then(initRes => {
            console.log('✅ 数据库初始化完成:', initRes.result);
            
            if (initRes.result.success) {
              wx.showToast({
                title: '数据初始化完成',
                icon: 'success'
              });
            }
          }).catch(err => {
            console.error('❌ 数据库初始化失败:', err);
          });
        } else {
          console.log('✅ 数据库已有数据，跳过初始化');
        }
      }
         }).catch(err => {
       console.error('❌ 检查数据库状态失败:', err);
     });
     
     // 等待3秒后配置管理员
     setTimeout(() => {
       this.configureAdmin();
     }, 3000);
   },

   /**
    * 配置管理员用户
    */
   configureAdmin: function() {
     console.log('👤 开始配置管理员用户...');
     
     // 获取当前用户的openid
     const openid = wx.getStorageSync('openid');
     if (!openid) {
       console.log('⚠️  未获取到OpenID，请先登录');
       return;
     }
     
     console.log('🔑 当前用户OpenID:', openid);
     
     // 检查是否已经是管理员
     wx.cloud.callFunction({
       name: 'auth',
       data: {
         action: 'checkAdmin'
       }
     }).then(res => {
       console.log('🔍 管理员权限检查结果:', res.result);
       
       if (res.result.success && !res.result.data.isAdmin) {
         console.log('📝 当前用户不是管理员，开始配置...');
         
         // 添加管理员记录
         wx.cloud.database().collection('admin_users').add({
           data: {
             openid: openid,
             nickname: '超级管理员',
             role: 'super_admin',
             permissions: ['all'],
             status: 'active',
             createTime: new Date()
           }
         }).then(addRes => {
           console.log('✅ 管理员配置成功:', addRes);
           wx.showToast({
             title: '管理员配置完成',
             icon: 'success'
           });
           
           // 再次检查管理员权限
           setTimeout(() => {
             this.testAdminFunction();
           }, 1000);
         }).catch(err => {
           console.error('❌ 管理员配置失败:', err);
         });
       } else if (res.result.success && res.result.data.isAdmin) {
         console.log('✅ 当前用户已是管理员');
         this.testAdminFunction();
       }
     }).catch(err => {
       console.error('❌ 检查管理员权限失败:', err);
     });
   },

   /**
    * 测试管理员功能
    */
   testAdminFunction: function() {
     console.log('🔧 测试管理员功能...');
     
     wx.cloud.callFunction({
       name: 'admin',
       data: {
         action: 'getStats'
       }
     }).then(res => {
       console.log('✅ 管理员功能测试成功:', res.result);
       
       if (res.result.success) {
         console.log('📊 系统统计数据:', res.result.data);
         wx.showToast({
           title: '系统配置完成',
           icon: 'success',
           duration: 2000
         });
       }
     }).catch(err => {
       console.error('❌ 管理员功能测试失败:', err);
     });
   },

  /**
   * 开始选择盲盒 - 跳转到盲盒配置页面
   */
  goToBlindboxSelect: function() {
    console.log('开始选择盲盒');
    
    // 跳转到盲盒tab页面
    wx.switchTab({
      url: '/pages/product-detail/product-detail',
      success: () => {
        console.log('成功跳转到盲盒页面');
      },
      fail: (error) => {
        console.log('跳转盲盒页面失败:', error);
        // 如果switchTab失败，尝试使用navigateTo
        wx.navigateTo({
          url: '/pages/product-detail/product-detail'
        });
      }
    });
  }
}); 