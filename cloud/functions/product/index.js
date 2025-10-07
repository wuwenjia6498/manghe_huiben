// 商品管理云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action } = event;
  
  try {
    switch (action) {
      case 'getProducts':
        return await getProducts(event);
      case 'getProductDetail':
        return await getProductDetail(event);
      case 'getCategories':
        return await getCategories();
      case 'openBlindBox':
        return await openBlindBox(event, context);
      case 'addProduct':
        return await addProduct(event, context);
      case 'updateProduct':
        return await updateProduct(event, context);
      case 'updateProductStatus':
        return await updateProductStatus(event, context);
      case 'deleteProduct':
        return await deleteProduct(event, context);
      case 'addCategory':
        return await addCategory(event, context);
      case 'updateCategory':
        return await updateCategory(event, context);
      default:
        return { success: false, message: '未知操作' };
    }
  } catch (error) {
    console.error('商品云函数错误:', error);
    return { success: false, message: error.message };
  }
};

// 获取商品列表
async function getProducts(event) {
  const { categoryId, page = 1, pageSize = 10, status } = event;
  
  try {
    let query = db.collection('products');
    
    // 只有明确指定status时才添加状态筛选条件
    if (status) {
      query = query.where({ status });
    }
    
    if (categoryId) {
      // 如果已有状态筛选，需要用and连接条件
      if (status) {
        query = query.where({ categoryId, status });
      } else {
        query = query.where({ categoryId });
      }
    }
    
    const countResult = await query.count();
    const total = countResult.total;
    
    const result = await query
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    return {
      success: true,
      data: {
        products: result.data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  } catch (error) {
    throw new Error(`获取商品列表失败: ${error.message}`);
  }
}

// 获取商品详情
async function getProductDetail(event) {
  const { productId } = event;
  
  try {
    const result = await db.collection('products').doc(productId).get();
    
    if (!result.data) {
      return { success: false, message: '商品不存在' };
    }
    
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    throw new Error(`获取商品详情失败: ${error.message}`);
  }
}

// 获取分类列表
async function getCategories() {
  try {
    const result = await db.collection('categories')
      .where({ status: 'active' })
      .orderBy('sort', 'asc')
      .get();
    
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    throw new Error(`获取分类列表失败: ${error.message}`);
  }
}

// 开盲盒逻辑
async function openBlindBox(event, context) {
  const { productId } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  try {
    // 获取商品信息
    const productResult = await db.collection('products').doc(productId).get();
    if (!productResult.data) {
      return { success: false, message: '商品不存在' };
    }
    
    const product = productResult.data;
    
    // 检查库存
    if (product.stock <= 0) {
      return { success: false, message: '库存不足' };
    }
    
    // 根据概率抽取物品
    const drawnItem = drawItem(product.contents, product.probability);
    
    // 更新库存和销量
    await db.collection('products').doc(productId).update({
      data: {
        stock: _.inc(-1),
        sales: _.inc(1),
        updateTime: new Date()
      }
    });
    
    // 记录抽取结果
    const drawRecord = await db.collection('draw_records').add({
      data: {
        openid: openid,
        productId: productId,
        productName: product.name,
        drawnItem: drawnItem,
        drawTime: new Date()
      }
    });
    
    return {
      success: true,
      data: {
        drawnItem: drawnItem,
        recordId: drawRecord._id
      }
    };
  } catch (error) {
    throw new Error(`开盲盒失败: ${error.message}`);
  }
}

// 抽取物品算法
function drawItem(contents, probability) {
  const random = Math.random();
  let currentSum = 0;
  
  for (const item of contents) {
    currentSum += probability[item] || 0;
    if (random <= currentSum) {
      return item;
    }
  }
  
  // 如果没有抽中，返回第一个物品
  return contents[0];
}

// 添加商品（管理员）
async function addProduct(event, context) {
  const { product } = event;
  const wxContext = cloud.getWXContext();
  
  // 验证管理员权限
  const adminCheck = await checkAdminPermission(wxContext.OPENID);
  if (!adminCheck.success) {
    return adminCheck;
  }
  
  try {
    const result = await db.collection('products').add({
      data: {
        ...product,
        sales: 0,
        status: 'active',
        createTime: new Date(),
        updateTime: new Date()
      }
    });
    
    return {
      success: true,
      data: { productId: result._id }
    };
  } catch (error) {
    throw new Error(`添加商品失败: ${error.message}`);
  }
}

// 更新商品（管理员）
async function updateProduct(event, context) {
  const { productId, product } = event;
  const wxContext = cloud.getWXContext();
  
  // 验证管理员权限
  const adminCheck = await checkAdminPermission(wxContext.OPENID);
  if (!adminCheck.success) {
    return adminCheck;
  }
  
  try {
    const result = await db.collection('products').doc(productId).update({
      data: {
        ...product,
        updateTime: new Date()
      }
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    throw new Error(`更新商品失败: ${error.message}`);
  }
}

// 更新商品状态（管理员）
async function updateProductStatus(event, context) {
  const { productId, status } = event;
  const wxContext = cloud.getWXContext();
  
  // 验证管理员权限
  const adminCheck = await checkAdminPermission(wxContext.OPENID);
  if (!adminCheck.success) {
    return adminCheck;
  }
  
  try {
    const result = await db.collection('products').doc(productId).update({
      data: {
        status: status,
        updateTime: new Date()
      }
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    throw new Error(`更新商品状态失败: ${error.message}`);
  }
}

// 删除商品（管理员）
async function deleteProduct(event, context) {
  const { productId } = event;
  const wxContext = cloud.getWXContext();
  
  // 验证管理员权限
  const adminCheck = await checkAdminPermission(wxContext.OPENID);
  if (!adminCheck.success) {
    return adminCheck;
  }
  
  try {
    // 软删除，只更新状态
    const result = await db.collection('products').doc(productId).update({
      data: {
        status: 'deleted',
        updateTime: new Date()
      }
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    throw new Error(`删除商品失败: ${error.message}`);
  }
}

// 添加分类（管理员）
async function addCategory(event, context) {
  const { category } = event;
  const wxContext = cloud.getWXContext();
  
  // 验证管理员权限
  const adminCheck = await checkAdminPermission(wxContext.OPENID);
  if (!adminCheck.success) {
    return adminCheck;
  }
  
  try {
    const result = await db.collection('categories').add({
      data: {
        ...category,
        status: 'active',
        createTime: new Date()
      }
    });
    
    return {
      success: true,
      data: { categoryId: result._id }
    };
  } catch (error) {
    throw new Error(`添加分类失败: ${error.message}`);
  }
}

// 更新分类（管理员）
async function updateCategory(event, context) {
  const { categoryId, category } = event;
  const wxContext = cloud.getWXContext();
  
  // 验证管理员权限
  const adminCheck = await checkAdminPermission(wxContext.OPENID);
  if (!adminCheck.success) {
    return adminCheck;
  }
  
  try {
    const result = await db.collection('categories').doc(categoryId).update({
      data: {
        ...category,
        updateTime: new Date()
      }
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    throw new Error(`更新分类失败: ${error.message}`);
  }
}

// 检查管理员权限
async function checkAdminPermission(openid) {
  try {
    const result = await db.collection('admin_users').where({
      openid: openid,
      status: 'active'
    }).get();
    
    if (result.data.length === 0) {
      return { success: false, message: '无管理员权限' };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, message: '权限验证失败' };
  }
} 