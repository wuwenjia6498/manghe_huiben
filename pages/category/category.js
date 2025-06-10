Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 年龄分类数据
    ageCategories: [
      {
        id: 1,
        name: '0-3岁启蒙',
        icon: '🍼',
        iconclass: 'icon-baby',
        count: 8,
        tag: '认知启蒙',
        ageRange: '0-3岁'
      },
      {
        id: 2,
        name: '3-6岁成长',
        icon: '👶',
        iconclass: 'icon-child',
        count: 15,
        tag: '想象力培养',
        ageRange: '3-6岁'
      },
      {
        id: 3,
        name: '6岁+阅读',
        icon: '🎓',
        iconclass: 'icon-student',
        count: 12,
        tag: '独立阅读',
        ageRange: '6岁以上'
      }
    ],

    // 新旧程度分类
    conditionCategories: [
      {
        id: 1,
        condition: '全新',
        name: '全新盲盒',
        description: '未拆封原装盲盒，品质保证',
        priceRange: '60-150',
        badgeClass: 'badge-new'
      },
      {
        id: 2,
        condition: '九成新',
        name: '九成新盲盒',
        description: '轻微使用痕迹，性价比高',
        priceRange: '25-80',
        badgeClass: 'badge-excellent'
      },
      {
        id: 3,
        condition: '七成新',
        name: '七成新盲盒',
        description: '有使用痕迹但不影响阅读',
        priceRange: '15-45',
        badgeClass: 'badge-good'
      }
    ],

    // 热门推荐商品
    recommendList: [
      {
        id: 1,
        name: '3-6岁经典绘本盲盒',
        ageRange: '3-6岁',
        condition: '九成新',
        price: 54,
        originalPrice: 120,
        coverUrl: 'https://picsum.photos/200/150?random=11'
      },
      {
        id: 2,
        name: '启蒙认知盲盒套装',
        ageRange: '0-3岁',
        condition: '九成新',
        price: 25,
        originalPrice: 55,
        coverUrl: 'https://picsum.photos/200/150?random=12'
      },
      {
        id: 3,
        name: '进阶阅读精选盲盒',
        ageRange: '6岁以上',
        condition: '七成新',
        price: 38,
        originalPrice: 84,
        coverUrl: 'https://picsum.photos/200/150?random=13'
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadCategoryData();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    wx.setNavigationBarTitle({
      title: '分类浏览'
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时可以刷新数据
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
    this.loadCategoryData();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 可以加载更多推荐商品
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '绘本盲盒分类 - 按需选择最适合的盲盒',
      path: '/pages/category/category',
      imageUrl: '/images/share-category.jpg'
    };
  },

  /**
   * 加载分类数据
   */
  loadCategoryData() {
    // TODO: 从服务器获取最新的分类数据
    console.log('加载分类数据');
    
    // 这里可以调用云函数或API获取实时数据
    // 暂时使用静态数据
  },

  /**
   * 年龄分类点击事件
   */
  onAgeCategoryTap(e) {
    const category = e.currentTarget.dataset.category;
    console.log('点击年龄分类:', category);

    // 跳转到商品列表页，按年龄筛选
    wx.navigateTo({
      url: `/pages/product-list/product-list?type=age&value=${category.ageRange}&title=${category.name}`
    });
  },

  /**
   * 新旧程度分类点击事件
   */
  onConditionCategoryTap(e) {
    const category = e.currentTarget.dataset.category;
    console.log('点击新旧程度分类:', category);

    // 跳转到商品列表页，按新旧程度筛选
    wx.navigateTo({
      url: `/pages/product-list/product-list?type=condition&value=${category.condition}&title=${category.name}`
    });
  },

  /**
   * 热门推荐点击事件
   */
  onRecommendTap(e) {
    const product = e.currentTarget.dataset.product;
    console.log('点击热门推荐:', product);

    // 跳转到商品详情页
    wx.navigateTo({
      url: `/pages/product-detail/product-detail?id=${product.id}`
    });
  }
}) 