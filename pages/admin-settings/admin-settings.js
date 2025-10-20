// pages/admin-settings/admin-settings.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 'settings',
    
    // 选择器选项
    shippingTimeOptions: ['24小时内发货', '48小时内发货', '72小时内发货', '7天内发货'],
    deliveryCompanyOptions: ['顺丰速运', '中通快递', '圆通速递', '申通快递', '韵达快递', '公司配送人员'],
    
    // 设置数据
    settings: {
      // 配送设置
      deliveryFee: '0',
      freeShippingThreshold: '50',
      shippingTimeIndex: 1,
      deliveryCompanyIndex: 0,
      
      // 门店自取
      storePickupEnabled: true,
      storeName: '八爪鱼绘本馆',
      storePhone: '0574-87343774',
      storeAddress: '宁波市海曙区文化路12号',
      
      // 价格设置
      firstOrderDiscountEnabled: true,
      firstOrderDiscount: '10',
      shareCouponEnabled: true,
      shareCouponAmount: '5',
      fullReductionEnabled: true,
      fullReductionThreshold: '100',
      fullReductionAmount: '15',
      
      // 系统配置
      customerServiceWechat: 'pictureboxes',
      customerServicePhone: '0574-87345055',
      serviceTime: '9:00-21:00',
      returnPolicy: '盲盒商品不支持退换货，请谨慎下单。',
      systemNoticeEnabled: true,
      systemNotice: '🎉 欢迎来到八爪鱼绘本馆！首单立减10元，分享得5元券！'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    // 检查管理员权限
    const hasPermission = await this.checkAdminPermission();
    if (!hasPermission) {
      wx.showModal({
        title: '权限不足',
        content: '您没有管理员权限，无法访问此页面',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }
    
    this.loadSettings();
  },

  /**
   * 检查管理员权限
   */
  async checkAdminPermission() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'auth',
        data: {
          action: 'checkAdmin'
        }
      });

      console.log('权限检查结果:', res);
      
      if (res.result && res.result.success) {
        return true;
      } else {
        console.log('管理员权限验证失败:', res.result && res.result.message);
        return false;
      }
    } catch (error) {
      console.error('权限检查失败:', error);
      return false;
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    wx.setNavigationBarTitle({
      title: '系统设置'
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

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
    this.loadSettings();
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

  },

  /**
   * 加载设置数据
   */
  async loadSettings() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'admin',
        data: {
          action: 'getSettings'
        }
      });

      if (res.result.success && res.result.data) {
        this.setData({
          settings: res.result.data
        });
        
        // 更新本地存储
        wx.setStorageSync('adminSettings', res.result.data);
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  },

  /**
   * 输入框变化处理
   */
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`settings.${field}`]: value
    });
    
    console.log('设置项变化:', field, value);
  },

  /**
   * 开关变化处理
   */
  onSwitchChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`settings.${field}`]: value
    });
    
    console.log('开关变化:', field, value);
  },

  /**
   * 选择器变化处理
   */
  onPickerChange(e) {
    const field = e.currentTarget.dataset.field;
    const index = e.detail.value;
    
    if (field === 'shippingTime') {
      this.setData({
        'settings.shippingTimeIndex': index
      });
    } else if (field === 'deliveryCompany') {
      this.setData({
        'settings.deliveryCompanyIndex': index
      });
    }
    
    console.log('选择器变化:', field, index);
  },

  /**
   * 返回按钮
   */
  onBack() {
    wx.navigateBack();
  },

  /**
   * 保存设置
   */
  async saveSettings() {
    const { settings } = this.data;
    
    console.log('准备保存设置:', settings);
    
    wx.showLoading({
      title: '保存中...'
    });

    try {
      const res = await wx.cloud.callFunction({
        name: 'admin',
        data: {
          action: 'updateSettings',
          settings: settings
        }
      });

      console.log('云函数调用结果:', res);
      wx.hideLoading();

      if (res.result && res.result.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
        
        // 更新本地存储
        wx.setStorageSync('adminSettings', settings);
        console.log('设置已保存到本地存储');
      } else {
        console.error('保存失败:', res.result);
        wx.showToast({
          title: (res.result && res.result.message) || '保存失败',
          icon: 'error'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('保存设置异常:', error);
      
      // 显示更详细的错误信息
      let errorMessage = '网络错误';
      if (error.errMsg) {
        errorMessage = error.errMsg;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      wx.showModal({
        title: '保存失败',
        content: `错误详情: ${errorMessage}`,
        showCancel: false
      });
    }
  },

  /**
   * 重置设置
   */
  onReset() {
    wx.showModal({
      title: '重置确认',
      content: '确定要重置所有设置为默认值吗？',
      success: (res) => {
        if (res.confirm) {
          this.resetSettings();
        }
      }
    });
  },

  /**
   * 重置为默认设置
   */
  resetSettings() {
    this.setData({
      settings: {
        // 配送设置
        deliveryFee: '0',
        freeShippingThreshold: '50',
        shippingTimeIndex: 1,
        deliveryCompanyIndex: 0,
        
        // 门店自取
        storePickupEnabled: true,
        storeName: '八爪鱼绘本馆',
        storePhone: '0574-87343774',
        storeAddress: '宁波市海曙区文化路12号',
        
        // 价格设置
        firstOrderDiscountEnabled: true,
        firstOrderDiscount: '10',
        shareCouponEnabled: true,
        shareCouponAmount: '5',
        fullReductionEnabled: true,
        fullReductionThreshold: '100',
        fullReductionAmount: '15',
        
        // 系统配置
        customerServiceWechat: 'pictureboxes',
        customerServicePhone: '0574-87345055',
        serviceTime: '9:00-21:00',
        returnPolicy: '盲盒商品不支持退换货，请谨慎下单。',
        systemNoticeEnabled: true,
        systemNotice: '🎉 欢迎来到八爪鱼绘本馆！首单立减10元，分享得5元券！'
      }
    });
    
    wx.showToast({
      title: '已重置为默认设置',
      icon: 'success'
    });
  },

  /**
   * 验证设置数据
   */
  validateSettings() {
    const { settings } = this.data;
    const errors = [];
    
    // 验证配送费用
    if (settings.deliveryFee && isNaN(Number(settings.deliveryFee))) {
      errors.push('配送费用必须是数字');
    }
    
    // 验证免邮门槛
    if (settings.freeShippingThreshold && isNaN(Number(settings.freeShippingThreshold))) {
      errors.push('免邮门槛必须是数字');
    }
    
    // 验证门店信息
    if (settings.storePickupEnabled) {
      if (!settings.storeName.trim()) {
        errors.push('门店名称不能为空');
      }
      if (!settings.storePhone.trim()) {
        errors.push('联系电话不能为空');
      }
    }
    
    // 验证价格设置
    if (settings.firstOrderDiscountEnabled && !settings.firstOrderDiscount.trim()) {
      errors.push('首单优惠金额不能为空');
    }
    
    if (settings.shareCouponEnabled && !settings.shareCouponAmount.trim()) {
      errors.push('分享优惠券金额不能为空');
    }
    
    return errors;
  },

  /**
   * 预览设置效果
   */
  onPreview() {
    const { settings } = this.data;
    
    let previewText = '当前设置预览：\n\n';
    
    // 配送设置预览
    previewText += `📦 配送设置\n`;
    previewText += `配送费：${settings.deliveryFee || '0'}元\n`;
    previewText += `免邮门槛：${settings.freeShippingThreshold}元\n`;
    previewText += `发货时间：${this.data.shippingTimeOptions[settings.shippingTimeIndex]}\n\n`;
    
    // 门店自取预览
    if (settings.storePickupEnabled) {
      previewText += `🏪 门店自取\n`;
      previewText += `门店：${settings.storeName}\n`;
      previewText += `电话：${settings.storePhone}\n\n`;
    }
    
    // 价格设置预览
    previewText += `💰 优惠活动\n`;
    if (settings.firstOrderDiscountEnabled) {
      previewText += `首单立减：${settings.firstOrderDiscount}元\n`;
    }
    if (settings.shareCouponEnabled) {
      previewText += `分享得券：${settings.shareCouponAmount}元\n`;
    }
    if (settings.fullReductionEnabled) {
      previewText += `满减活动：满${settings.fullReductionThreshold}元减${settings.fullReductionAmount}元\n`;
    }
    
    wx.showModal({
      title: '设置预览',
      content: previewText,
      showCancel: false
    });
  },

  /**
   * 保存设置
   */
  onSave() {
    const { settings } = this.data;
    
    // 验证必填项
    if (!settings.storeName && settings.storePickupEnabled) {
      wx.showToast({
        title: '请填写门店名称',
        icon: 'none'
      });
      return;
    }
    
    if (!settings.storePhone && settings.storePickupEnabled) {
      wx.showToast({
        title: '请填写联系电话',
        icon: 'none'
      });
      return;
    }
    
    // 验证数字格式
    if (settings.deliveryFee && isNaN(Number(settings.deliveryFee))) {
      wx.showToast({
        title: '配送费用格式错误',
        icon: 'none'
      });
      return;
    }
    
    if (settings.freeShippingThreshold && isNaN(Number(settings.freeShippingThreshold))) {
      wx.showToast({
        title: '免邮门槛格式错误',
        icon: 'none'
      });
      return;
    }

    // 显示保存确认
    wx.showModal({
      title: '保存确认',
      content: '确定要保存当前设置吗？',
      success: (res) => {
        if (res.confirm) {
          this.saveSettings();
        }
      }
    });
  },

  /**
   * 底部导航切换
   */
  onTabSwitch(e) {
    console.log('设置页底部导航被点击', e.currentTarget.dataset);
    const tab = e.currentTarget.dataset.tab;
    
    console.log('当前点击的tab:', tab);
    
    if (tab === 'settings') {
      console.log('当前已在设置页面，不跳转');
      return;
    }

    const tabRoutes = {
      'home': '/pages/admin/admin',
      'products': '/pages/admin-products/admin-products',
      'orders': '/pages/admin-orders/admin-orders',
      'users': '/pages/admin-users/admin-users'
    };

    if (tabRoutes[tab]) {
      console.log('准备跳转到:', tabRoutes[tab]);
      wx.redirectTo({
        url: tabRoutes[tab]
      });
    } else {
      console.log('未找到对应的路由');
    }
  }
})