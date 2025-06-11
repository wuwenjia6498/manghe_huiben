Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 当前选中的标签页
    currentTab: 'products',
    
    // 统计数据
    statistics: {
      total: 9,
      active: 7,
      inactive: 2
    },

    // 当前筛选条件
    currentFilter: '',

    // 年龄段数据
    ageGroups: [
      {
        id: 'age_001',
        age_group: '0-3岁',
        icon: '👶',
        label: '萌趣',
        status: 'active',
        skus: [
          {
            id: 'sku_001',
            age_group: '0-3岁',
            condition: '全新',
            book_count: 10,
            price: 30.0,
            stock: 50,
            stock_status: 'normal',
            status: 'active'
          },
          {
            id: 'sku_002',
            age_group: '0-3岁',
            condition: '全新',
            book_count: 20,
            price: 57.0,
            stock: 30,
            stock_status: 'normal',
            status: 'active'
          },
          {
            id: 'sku_003',
            age_group: '0-3岁',
            condition: '九成新',
            book_count: 10,
            price: 24.0,
            stock: 15,
            stock_status: 'low',
            status: 'active'
          }
        ]
      },
      {
        id: 'age_002',
        age_group: '3-6岁',
        icon: '👦',
        label: '推荐',
        status: 'active',
        skus: [
          {
            id: 'sku_004',
            age_group: '3-6岁',
            condition: '全新',
            book_count: 20,
            price: 57.0,
            stock: 40,
            stock_status: 'normal',
            status: 'active'
          },
          {
            id: 'sku_005',
            age_group: '3-6岁',
            condition: '九成新',
            book_count: 20,
            price: 48.0,
            stock: 35,
            stock_status: 'normal',
            status: 'active'
          },
          {
            id: 'sku_006',
            age_group: '3-6岁',
            condition: '七成新',
            book_count: 30,
            price: 54.0,
            stock: 8,
            stock_status: 'low',
            status: 'active'
          }
        ]
      },
      {
        id: 'age_003',
        age_group: '6岁以上',
        icon: '🎓',
        label: '精选',
        status: 'inactive',
        skus: [
          {
            id: 'sku_007',
            age_group: '6岁以上',
            condition: '全新',
            book_count: 30,
            price: 81.0,
            stock: 0,
            stock_status: 'out',
            status: 'inactive'
          },
          {
            id: 'sku_008',
            age_group: '6岁以上',
            condition: '九成新',
            book_count: 20,
            price: 48.0,
            stock: 0,
            stock_status: 'out',
            status: 'inactive'
          }
        ]
      }
    ],

    // 筛选后的年龄段数据
    filteredAgeGroups: [],

    // 编辑弹窗
    showEditModal: false,
    showAddModal: false,
    editForm: {
      id: '',
      ageIndex: 0,
      conditionIndex: 0,
      countIndex: 0,
      price: '',
      stock: '',
      status: 'active'
    },
    addForm: {
      ageIndex: 0,
      conditionIndex: 0,
      countIndex: 0,
      price: '',
      stock: ''
    },

    // 选项数据
    ageGroupOptions: ['0-3岁', '3-6岁', '6岁以上'],
    conditionOptions: ['三成', '五成', '七成', '九成', '全新'],
    countOptions: ['5本装', '10本装', '15本装', '20本装', '25本装', '30本装', '50本装']
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.initializeData();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    wx.setNavigationBarTitle({
      title: '商品管理'
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.refreshStatistics();
  },

  /**
   * 初始化数据
   */
  initializeData() {
    this.filterData();
    this.refreshStatistics();
  },

  /**
   * 筛选数据
   */
  filterData() {
    const { ageGroups, currentFilter } = this.data;
    let filteredAgeGroups = [];

    if (currentFilter === '') {
      // 显示所有年龄段和所有SKU，不管状态如何
      filteredAgeGroups = ageGroups.map(group => ({
        ...group,
        skus: group.skus // 显示所有SKU，不管状态
      }));
    } else if (currentFilter === 'inactive') {
      // 显示包含已下架SKU的年龄段
      filteredAgeGroups = ageGroups.map(group => {
        // 筛选出该年龄段中下架的SKU
        const inactiveSkus = group.skus.filter(sku => sku.status === 'inactive');
        if (inactiveSkus.length > 0) {
          return {
            ...group,
            skus: inactiveSkus
          };
        }
        return null;
      }).filter(group => group !== null);
    } else {
      // 按年龄段筛选，显示该年龄段的所有SKU
      filteredAgeGroups = ageGroups.filter(group => group.age_group === currentFilter);
    }

    // 为每个SKU设置库存状态
    filteredAgeGroups.forEach(group => {
      group.skus.forEach(sku => {
        sku.stock_status = this.getStockStatus(sku.stock);
      });
    });

    this.setData({
      filteredAgeGroups
    });
  },

  /**
   * 获取库存状态
   */
  getStockStatus(stock) {
    if (stock <= 0) return 'out';
    if (stock <= 10) return 'low';
    return 'normal';
  },

  /**
   * 刷新统计数据
   */
  refreshStatistics() {
    const { ageGroups } = this.data;
    let total = 0;
    let active = 0;
    let inactive = 0;

    ageGroups.forEach(group => {
      group.skus.forEach(sku => {
        total++;
        if (sku.status === 'active') {
          active++;
        } else {
          inactive++;
        }
      });
    });

    this.setData({
      statistics: { total, active, inactive }
    });
  },

  /**
   * 筛选条件改变
   */
  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      currentFilter: filter
    });
    this.filterData();
  },

  /**
   * 年龄段开关切换
   */
  onToggleAgeGroup(e) {
    const ageGroup = e.currentTarget.dataset.ageGroup;
    const { value } = e.detail;
    const status = value ? 'active' : 'inactive';

    const { ageGroups } = this.data;
    const updatedAgeGroups = ageGroups.map(group => {
      if (group.age_group === ageGroup) {
        // 如果年龄段被关闭，所有该年龄段的SKU都应该下架
        const updatedSkus = group.skus.map(sku => ({
          ...sku,
          status: status === 'inactive' ? 'inactive' : sku.status
        }));
        return {
          ...group,
          status,
          skus: updatedSkus
        };
      }
      return group;
    });

    this.setData({
      ageGroups: updatedAgeGroups
    });

    this.filterData();
    this.refreshStatistics();

    wx.showToast({
      title: `已${status === 'active' ? '启用' : '禁用'}${ageGroup}商品`,
      icon: 'success'
    });
  },

  /**
   * 编辑SKU
   */
  onEditSku(e) {
    const sku = e.currentTarget.dataset.sku;
    const { ageGroupOptions, conditionOptions, countOptions } = this.data;
    
    // 解析本数
    const countValue = `${sku.book_count}本装`;
    
    this.setData({
      showEditModal: true,
      editForm: {
        id: sku.id,
        ageIndex: ageGroupOptions.indexOf(sku.age_group),
        conditionIndex: conditionOptions.indexOf(sku.condition),
        countIndex: countOptions.indexOf(countValue),
        price: sku.price.toString(),
        stock: sku.stock.toString()
      }
    });
  },

  /**
   * 切换SKU状态
   */
  onToggleSku(e) {
    const sku = e.currentTarget.dataset.sku;
    const newStatus = sku.status === 'active' ? 'inactive' : 'active';
    
    this.updateSkuStatus(sku.id, newStatus);
    
    wx.showToast({
      title: `已${newStatus === 'active' ? '上架' : '下架'}`,
      icon: 'success'
    });
  },

  /**
   * 删除SKU
   */
  onDeleteSku(e) {
    const sku = e.currentTarget.dataset.sku;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除 ${sku.condition} ${sku.book_count}本装 商品吗？删除后无法恢复。`,
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          this.deleteSku(sku.id);
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 删除SKU数据
   */
  deleteSku(skuId) {
    const { ageGroups } = this.data;
    const updatedAgeGroups = ageGroups.map(group => ({
      ...group,
      skus: group.skus.filter(sku => sku.id !== skuId)
    }));

    this.setData({
      ageGroups: updatedAgeGroups
    });

    this.filterData();
    this.refreshStatistics();
  },

  /**
   * 更新SKU库存
   */
  updateSkuStock(skuId, newStock) {
    const { ageGroups } = this.data;
    const updatedAgeGroups = ageGroups.map(group => ({
      ...group,
      skus: group.skus.map(sku => 
        sku.id === skuId ? { ...sku, stock: newStock, stock_status: this.getStockStatus(newStock) } : sku
      )
    }));

    this.setData({
      ageGroups: updatedAgeGroups
    });

    this.filterData();
    this.refreshStatistics();
  },

  /**
   * 更新SKU状态
   */
  updateSkuStatus(skuId, newStatus) {
    const { ageGroups } = this.data;
    const updatedAgeGroups = ageGroups.map(group => ({
      ...group,
      skus: group.skus.map(sku => 
        sku.id === skuId ? { ...sku, status: newStatus } : sku
      )
    }));

    this.setData({
      ageGroups: updatedAgeGroups
    });

    this.filterData();
    this.refreshStatistics();
  },

  /**
   * 添加商品
   */
  onAddProduct() {
    console.log('添加商品按钮被点击');
    this.setData({
      showAddModal: true,
      addForm: {
        ageIndex: 0,
        conditionIndex: 0,
        countIndex: 0,
        price: '',
        stock: ''
      }
    });
  },

  /**
   * 关闭编辑弹窗
   */
  onCloseEditModal() {
    this.setData({
      showEditModal: false
    });
  },

  /**
   * 关闭添加弹窗
   */
  onCloseAddModal() {
    console.log('关闭添加弹窗');
    this.setData({
      showAddModal: false
    });
  },

  /**
   * 阻止冒泡
   */
  stopPropagation() {
    // 阻止事件冒泡
  },

  /**
   * 年龄段选择改变
   */
  onAgeChange(e) {
    this.setData({
      'editForm.ageIndex': e.detail.value
    });
  },

  /**
   * 成色选择改变
   */
  onConditionChange(e) {
    this.setData({
      'editForm.conditionIndex': e.detail.value
    });
  },

  /**
   * 本数选择改变
   */
  onCountChange(e) {
    this.setData({
      'editForm.countIndex': e.detail.value
    });
  },

  /**
   * 价格输入
   */
  onPriceInput(e) {
    this.setData({
      'editForm.price': e.detail.value
    });
  },

  /**
   * 库存输入
   */
  onStockInput(e) {
    this.setData({
      'editForm.stock': e.detail.value
    });
  },

  /**
   * 保存编辑
   */
  onSaveEdit() {
    const { editForm, ageGroupOptions, conditionOptions, countOptions } = this.data;
    
    // 验证表单
    if (!editForm.price || !editForm.stock) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    const price = parseFloat(editForm.price);
    const stock = parseInt(editForm.stock);

    if (isNaN(price) || price <= 0) {
      wx.showToast({
        title: '请输入有效价格',
        icon: 'none'
      });
      return;
    }

    if (isNaN(stock) || stock < 0) {
      wx.showToast({
        title: '请输入有效库存',
        icon: 'none'
      });
      return;
    }

    // 解析本数
    const countText = countOptions[editForm.countIndex];
    const bookCount = parseInt(countText.replace('本装', ''));

    // 更新SKU数据
    const { ageGroups } = this.data;
    const updatedAgeGroups = ageGroups.map(group => ({
      ...group,
      skus: group.skus.map(sku => {
        if (sku.id === editForm.id) {
          return {
            ...sku,
            age_group: ageGroupOptions[editForm.ageIndex],
            condition: conditionOptions[editForm.conditionIndex],
            book_count: bookCount,
            price,
            stock,
            stock_status: this.getStockStatus(stock)
          };
        }
        return sku;
      })
    }));

    this.setData({
      ageGroups: updatedAgeGroups,
      showEditModal: false
    });

    this.filterData();
    this.refreshStatistics();

    wx.showToast({
      title: '修改成功',
      icon: 'success'
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.refreshStatistics();
    this.filterData();
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
      title: '绘本盲盒 - 商品管理',
      path: '/pages/admin-products/admin-products'
    };
  },

  /**
   * 底部导航切换
   */
  onTabSwitch(e) {
    console.log('商品页底部导航被点击', e.currentTarget.dataset);
    const tab = e.currentTarget.dataset.tab;
    
    console.log('当前点击的tab:', tab);
    
    // 如果点击的是当前页面，不做处理
    if (tab === 'products') {
      console.log('当前已在商品页面，不跳转');
      return;
    }

    // 根据选择的tab跳转到对应页面
    const tabRoutes = {
      'home': '/pages/admin/admin',
      'orders': '/pages/admin-orders/admin-orders',
      'users': '/pages/admin-users/admin-users',
      'settings': '/pages/admin-settings/admin-settings'
    };

    if (tabRoutes[tab]) {
      console.log('准备跳转到:', tabRoutes[tab]);
      wx.redirectTo({
        url: tabRoutes[tab]
      });
    } else {
      console.log('未找到对应的路由');
    }
  },

  /**
   * 添加商品年龄段选择改变
   */
  onAddAgeChange(e) {
    console.log('年龄段选择改变:', e.detail.value);
    this.setData({
      'addForm.ageIndex': e.detail.value
    });
  },

  /**
   * 添加商品成色选择改变
   */
  onAddConditionChange(e) {
    console.log('成色选择改变:', e.detail.value);
    this.setData({
      'addForm.conditionIndex': e.detail.value
    });
  },

  /**
   * 添加商品本数选择改变
   */
  onAddCountChange(e) {
    console.log('本数选择改变:', e.detail.value);
    this.setData({
      'addForm.countIndex': e.detail.value
    });
  },

  /**
   * 添加商品价格输入
   */
  onAddPriceInput(e) {
    console.log('价格输入:', e.detail.value);
    this.setData({
      'addForm.price': e.detail.value
    });
  },

  /**
   * 添加商品库存输入
   */
  onAddStockInput(e) {
    console.log('库存输入:', e.detail.value);
    this.setData({
      'addForm.stock': e.detail.value
    });
  },

  /**
   * 保存新商品
   */
  onSaveAdd() {
    console.log('保存新商品按钮被点击');
    const { addForm, ageGroupOptions, conditionOptions, countOptions } = this.data;
    
    // 验证表单
    if (!addForm.price || !addForm.stock) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    const price = parseFloat(addForm.price);
    const stock = parseInt(addForm.stock);

    if (isNaN(price) || price <= 0) {
      wx.showToast({
        title: '请输入有效价格',
        icon: 'none'
      });
      return;
    }

    if (isNaN(stock) || stock < 0) {
      wx.showToast({
        title: '请输入有效库存',
        icon: 'none'
      });
      return;
    }

    // 解析数据
    const ageGroup = ageGroupOptions[addForm.ageIndex];
    const condition = conditionOptions[addForm.conditionIndex];
    const countText = countOptions[addForm.countIndex];
    const bookCount = parseInt(countText.replace('本装', ''));

    // 生成新的SKU ID
    const { ageGroups } = this.data;
    let maxId = 0;
    ageGroups.forEach(group => {
      group.skus.forEach(sku => {
        const id = parseInt(sku.id.replace('sku_', ''));
        if (id > maxId) maxId = id;
      });
    });
    const newSkuId = `sku_${String(maxId + 1).padStart(3, '0')}`;

    // 创建新SKU
    const newSku = {
      id: newSkuId,
      age_group: ageGroup,
      condition,
      book_count: bookCount,
      price,
      stock,
      stock_status: this.getStockStatus(stock),
      status: 'active'
    };

    // 添加到对应年龄段
    const updatedAgeGroups = ageGroups.map(group => {
      if (group.age_group === ageGroup) {
        return {
          ...group,
          skus: [...group.skus, newSku]
        };
      }
      return group;
    });

    this.setData({
      ageGroups: updatedAgeGroups,
      showAddModal: false
    });

    this.filterData();
    this.refreshStatistics();

    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  },
}); 