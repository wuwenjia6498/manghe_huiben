Page({

  /**
   * 页面的初始数据
   */
  data: {
    addressList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 加载地址列表
    this.loadAddressList();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时重新加载地址列表（可能从编辑页面返回）
    this.loadAddressList();
  },

  /**
   * 加载地址列表
   */
  loadAddressList() {
    let addressList = wx.getStorageSync('addressList') || [];
    
    // 如果没有地址数据，添加示例数据
    if (addressList.length === 0) {
      addressList = [
        {
          id: 1,
          name: '张先生',
          phone: '138****8888',
          detail: '广东省深圳市南山区科技园南区深南大道9988号腾讯大厦',
          isDefault: true
        },
        {
          id: 2,
          name: '李女士',
          phone: '139****9999',
          detail: '北京市朝阳区建国门外大街1号国贸大厦A座',
          isDefault: false
        }
      ];
      wx.setStorageSync('addressList', addressList);
    }

    this.setData({
      addressList: addressList
    });
  },

  /**
   * 返回按钮点击
   */
  onBackTap() {
    console.log('地址管理页面返回按钮被点击');
    
    // 获取当前页面栈
    const pages = getCurrentPages();
    console.log('当前页面栈长度:', pages.length);
    
    // 优先使用原生的返回功能
    if (pages.length > 1) {
      console.log('执行页面返回操作');
      wx.navigateBack({
        delta: 1,
        success: () => {
          console.log('页面返回成功');
        },
        fail: (error) => {
          console.log('页面返回失败:', error);
          console.log('跳转到我的页面');
          // 如果返回失败，跳转到我的页面
          wx.switchTab({
            url: '/pages/profile/profile'
          });
        }
      });
    } else {
      console.log('当前是第一个页面，跳转到我的页面');
      // 如果是第一个页面，跳转到我的页面
      wx.switchTab({
        url: '/pages/profile/profile'
      });
    }
  },

  /**
   * 设置默认地址
   */
  onSetDefault(e) {
    const addressId = e.currentTarget.dataset.id;
    const { addressList } = this.data;
    
    // 更新地址列表
    const updatedList = addressList.map(item => ({
      ...item,
      isDefault: item.id === addressId
    }));
    
    // 保存到存储
    wx.setStorageSync('addressList', updatedList);
    
    // 更新页面数据
    this.setData({
      addressList: updatedList
    });
    
    wx.showToast({
      title: '设置成功',
      icon: 'success'
    });
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
   * 执行删除地址
   */
  deleteAddress(addressId) {
    const { addressList } = this.data;
    const updatedList = addressList.filter(item => item.id !== addressId);
    
    // 如果删除的是默认地址，且还有其他地址，将第一个设为默认
    if (updatedList.length > 0) {
      const hasDefault = updatedList.some(item => item.isDefault);
      if (!hasDefault) {
        updatedList[0].isDefault = true;
      }
    }
    
    // 保存到存储
    wx.setStorageSync('addressList', updatedList);
    
    // 更新页面数据
    this.setData({
      addressList: updatedList
    });
    
    wx.showToast({
      title: '删除成功',
      icon: 'success'
    });
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
  }
}) 