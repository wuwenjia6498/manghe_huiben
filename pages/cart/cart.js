// pages/cart/cart.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    cartList: [],
    isAllSelected: false,
    selectedCount: 0,
    totalPrice: 0
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
    this.loadCartData();
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
   * 加载购物车数据
   */
  loadCartData() {
    let cart = wx.getStorageSync('cart') || [];
    
    // 添加一些示例数据用于演示（实际项目中从本地存储或服务器获取）
    if (cart.length === 0) {
      cart = [
        {
          id: 1,
          productId: 1,
          name: '3-6岁绘本盲盒·九成新',
          age: '3-6岁',
          condition: '九成新',
          count: 30,
          price: 54,
          quantity: 1,
          selected: false,
          coverUrl: 'https://picsum.photos/200/150?random=1',
          averagePrice: '1.8',
          description: '超值推荐'
        },
        {
          id: 2,
          productId: 2,
          name: '0-3岁绘本盲盒·七成新',
          age: '0-3岁',
          condition: '七成新',
          count: 20,
          price: 30,
          quantity: 2,
          selected: true,
          coverUrl: 'https://picsum.photos/200/150?random=2',
          averagePrice: '1.5',
          description: '启蒙精选'
        },
        {
          id: 3,
          productId: 3,
          name: '6岁以上绘本盲盒·九成新',
          age: '6岁以上',
          condition: '九成新',
          count: 20,
          price: 45,
          quantity: 1,
          selected: true,
          coverUrl: 'https://picsum.photos/200/150?random=3',
          averagePrice: '2.25',
          description: '进阶精选'
        }
      ];
    }

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
   * 选择/取消选择商品
   */
  onSelectItem(e) {
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
   * 增加商品数量
   */
  onIncreaseQuantity(e) {
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
   * 减少商品数量
   */
  onDecreaseQuantity(e) {
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
    const index = e.currentTarget.dataset.index;
    const item = this.data.cartList[index];
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${item.name}"吗？`,
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
            title: '已删除',
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
    wx.switchTab({
      url: '/pages/product-detail/product-detail'
    });
  },

  /**
   * 去结算
   */
  onCheckout() {
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