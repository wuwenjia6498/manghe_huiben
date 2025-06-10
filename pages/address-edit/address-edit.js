Page({

  /**
   * 页面的初始数据
   */
  data: {
    mode: 'add', // add: 添加, edit: 编辑
    primaryColor: '#EF5BA6',
    formData: {
      id: null,
      name: '',
      phone: '',
      region: '',
      detailAddress: '',
      isDefault: false
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const { mode, addressData } = options;
    
    this.setData({
      mode: mode || 'add'
    });

    // 如果是编辑模式，加载地址数据
    if (mode === 'edit' && addressData) {
      try {
        const address = JSON.parse(decodeURIComponent(addressData));
        this.setData({
          formData: {
            id: address.id,
            name: address.name,
            phone: address.phone,
            region: this.extractRegion(address.detail),
            detailAddress: this.extractDetailAddress(address.detail),
            isDefault: address.isDefault
          }
        });
      } catch (error) {
        console.error('解析地址数据失败:', error);
        wx.showToast({
          title: '地址信息加载失败',
          icon: 'error'
        });
      }
    }
  },

  /**
   * 从完整地址中提取地区信息（简化处理）
   */
  extractRegion(fullAddress) {
    // 简化处理，实际应用中需要更复杂的地址解析
    const match = fullAddress.match(/^(.+?省|.+?市|.+?区|.+?县)/);
    return match ? match[1] : '';
  },

  /**
   * 从完整地址中提取详细地址
   */
  extractDetailAddress(fullAddress) {
    // 简化处理，移除前面的省市区信息
    return fullAddress.replace(/^(.+?省|.+?市|.+?区|.+?县)/, '');
  },

  /**
   * 返回按钮点击
   */
  onBackTap() {
    console.log('地址编辑页面返回按钮被点击');
    wx.navigateBack({
      success: () => {
        console.log('页面返回成功');
      },
      fail: (error) => {
        console.log('页面返回失败:', error);
        wx.navigateTo({
          url: '/pages/address/address'
        });
      }
    });
  },

  /**
   * 收货人姓名输入
   */
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    });
  },

  /**
   * 手机号输入
   */
  onPhoneInput(e) {
    this.setData({
      'formData.phone': e.detail.value
    });
  },

  /**
   * 详细地址输入
   */
  onDetailAddressInput(e) {
    this.setData({
      'formData.detailAddress': e.detail.value
    });
  },

  /**
   * 选择地区
   */
  onSelectLocation() {
    // 简化实现，实际应用中应该调用地址选择组件
    wx.showActionSheet({
      itemList: [
        '广东省深圳市南山区',
        '北京市朝阳区',
        '上海市浦东新区',
        '江苏省南京市鼓楼区',
        '浙江省杭州市西湖区'
      ],
      success: (res) => {
        const regions = [
          '广东省深圳市南山区',
          '北京市朝阳区',
          '上海市浦东新区',
          '江苏省南京市鼓楼区',
          '浙江省杭州市西湖区'
        ];
        
        this.setData({
          'formData.region': regions[res.tapIndex]
        });
      }
    });
  },

  /**
   * 切换默认地址
   */
  onToggleDefault() {
    this.setData({
      'formData.isDefault': !this.data.formData.isDefault
    });
  },

  /**
   * 默认地址开关变化
   */
  onDefaultChange(e) {
    this.setData({
      'formData.isDefault': e.detail.value
    });
  },

  /**
   * 保存地址
   */
  onSaveAddress() {
    const { formData, mode } = this.data;
    
    // 表单验证
    if (!this.validateForm()) {
      return;
    }

    // 获取现有地址列表
    let addressList = wx.getStorageSync('addressList') || [];
    
    if (mode === 'add') {
      // 添加新地址
      const newAddress = {
        id: Date.now(),
        name: formData.name,
        phone: formData.phone,
        detail: `${formData.region}${formData.detailAddress}`,
        isDefault: formData.isDefault
      };

      // 如果设为默认，将其他地址的默认状态取消
      if (formData.isDefault) {
        addressList = addressList.map(item => ({
          ...item,
          isDefault: false
        }));
      }

      addressList.push(newAddress);
      
    } else {
      // 编辑现有地址
      addressList = addressList.map(item => {
        if (item.id === formData.id) {
          return {
            ...item,
            name: formData.name,
            phone: formData.phone,
            detail: `${formData.region}${formData.detailAddress}`,
            isDefault: formData.isDefault
          };
        }
        // 如果当前地址设为默认，将其他地址的默认状态取消
        if (formData.isDefault) {
          return {
            ...item,
            isDefault: false
          };
        }
        return item;
      });
    }

    // 保存到存储
    wx.setStorageSync('addressList', addressList);

    wx.showToast({
      title: mode === 'add' ? '添加成功' : '保存成功',
      icon: 'success',
      success: () => {
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    });
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { formData } = this.data;
    
    if (!formData.name.trim()) {
      wx.showToast({
        title: '请输入收货人姓名',
        icon: 'none'
      });
      return false;
    }

    if (!formData.phone.trim()) {
      wx.showToast({
        title: '请输入手机号码',
        icon: 'none'
      });
      return false;
    }

    // 手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      wx.showToast({
        title: '请输入正确的手机号码',
        icon: 'none'
      });
      return false;
    }

    if (!formData.region) {
      wx.showToast({
        title: '请选择所在地区',
        icon: 'none'
      });
      return false;
    }

    if (!formData.detailAddress.trim()) {
      wx.showToast({
        title: '请输入详细地址',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

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
      title: '地址编辑 - 绘本盲盒',
      path: '/pages/address-edit/address-edit'
    };
  }
}) 