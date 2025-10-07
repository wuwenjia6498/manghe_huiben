// pages/cart/cart.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    cartList: [],
    isAllSelected: false,
    selectedCount: 0,
    totalPrice: 0,
    isLoggedIn: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取系统信息，设置状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 20;
    wx.setStorageSync('statusBarHeight', statusBarHeight);
    
    this.loadCartData();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    wx.setNavigationBarTitle({
      title: '购物车'
    });
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
    this.loadCartData();
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
      title: '绘本盲盒购物车 - 精选优质绘本',
      path: '/pages/cart/cart'
    };
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const loginInfo = wx.getStorageSync('loginInfo');
    const isLoggedIn = loginInfo && loginInfo.isLoggedIn;
    
    this.setData({
      isLoggedIn: isLoggedIn
    });
    
    if (!isLoggedIn) {
      // 未登录，清空购物车数据
      this.setData({
        cartList: []
      });
      this.calculateTotal();
      return false;
    }
    
    // 已登录，加载购物车数据
    this.loadCartData();
    return true;
  },

  /**
   * 显示登录提示
   */
  showLoginTip() {
    wx.showModal({
      title: '需要登录',
      content: '购物车功能需要登录后使用，是否立即登录？',
      success: (res) => {
        if (res.confirm) {
          this.performLogin();
        }
      }
    });
  },

  /**
   * 执行登录操作
   */
  performLogin() {
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
            
            // 更新当前页面状态
            this.setData({
              isLoggedIn: true
            });
            
            // 重新加载购物车数据
            this.loadCartData();
            
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
   * 加载购物车数据
   */
  loadCartData() {
    let cart = wx.getStorageSync('cart') || [];
    
    // 确保每个商品都有必要的字段
    cart = cart.map(item => {
      // 确保有选中状态
      if (item.selected === undefined) {
        item.selected = false;
      }
      
      // 确保有id字段，如果没有则使用productId
      if (!item.id && item.productId) {
        item.id = item.productId;
      }
      
      // 计算平均价格
      if (!item.averagePrice && item.price && item.count) {
        item.averagePrice = (item.price / item.count).toFixed(2);
      }
      
      // 确保有描述字段
      if (!item.description) {
        item.description = '精选推荐';
      }
      
      return item;
    });

    this.setData({
      cartList: cart
    });

    this.calculateTotal();
  },

  /**
   * 计算总价和选中数量
   */
  calculateTotal() {
    const { cartList } = this.data;
    let selectedCount = 0;
    let totalPrice = 0;
    let allSelected = true;

    cartList.forEach(item => {
      if (item.selected) {
        selectedCount += item.quantity;
        totalPrice += item.price * item.quantity;
      } else {
        allSelected = false;
      }
    });

    // 如果购物车为空，allSelected应该为false
    if (cartList.length === 0) {
      allSelected = false;
    }

    this.setData({
      selectedCount,
      totalPrice,
      isAllSelected: allSelected
    });

    // 更新tabBar徽章
    this.updateTabBarBadge();
  },

  /**
   * 更新tabBar徽章
   */
  updateTabBarBadge() {
    const { cartList } = this.data;
    const totalItems = cartList.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalItems > 0) {
      wx.setTabBarBadge({
        index: 2, // 购物车tab索引
        text: totalItems.toString()
      });
    } else {
      wx.removeTabBarBadge({
        index: 2
      });
    }
  },

  /**
   * 保存购物车数据
   */
  saveCartData() {
    wx.setStorageSync('cart', this.data.cartList);
    wx.setStorageSync('cartCount', this.data.cartList.length);
  },

  /**
   * 返回按钮点击
   */
  onBackTap() {
    wx.switchTab({
      url: '/pages/home/home'
    });
  },

  /**
   * 删除模式切换
   */
  onDeleteModeTap() {
    wx.showActionSheet({
      itemList: ['清空购物车'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.clearCart();
        }
      }
    });
  },

  /**
   * 清空购物车
   */
  clearCart() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            cartList: []
          });
          this.saveCartData();
          this.calculateTotal();
          wx.showToast({
            title: '已清空购物车',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 选择商品
   */
  onSelectItem(e) {
    if (!this.checkLoginStatus()) {
      this.showLoginTip();
      return;
    }
    
    const index = e.currentTarget.dataset.index;
    const cartList = this.data.cartList;
    
    cartList[index].selected = !cartList[index].selected;
    
    this.setData({
      cartList
    });
    
    this.calculateTotal();
    this.saveCartData();
  },

  /**
   * 全选/取消全选
   */
  onSelectAll() {
    if (!this.checkLoginStatus()) {
      this.showLoginTip();
      return;
    }
    
    const { cartList, isAllSelected } = this.data;
    const newSelectState = !isAllSelected;
    
    cartList.forEach(item => {
      item.selected = newSelectState;
    });
    
    this.setData({
      cartList
    });
    
    this.calculateTotal();
    this.saveCartData();
  },

  /**
   * 增加数量
   */
  onIncreaseQuantity(e) {
    if (!this.checkLoginStatus()) {
      this.showLoginTip();
      return;
    }
    
    const index = e.currentTarget.dataset.index;
    const cartList = this.data.cartList;
    
    cartList[index].quantity += 1;
    
    this.setData({
      cartList
    });
    
    this.calculateTotal();
    this.saveCartData();
  },

  /**
   * 减少数量
   */
  onDecreaseQuantity(e) {
    if (!this.checkLoginStatus()) {
      this.showLoginTip();
      return;
    }
    
    const index = e.currentTarget.dataset.index;
    const cartList = this.data.cartList;
    
    if (cartList[index].quantity > 1) {
      cartList[index].quantity -= 1;
      
      this.setData({
        cartList
      });
      
      this.calculateTotal();
      this.saveCartData();
    }
  },

  /**
   * 删除商品
   */
  onDeleteItem(e) {
    if (!this.checkLoginStatus()) {
      this.showLoginTip();
      return;
    }
    
    const index = e.currentTarget.dataset.index;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个商品吗？',
      success: (res) => {
        if (res.confirm) {
          const cartList = this.data.cartList;
          cartList.splice(index, 1);
          
          this.setData({
            cartList
          });
          
          this.calculateTotal();
          this.saveCartData();
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 去首页
   */
  onGoToHome() {
    wx.switchTab({
      url: '/pages/home/home'
    });
  },

  /**
   * 去选择盲盒
   */
  onGoToBlindbox() {
    console.log('点击选择盲盒按钮');
    
    wx.switchTab({
      url: '/pages/product-detail/product-detail',
      success: () => {
        console.log('跳转到商品详情页成功');
      },
      fail: (error) => {
        console.error('跳转到商品详情页失败:', error);
        wx.showToast({
          title: '跳转失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 去结算
   */
  onCheckout() {
    if (!this.checkLoginStatus()) {
      this.showLoginTip();
      return;
    }
    
    const { cartList, selectedCount } = this.data;
    
    if (selectedCount === 0) {
      wx.showToast({
        title: '请选择要结算的商品',
        icon: 'none'
      });
      return;
    }
    
    // 获取选中的商品
    const selectedItems = cartList.filter(item => item.selected);
    
    // 保存订单数据
    wx.setStorageSync('orderData', selectedItems);
    
    // 跳转到订单确认页
    wx.navigateTo({
      url: '/pages/order/order?type=cart'
    });
  }
})