// 数据库初始化云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event;
  
  try {
    switch (action) {
      case 'initCategories':
        return await initCategories();
      case 'initProducts':
        return await initProducts();
      case 'initAll':
        return await initAll();
      case 'forceInit':
        return await forceInit();
      case 'checkData':
        return await checkData();
      default:
        return { success: false, message: '未知操作' };
    }
  } catch (error) {
    console.error('数据库初始化错误:', error);
    return { success: false, message: error.message };
  }
};

// 初始化商品分类
async function initCategories() {
  const categories = [
    {
      _id: 'cat_001',
      name: '0-3岁绘本',
      description: '适合0-3岁幼儿的绘本，培养早期阅读习惯',
      image: '/images/category-0-3.jpg',
      ageRange: '0-3',
      sort: 1,
      status: 'active',
      createTime: new Date()
    },
    {
      _id: 'cat_002', 
      name: '3-6岁绘本',
      description: '适合3-6岁儿童的绘本，启发想象力',
      image: '/images/category-3-6.jpg',
      ageRange: '3-6',
      sort: 2,
      status: 'active',
      createTime: new Date()
    },
    {
      _id: 'cat_003',
      name: '6-12岁绘本', 
      description: '适合6-12岁儿童的绘本，培养阅读能力',
      image: '/images/category-6-12.jpg',
      ageRange: '6-12',
      sort: 3,
      status: 'active',
      createTime: new Date()
    }
  ];

  try {
    // 清空现有数据 - 先查询所有记录，然后逐个删除
    const existingCategories = await db.collection('categories').get();
    for (const category of existingCategories.data) {
      await db.collection('categories').doc(category._id).remove();
    }
    
    // 批量添加分类
    const result = await db.collection('categories').add({
      data: categories
    });
    
    return {
      success: true,
      message: `成功初始化 ${categories.length} 个商品分类`,
      data: result
    };
  } catch (error) {
    throw new Error(`初始化分类失败: ${error.message}`);
  }
}

// 初始化商品数据
async function initProducts() {
  const products = [];
  
  // 年龄段配置
  const ageGroups = [
    { id: '0-3', name: '0-3岁', basePrice: 79, categoryId: 'cat_001' },
    { id: '3-6', name: '3-6岁', basePrice: 89, categoryId: 'cat_002' },
    { id: '6-12', name: '6-12岁', basePrice: 99, categoryId: 'cat_003' }
  ];
  
  // 成色配置
  const conditions = [
    { id: 'new', name: '全新', multiplier: 1.0 },
    { id: 'like-new', name: '九成新', multiplier: 0.85 },
    { id: 'good', name: '七成新', multiplier: 0.7 },
    { id: 'fair', name: '五成新', multiplier: 0.55 }
  ];
  
  // 本数配置
  const quantities = [
    { id: '10', name: '10本装', multiplier: 1.0 },
    { id: '20', name: '20本装', multiplier: 1.8 },
    { id: '30', name: '30本装', multiplier: 2.5 }
  ];
  
  let productIndex = 1;
  
  // 生成所有组合的产品
  for (const age of ageGroups) {
    for (const condition of conditions) {
      for (const quantity of quantities) {
        const price = Math.round(age.basePrice * condition.multiplier * quantity.multiplier); // 去掉小数点
        const originalPrice = Math.round(price * 1.4); // 原价为现价的1.4倍，去掉小数点
        
        const product = {
          _id: `prod_${String(productIndex).padStart(3, '0')}`,
          name: `${age.name}${condition.name}${quantity.name}绘本盲盒`,
          description: `专为${age.id}岁儿童精选的${condition.name}品质${quantity.name}绘本盲盒，超值惊喜等你开启！`,
          price: price,
          originalPrice: originalPrice,
          categoryId: age.categoryId,
          ageRange: age.id,
          condition: condition.id,
          conditionName: condition.name,
          quantity: quantity.id,
          quantityName: quantity.name,
          stock: Math.floor(Math.random() * 50) + 20, // 随机库存 20-70
          sales: 0,
          tags: [age.id, condition.name, quantity.name, '绘本', '盲盒'],
          features: [
            `适合${age.id}岁儿童阅读`,
            `${condition.name}品质保证`,
            `${quantity.name}超值装`,
            '精选优质绘本'
          ],
          status: 'active',
          createTime: new Date(),
          updateTime: new Date()
        };
        
        products.push(product);
        productIndex++;
      }
    }
  }

  try {
    // 清空现有数据 - 先查询所有记录，然后逐个删除
    const existingProducts = await db.collection('products').get();
    for (const product of existingProducts.data) {
      await db.collection('products').doc(product._id).remove();
    }
    
    // 批量添加商品
    const result = await db.collection('products').add({
      data: products
    });
    
    return {
      success: true,
      message: `成功初始化 ${products.length} 个盲盒商品`,
      data: result
    };
  } catch (error) {
    throw new Error(`初始化商品失败: ${error.message}`);
  }
}

// 初始化所有数据
async function initAll() {
  try {
    const categoryResult = await initCategories();
    const productResult = await initProducts();
    
    return {
      success: true,
      message: '数据库初始化完成',
      data: {
        categories: categoryResult,
        products: productResult
      }
    };
  } catch (error) {
    throw new Error(`初始化失败: ${error.message}`);
  }
}

// 检查数据
async function checkData() {
  try {
    const categoryCount = await db.collection('categories').count();
    const productCount = await db.collection('products').count();
    const userCount = await db.collection('users').count();
    const adminCount = await db.collection('admin_users').count();
    
    return {
      success: true,
      data: {
        categories: categoryCount.total,
        products: productCount.total,
        users: userCount.total,
        admins: adminCount.total
      }
    };
  } catch (error) {
    throw new Error(`检查数据失败: ${error.message}`);
  }
}

// 强制重新初始化所有数据
async function forceInit() {
  try {
    console.log('🔄 开始强制重新初始化数据库...');
    
    const categoryResult = await initCategories();
    console.log('✅ 分类初始化完成:', categoryResult);
    
    const productResult = await initProducts();
    console.log('✅ 商品初始化完成:', productResult);
    
    return {
      success: true,
      message: '强制重新初始化完成',
      data: {
        categories: categoryResult,
        products: productResult
      }
    };
  } catch (error) {
    throw new Error(`强制初始化失败: ${error.message}`);
  }
} 