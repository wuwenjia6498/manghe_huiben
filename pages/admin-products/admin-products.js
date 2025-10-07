Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 当前选中的标签页
    currentTab: 'products',
    
    // 统计数据
    statistics: {
      total: 0,
      active: 0,
      inactive: 0
    },

    // 当前筛选条件
    currentFilter: '',

    // 搜索关键词
    searchKeyword: '',

    // 年龄段数据（将从数据库加载）
    ageGroups: [],

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
    ageGroupOptions: ['0-3岁', '3-6岁', '6-12岁'],
    conditionOptions: ['全新', '九成新', '七成新', '五成新'],
    countOptions: ['5本装', '10本装', '15本装', '20本装', '30本装', '50本装'],
    
    // 加载状态
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadProductsFromDatabase();
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
    const { ageGroups, currentFilter, searchKeyword } = this.data;
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

    // 如果有搜索关键词，进行搜索过滤
    if (searchKeyword && searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      filteredAgeGroups = filteredAgeGroups.map(group => {
        // 检查年龄段是否匹配
        const ageMatch = group.age_group.toLowerCase().includes(keyword);
        
        // 筛选匹配的SKU
        const matchedSkus = group.skus.filter(sku => {
          const conditionMatch = sku.condition.toLowerCase().includes(keyword);
          const countMatch = sku.book_count.toString().includes(keyword) || 
                           `${sku.book_count}本`.includes(keyword) ||
                           `${sku.book_count}本装`.includes(keyword);
          const priceMatch = sku.price.toString().includes(keyword);
          
          return conditionMatch || countMatch || priceMatch;
        });

        // 如果年龄段匹配或有匹配的SKU，返回该组
        if (ageMatch || matchedSkus.length > 0) {
          return {
            ...group,
            skus: ageMatch ? group.skus : matchedSkus
          };
        }
        return null;
      }).filter(group => group !== null);
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
  async onToggleSku(e) {
    const sku = e.currentTarget.dataset.sku;
    const newStatus = sku.status === 'active' ? 'inactive' : 'active';
    
    try {
      // 调用云函数更新商品状态
      const result = await wx.cloud.callFunction({
        name: 'product',
        data: {
          action: 'updateProductStatus',
          productId: sku.id,
          status: newStatus
        }
      });

      if (result.result && result.result.success) {
        // 更新本地数据
        this.updateSkuStatus(sku.id, newStatus);
        
        wx.showToast({
          title: `已${newStatus === 'active' ? '上架' : '下架'}`,
          icon: 'success'
        });
      } else {
        throw new Error(result.result?.message || '更新状态失败');
      }
    } catch (error) {
      console.error('更新商品状态失败:', error);
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      });
    }
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
      success: async (res) => {
        if (res.confirm) {
          try {
            // 调用云函数删除商品
            const result = await wx.cloud.callFunction({
              name: 'product',
              data: {
                action: 'deleteProduct',
                productId: sku.id
              }
            });

            if (result.result && result.result.success) {
              // 删除成功后更新本地数据
              this.deleteSku(sku.id);
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            } else {
              wx.showToast({
                title: result.result?.message || '删除失败',
                icon: 'none'
              });
            }
          } catch (error) {
            console.error('删除商品失败:', error);
            wx.showToast({
              title: '删除失败，请重试',
              icon: 'none'
            });
          }
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
  async onSaveEdit() {
    const { editForm, ageGroupOptions, conditionOptions, countOptions } = this.data;
    
    // 验证表单
    if (!editForm.price || !editForm.stock) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    const price = Math.round(parseFloat(editForm.price)); // 确保价格为整数
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

    try {
      // 调用云函数更新商品
      const result = await wx.cloud.callFunction({
        name: 'product',
        data: {
          action: 'updateProduct',
          productId: editForm.id,
          product: {
            ageRange: ageGroupOptions[editForm.ageIndex].replace('岁', ''),
            conditionName: conditionOptions[editForm.conditionIndex],
            quantityName: `${bookCount}本装`,
            price: price,
            stock: stock
          }
        }
      });

      if (result.result && result.result.success) {
        // 更新本地数据
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
                price: price, // 确保本地显示的价格也是整数
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
      } else {
        throw new Error(result.result?.message || '更新失败');
      }
    } catch (error) {
      console.error('更新商品失败:', error);
      wx.showToast({
        title: '更新失败，请重试',
        icon: 'none'
      });
    }
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
  async onSaveAdd() {
    const { addForm, ageGroupOptions, conditionOptions, countOptions } = this.data;
    
    // 验证表单
    if (!addForm.price || !addForm.stock) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    const price = Math.round(parseFloat(addForm.price)); // 确保价格为整数
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

    try {
      // 调用云函数添加商品
      const result = await wx.cloud.callFunction({
        name: 'product',
        data: {
          action: 'addProduct',
          product: {
            ageRange: ageGroup.replace('岁', ''),
            conditionName: condition,
            quantityName: `${bookCount}本装`,
            price: price, // 确保保存到数据库的价格为整数
            stock: stock,
            status: 'active',
            name: `${ageGroup}${condition}${bookCount}本装绘本盲盒`,
            description: `专为${ageGroup}儿童精选的${condition}品质${bookCount}本装绘本盲盒，超值惊喜等你开启！`,
            tags: [ageGroup.replace('岁', ''), condition, `${bookCount}本装`, '绘本', '盲盒'],
            features: [
              `适合${ageGroup}儿童阅读`,
              `${condition}品质保证`,
              `${bookCount}本装超值装`,
              '精选优质绘本'
            ]
          }
        }
      });

      if (result.result && result.result.success) {
        // 重新加载商品数据
        await this.loadProductsFromDatabase();
        
        this.setData({
          showAddModal: false
        });

        wx.showToast({
          title: '添加成功',
          icon: 'success'
        });
      } else {
        throw new Error(result.result?.message || '添加失败');
      }
    } catch (error) {
      console.error('添加商品失败:', error);
      wx.showToast({
        title: '添加失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 从数据库加载商品数据
   */
  async loadProductsFromDatabase() {
    try {
      this.setData({ loading: true });
      
      wx.showLoading({
        title: '加载商品数据...'
      });

      // 调用product云函数获取所有产品（包括已下架的）
      const res = await wx.cloud.callFunction({
        name: 'product',
        data: {
          action: 'getProducts',
          pageSize: 100, // 获取更多商品，足够包含36个盲盒商品
          // 移除status参数，获取所有状态的商品
        }
      });

      wx.hideLoading();

      if (res.result.success) {
        const data = res.result.data;
        const products = data.products || []; // 修正：获取products数组
        console.log('📦 获取到的商品数据:', products);
        console.log('📊 商品总数:', data.total);
        
        // 将商品数据转换为管理页面需要的格式
        const ageGroups = this.convertProductsToAgeGroups(products);
        
        this.setData({
          ageGroups: ageGroups,
          loading: false
        });
        
        // 初始化筛选和统计
        this.filterData();
        this.refreshStatistics();
        
      } else {
        throw new Error(res.result.message || '获取商品数据失败');
      }
    } catch (error) {
      wx.hideLoading();
      console.error('❌ 加载商品数据失败:', error);
      
      this.setData({ loading: false });
      
      wx.showToast({
        title: '加载商品失败',
        icon: 'none'
      });
    }
  },

  /**
   * 将商品数据转换为年龄段分组格式
   */
  convertProductsToAgeGroups(products) {
    const ageGroupMap = {
      '0-3': { id: 'age_001', name: '0-3岁', icon: '👶', label: '萌趣' },
      '3-6': { id: 'age_002', name: '3-6岁', icon: '👦', label: '推荐' },
      '6-12': { id: 'age_003', name: '6-12岁', icon: '🎓', label: '精选' }
    };

    const groups = [];
    
    // 为每个年龄段创建分组
    Object.keys(ageGroupMap).forEach(ageRange => {
      const groupInfo = ageGroupMap[ageRange];
      
      // 筛选该年龄段的商品
      const ageProducts = products.filter(product => product.ageRange === ageRange);
      
      if (ageProducts.length > 0) {
        const group = {
          id: groupInfo.id,
          age_group: groupInfo.name,
          icon: groupInfo.icon,
          label: groupInfo.label,
          status: 'active',
          skus: []
        };

        // 将商品转换为SKU格式
        ageProducts.forEach(product => {
          const sku = {
            id: product._id,
            age_group: groupInfo.name,
            condition: product.conditionName,
            book_count: parseInt(product.quantityName.replace('本装', '')),
            price: Math.round(product.price), // 确保价格为整数
            stock: product.stock,
            stock_status: this.getStockStatus(product.stock),
            status: product.status === 'active' ? 'active' : 'inactive',
            // 保留原始产品数据
            originalProduct: product
          };
          
          group.skus.push(sku);
        });

        groups.push(group);
      }
    });

    return groups;
  },

  /**
   * 搜索输入事件
   */
  onSearchInput(e) {
    const searchKeyword = e.detail.value;
    this.setData({
      searchKeyword
    });
    // 实时搜索
    this.filterData();
  },

  /**
   * 搜索确认事件
   */
  onSearchConfirm(e) {
    const searchKeyword = e.detail.value;
    this.setData({
      searchKeyword
    });
    this.filterData();
  },

  /**
   * 清除搜索
   */
  onClearSearch() {
    this.setData({
      searchKeyword: ''
    });
    this.filterData();
  },
}); 