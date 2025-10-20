Page({

  /**
   * 页面的初始数据
   */
  data: {
    addressList: [],
    fromOrder: false // 是否从订单页面进入
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查是否从订单页面进入
    if (options.from === 'order') {
      this.setData({
        fromOrder: true
      });
    }
    
    // 首次加载地址列表
    this.loadAddressList();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时重新加载地址列表（避免显示缓存数据）
    this.loadAddressList();
  },

  /**
   * 加载地址列表（从云数据库）
   */
  async loadAddressList() {
    wx.showLoading({
      title: '加载中...'
    });

    try {
      const res = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'getAddresses'
        }
      });

      wx.hideLoading();

      if (res.result && res.result.success) {
        const addressList = res.result.data || [];
        this.setData({
          addressList: addressList
        });
      } else {
        throw new Error(res.result.message || '加载地址失败');
      }
    } catch (error) {
      wx.hideLoading();
      console.error('加载地址列表失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 返回按钮点击
   */
  onBackTap() {
    const pages = getCurrentPages();
    
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          wx.switchTab({
            url: '/pages/profile/profile'
          });
        }
      });
    } else {
      wx.switchTab({
        url: '/pages/profile/profile'
      });
    }
  },

  /**
   * 设置默认地址（云端）
   */
  async onSetDefault(e) {
    const addressId = e.currentTarget.dataset.id;
    
    wx.showLoading({
      title: '设置中...'
    });

    try {
      const res = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'setDefaultAddress',
          addressId: addressId
        }
      });

      wx.hideLoading();

      if (res.result && res.result.success) {
        wx.showToast({
          title: '设置成功',
          icon: 'success'
        });
        // 重新加载地址列表
        this.loadAddressList();
      } else {
        throw new Error(res.result.message || '设置失败');
      }
    } catch (error) {
      wx.hideLoading();
      console.error('设置默认地址失败:', error);
      wx.showToast({
        title: '设置失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 添加新地址
   */
  onAddAddress() {
    wx.navigateTo({
      url: '/pages/address-edit/address-edit?mode=add'
    });
  },

  /**
   * 编辑地址
   */
  onEditAddress(e) {
    const address = e.currentTarget.dataset.address;
    const addressData = encodeURIComponent(JSON.stringify(address));
    
    wx.navigateTo({
      url: `/pages/address-edit/address-edit?mode=edit&addressData=${addressData}`
    });
  },

  /**
   * 删除地址
   */
  onDeleteAddress(e) {
    const addressId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个收货地址吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteAddress(addressId);
        }
      }
    });
  },

  /**
   * 执行删除地址（云端）
   */
  async deleteAddress(addressId) {
    wx.showLoading({
      title: '删除中...'
    });

    try {
      const res = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'deleteAddress',
          addressId: addressId
        }
      });

      wx.hideLoading();

      if (res.result && res.result.success) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        // 重新加载地址列表
        await this.loadAddressList();
      } else {
        throw new Error(res.result.message || '删除失败');
      }
    } catch (error) {
      wx.hideLoading();
      console.error('删除地址失败:', error);
      wx.showToast({
        title: '删除失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

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
    this.loadAddressList();
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
      title: '收货地址管理 - 绘本盲盒',
      path: '/pages/address/address'
    };
  },

  /**
   * 选择地址（从订单页面进入时使用）
   */
  onSelectAddress(e) {
    if (!this.data.fromOrder) {
      return;
    }
    
    const address = e.currentTarget.dataset.address;
    
    if (!address) {
      wx.showToast({
        title: '地址数据错误',
        icon: 'error'
      });
      return;
    }
    
    // 将选中的地址保存到全局存储
    wx.setStorageSync('selectedAddress', address);
    
    // 返回订单页面
    wx.navigateBack();
  }
}) 