// utils/productService.js
// 商品数据服务

/**
 * 默认商品数据
 */
const defaultProductData = {
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
          status: 'active'
        },
        {
          id: 'sku_002',
          age_group: '0-3岁',
          condition: '全新',
          book_count: 20,
          price: 57.0,
          stock: 30,
          status: 'active'
        },
        {
          id: 'sku_003',
          age_group: '0-3岁',
          condition: '九成新',
          book_count: 10,
          price: 24.0,
          stock: 15,
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
          status: 'active'
        },
        {
          id: 'sku_005',
          age_group: '3-6岁',
          condition: '九成新',
          book_count: 20,
          price: 48.0,
          stock: 35,
          status: 'active'
        },
        {
          id: 'sku_006',
          age_group: '3-6岁',
          condition: '七成新',
          book_count: 30,
          price: 54.0,
          stock: 8,
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
          status: 'inactive'
        },
        {
          id: 'sku_008',
          age_group: '6岁以上',
          condition: '九成新',
          book_count: 20,
          price: 48.0,
          stock: 0,
          status: 'inactive'
        }
      ]
    }
  ]
};

/**
 * 存储键名
 */
const STORAGE_KEY = 'blindbox_products';

/**
 * 商品数据服务类
 */
class ProductService {
  
  /**
   * 获取所有商品数据
   */
  static getAllProducts() {
    try {
      const data = wx.getStorageSync(STORAGE_KEY);
      return data || defaultProductData;
    } catch (error) {
      console.error('获取商品数据失败:', error);
      return defaultProductData;
    }
  }

  /**
   * 保存商品数据
   */
  static saveProducts(productData) {
    try {
      wx.setStorageSync(STORAGE_KEY, productData);
      return true;
    } catch (error) {
      console.error('保存商品数据失败:', error);
      return false;
    }
  }

  /**
   * 获取年龄段列表
   */
  static getAgeGroups() {
    const data = this.getAllProducts();
    return data.ageGroups || [];
  }

  /**
   * 根据年龄段获取SKU
   */
  static getSkusByAgeGroup(ageGroup) {
    const ageGroups = this.getAgeGroups();
    const group = ageGroups.find(g => g.age_group === ageGroup);
    return group ? group.skus : [];
  }

  /**
   * 根据ID获取SKU
   */
  static getSkuById(skuId) {
    const ageGroups = this.getAgeGroups();
    for (const group of ageGroups) {
      const sku = group.skus.find(s => s.id === skuId);
      if (sku) {
        return sku;
      }
    }
    return null;
  }

  /**
   * 更新SKU
   */
  static updateSku(skuId, updates) {
    const data = this.getAllProducts();
    let updated = false;

    data.ageGroups.forEach(group => {
      group.skus.forEach(sku => {
        if (sku.id === skuId) {
          Object.assign(sku, updates);
          updated = true;
        }
      });
    });

    if (updated) {
      this.saveProducts(data);
    }
    
    return updated;
  }

  /**
   * 更新年龄段状态
   */
  static updateAgeGroupStatus(ageGroup, status) {
    const data = this.getAllProducts();
    let updated = false;

    data.ageGroups.forEach(group => {
      if (group.age_group === ageGroup) {
        group.status = status;
        // 同时更新该年龄段下所有SKU的状态
        group.skus.forEach(sku => {
          sku.status = status;
        });
        updated = true;
      }
    });

    if (updated) {
      this.saveProducts(data);
    }
    
    return updated;
  }

  /**
   * 添加SKU
   */
  static addSku(ageGroup, skuData) {
    const data = this.getAllProducts();
    const group = data.ageGroups.find(g => g.age_group === ageGroup);
    
    if (!group) {
      return false;
    }

    // 生成新的SKU ID
    const newId = 'sku_' + Date.now();
    const newSku = {
      id: newId,
      age_group: ageGroup,
      ...skuData
    };

    group.skus.push(newSku);
    this.saveProducts(data);
    
    return newSku;
  }

  /**
   * 删除SKU
   */
  static deleteSku(skuId) {
    const data = this.getAllProducts();
    let deleted = false;

    data.ageGroups.forEach(group => {
      const index = group.skus.findIndex(sku => sku.id === skuId);
      if (index !== -1) {
        group.skus.splice(index, 1);
        deleted = true;
      }
    });

    if (deleted) {
      this.saveProducts(data);
    }
    
    return deleted;
  }

  /**
   * 获取统计数据
   */
  static getStatistics() {
    const ageGroups = this.getAgeGroups();
    let total = 0;
    let active = 0;
    let inactive = 0;
    let lowStock = 0;
    let outOfStock = 0;

    ageGroups.forEach(group => {
      group.skus.forEach(sku => {
        total++;
        if (sku.status === 'active') {
          active++;
        } else {
          inactive++;
        }

        if (sku.stock === 0) {
          outOfStock++;
        } else if (sku.stock <= 10) {
          lowStock++;
        }
      });
    });

    return {
      total,
      active,
      inactive,
      lowStock,
      outOfStock
    };
  }

  /**
   * 库存警告检查
   */
  static checkStockWarnings() {
    const ageGroups = this.getAgeGroups();
    const warnings = [];

    ageGroups.forEach(group => {
      group.skus.forEach(sku => {
        if (sku.stock === 0) {
          warnings.push({
            type: 'out_of_stock',
            sku: sku,
            message: `${sku.age_group} ${sku.condition} ${sku.book_count}本装 已售罄`
          });
        } else if (sku.stock <= 10) {
          warnings.push({
            type: 'low_stock',
            sku: sku,
            message: `${sku.age_group} ${sku.condition} ${sku.book_count}本装 库存不足（剩余${sku.stock}件）`
          });
        }
      });
    });

    return warnings;
  }

  /**
   * 重置为默认数据
   */
  static resetToDefault() {
    this.saveProducts(defaultProductData);
    return true;
  }
}

module.exports = ProductService; 