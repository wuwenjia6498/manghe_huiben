// 管理员云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  
  console.log('Admin云函数调用:', { action, openid: wxContext.OPENID });
  
  try {
    // 对于某些操作不需要管理员权限验证
    if (action === 'getSettings') {
      return await getSettings();
    }
    
    // 验证管理员权限
    const isAdmin = await checkAdminPermission(wxContext);
    console.log('管理员权限验证结果:', isAdmin);
    
    if (!isAdmin) {
      return { success: false, message: '无管理员权限' };
    }
    
    switch (action) {
      case 'getProducts':
        return await getProducts(event);
      case 'addProduct':
        return await addProduct(event);
      case 'updateProduct':
        return await updateProduct(event);
      case 'deleteProduct':
        return await deleteProduct(event);
      case 'getOrders':
        return await getOrders(event);
      case 'updateOrderStatus':
        return await updateOrderStatus(event);
      case 'getUsers':
        return await getUsers(event);
      case 'getStats':
        return await getStats();
      case 'updateSettings':
        return await updateSettings(event);
      default:
        return { success: false, message: '未知操作' };
    }
  } catch (error) {
    console.error('管理员云函数错误:', error);
    return { success: false, message: error.message };
  }
};

// 验证管理员权限
async function checkAdminPermission(wxContext) {
  const openid = wxContext.OPENID;
  
  console.log('检查管理员权限 openid:', openid);
  
  try {
    const result = await db.collection('admin_users').where({
      openid: openid,
      status: 'active'
    }).get();
    
    console.log('管理员查询结果:', result);
    
    const isAdmin = result.data.length > 0;
    console.log('是否为管理员:', isAdmin);
    
    return isAdmin;
  } catch (error) {
    console.error('检查管理员权限失败:', error);
    return false;
  }
}

// 获取商品列表
async function getProducts(event) {
  const { page = 1, pageSize = 20, category, status } = event;
  
  try {
    let query = db.collection('products');
    
    // 添加筛选条件
    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;
    
    if (Object.keys(where).length > 0) {
      query = query.where(where);
    }
    
    const result = await query
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    // 获取总数
    const countResult = await query.count();
    
    return {
      success: true,
      data: {
        list: result.data,
        total: countResult.total,
        page,
        pageSize
      }
    };
  } catch (error) {
    throw new Error(`获取商品列表失败: ${error.message}`);
  }
}

// 添加商品
async function addProduct(event) {
  const { productData } = event;
  
  try {
    const result = await db.collection('products').add({
      data: {
        ...productData,
        createTime: new Date(),
        updateTime: new Date(),
        status: 'active'
      }
    });
    
    return {
      success: true,
      data: { _id: result._id }
    };
  } catch (error) {
    throw new Error(`添加商品失败: ${error.message}`);
  }
}

// 更新商品
async function updateProduct(event) {
  const { productId, productData } = event;
  
  console.log('收到商品更新请求:', { productId, productData });
  
  try {
    // 验证必填字段
    if (!productId) {
      throw new Error('商品ID不能为空');
    }
    
    if (!productData || typeof productData !== 'object') {
      throw new Error('商品数据格式错误');
    }
    
    // 先查询商品是否存在
    const existingProduct = await db.collection('products').doc(productId).get();
    if (!existingProduct.data) {
      throw new Error('商品不存在');
    }
    
    console.log('更新前的商品数据:', existingProduct.data);
    
    // 构建更新数据
    const updateData = {
      ...productData,
      updateTime: new Date()
    };
    
    console.log('准备更新的数据:', updateData);
    
    const result = await db.collection('products').doc(productId).update({
      data: updateData
    });
    
    console.log('商品更新结果:', result);
    
    // 返回更新后的完整商品数据
    const updatedProduct = await db.collection('products').doc(productId).get();
    
    console.log('更新后的商品数据:', updatedProduct.data);
    
    return {
      success: true,
      data: updatedProduct.data,
      message: '商品更新成功'
    };
  } catch (error) {
    console.error('更新商品失败:', error);
    return {
      success: false,
      message: `更新商品失败: ${error.message}`
    };
  }
}

// 删除商品
async function deleteProduct(event) {
  const { productId } = event;
  
  try {
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

// 获取订单列表
async function getOrders(event) {
  const { page = 1, pageSize = 20, status, startDate, endDate } = event;
  
  try {
    let query = db.collection('orders');
    
    // 添加筛选条件
    const where = {};
    if (status) where.status = status;
    
    if (Object.keys(where).length > 0) {
      query = query.where(where);
    }
    
    // 日期筛选
    if (startDate || endDate) {
      const dateWhere = {};
      if (startDate) dateWhere.gte = new Date(startDate);
      if (endDate) dateWhere.lte = new Date(endDate);
      query = query.where({
        createTime: dateWhere
      });
    }
    
    const result = await query
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    // 获取总数
    const countResult = await query.count();
    
    return {
      success: true,
      data: {
        list: result.data,
        total: countResult.total,
        page,
        pageSize
      }
    };
  } catch (error) {
    throw new Error(`获取订单列表失败: ${error.message}`);
  }
}

// 更新订单状态
async function updateOrderStatus(event) {
  const { orderId, status, trackingNumber } = event;
  
  try {
    const updateData = {
      status,
      updateTime: new Date()
    };
    
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }
    
    if (status === 'shipped') {
      updateData.shippedTime = new Date();
    } else if (status === 'delivered') {
      updateData.deliveredTime = new Date();
    }
    
    const result = await db.collection('orders').doc(orderId).update({
      data: updateData
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    throw new Error(`更新订单状态失败: ${error.message}`);
  }
}

// 获取用户列表
async function getUsers(event) {
  const { page = 1, pageSize = 20 } = event;
  
  try {
    const result = await db.collection('users')
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    // 获取总数
    const countResult = await db.collection('users').count();
    
    return {
      success: true,
      data: {
        list: result.data,
        total: countResult.total,
        page,
        pageSize
      }
    };
  } catch (error) {
    throw new Error(`获取用户列表失败: ${error.message}`);
  }
}

// 获取统计数据
async function getStats() {
  try {
    // 获取当前时间和昨天时间
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 获取本月第一天 - 修复时区问题
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    console.log('统计时间范围:', {
      now: now.toString(),
      today: today.toString(),
      yesterday: yesterday.toString(),
      monthStart: monthStart.toString()
    });
    
    // 用户统计
    const userCount = await db.collection('users').count();
    
    // 今日新增用户
    const todayNewUsers = await db.collection('users').where({
      createTime: db.command.gte(today)
    }).count();
    
    // 昨日新增用户
    const yesterdayNewUsers = await db.collection('users').where({
      createTime: db.command.gte(yesterday).and(db.command.lt(today))
    }).count();
    
    // 订单统计
    const orderCount = await db.collection('orders').count();
    
    // 已支付订单统计
    const paidOrderCount = await db.collection('orders').where({
      status: db.command.in(['paid', 'shipped', 'delivered'])
    }).count();
    
    // 待发货订单
    const pendingShipmentCount = await db.collection('orders').where({
      status: 'paid'
    }).count();
    
    // 今日订单
    const todayOrderCount = await db.collection('orders').where({
      createTime: db.command.gte(today)
    }).count();
    
    // 昨日订单
    const yesterdayOrderCount = await db.collection('orders').where({
      createTime: db.command.gte(yesterday).and(db.command.lt(today))
    }).count();
    
    // 今日销售额（已支付订单）
    const todaySalesOrders = await db.collection('orders').where({
      createTime: db.command.gte(today),
      status: db.command.in(['paid', 'shipped', 'delivered'])
    }).get();
    
    const todaySales = todaySalesOrders.data.reduce((total, order) => {
      return total + (order.totalAmount || 0);
    }, 0);
    
    console.log('今日销售订单:', todaySalesOrders.data.length, '今日销售额:', todaySales);
    
    // 昨日销售额
    const yesterdaySalesOrders = await db.collection('orders').where({
      createTime: db.command.gte(yesterday).and(db.command.lt(today)),
      status: db.command.in(['paid', 'shipped', 'delivered'])
    }).get();
    
    const yesterdaySales = yesterdaySalesOrders.data.reduce((total, order) => {
      return total + (order.totalAmount || 0);
    }, 0);
    
    // 本月销售额（已支付订单）- 修复查询逻辑
    const monthSalesOrders = await db.collection('orders').where({
      createTime: db.command.gte(monthStart),
      status: db.command.in(['paid', 'shipped', 'delivered'])
    }).get();
    
    const monthSales = monthSalesOrders.data.reduce((total, order) => {
      return total + (order.totalAmount || 0);
    }, 0);
    
    console.log('本月销售查询条件:', {
      monthStart: monthStart.toString(),
      orderCount: monthSalesOrders.data.length,
      monthSales: monthSales
    });
    console.log('本月销售订单详情:', monthSalesOrders.data.map(order => ({
      orderId: order._id,
      createTime: order.createTime,
      totalAmount: order.totalAmount,
      status: order.status
    })));
    
    // 商品统计
    const productCount = await db.collection('products').where({
      status: 'active'
    }).count();
    
    // 低库存商品（库存小于10的商品）
    const lowInventoryProducts = await db.collection('products').where({
      status: 'active',
      stock: db.command.lt(10)
    }).count();
    
    // 计算增长率
    const calculateGrowthRate = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous * 100).toFixed(1);
    };
    
    const salesGrowth = calculateGrowthRate(todaySales, yesterdaySales);
    const ordersGrowth = calculateGrowthRate(todayOrderCount.total, yesterdayOrderCount.total);
    const usersChange = calculateGrowthRate(todayNewUsers.total, yesterdayNewUsers.total);
    
    // 商品类别统计（用于饼图）
    const products = await db.collection('products').where({
      status: 'active'
    }).get();
    
    const categoryStats = {};
    products.data.forEach(product => {
      const category = product.category || '其他';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
    
    // 转换为数组格式
    const categoryData = Object.entries(categoryStats).map(([name, value]) => ({
      name,
      value
    }));
    
    const result = {
      success: true,
      data: {
        // 基础统计
        userCount: userCount.total,
        orderCount: orderCount.total,
        paidOrderCount: paidOrderCount.total,
        productCount: productCount.total,
        
        // 今日数据
        todayOrderCount: todayOrderCount.total,
        todayNewUsers: todayNewUsers.total,
        todaySales: todaySales,
        
        // 本月数据
        monthSales: monthSales,
        
        // 昨日数据（用于计算增长率）
        yesterdayOrderCount: yesterdayOrderCount.total,
        yesterdayNewUsers: yesterdayNewUsers.total,
        yesterdaySales: yesterdaySales,
        
        // 增长率
        salesGrowth: salesGrowth,
        ordersGrowth: ordersGrowth,
        usersChange: usersChange,
        
        // 待处理数据
        pendingShipmentCount: pendingShipmentCount.total,
        lowInventoryCount: lowInventoryProducts.total,
        
        // 计算字段
        pendingOrderCount: orderCount.total - paidOrderCount.total,
        
        // 商品类别统计
        categoryStats: categoryData
      }
    };
    
    console.log('统计结果:', result.data);
    return result;
  } catch (error) {
    console.error('获取统计数据失败:', error);
    throw new Error(`获取统计数据失败: ${error.message}`);
  }
}

// 获取系统设置
async function getSettings() {
  console.log('获取系统设置请求');
  
  try {
    let result;
    try {
      result = await db.collection('system_settings')
        .doc('global')
        .get();
      console.log('数据库查询结果:', result);
    } catch (error) {
      console.log('系统设置集合不存在或记录不存在:', error.message);
      result = { data: null };
    }
    
    if (result.data) {
      console.log('返回已保存的设置:', result.data);
      return {
        success: true,
        data: result.data
      };
    } else {
      // 返回默认设置
      const defaultSettings = {
        deliveryFee: '0',
        freeShippingThreshold: '50',
        shippingTimeIndex: 1,
        deliveryCompanyIndex: 0,
        storePickupEnabled: true,
        storeName: '八爪鱼绘本馆',
        storePhone: '0574-87343774',
        storeAddress: '宁波市海曙区文化路12号',
        firstOrderDiscountEnabled: true,
        firstOrderDiscount: '10',
        shareCouponEnabled: true,
        shareCouponAmount: '5',
        fullReductionEnabled: true,
        fullReductionThreshold: '100',
        fullReductionAmount: '15',
        customerServiceWechat: 'pictureboxes',
        customerServicePhone: '0574-87345055',
        serviceTime: '9:00-21:00',
        returnPolicy: '盲盒商品不支持退换货，请谨慎下单。',
        systemNoticeEnabled: true,
        systemNotice: '🎉 欢迎来到八爪鱼绘本馆！首单立减10元，分享得5元券！'
      };
      
      console.log('返回默认设置:', defaultSettings);
      return {
        success: true,
        data: defaultSettings
      };
    }
  } catch (error) {
    console.error('获取系统设置失败:', error);
    return {
      success: false,
      message: `获取设置失败: ${error.message}`
    };
  }
}

// 更新系统设置
async function updateSettings(event) {
  const { settings } = event;
  
  console.log('收到设置更新请求:', settings);
  
  try {
    // 验证设置数据
    if (!settings || typeof settings !== 'object') {
      throw new Error('设置数据格式错误');
    }
    
    // 过滤掉 _id 字段，避免更新时报错
    const { _id, ...cleanSettings } = settings;
    console.log('过滤后的设置数据:', cleanSettings);
    
    // 先尝试获取现有设置
    let existingSettings;
    try {
      const getResult = await db.collection('system_settings')
        .doc('global')
        .get();
      existingSettings = getResult.data;
      console.log('找到现有设置:', existingSettings);
    } catch (error) {
      console.log('没有找到现有设置，将创建新记录');
      existingSettings = null;
    }
    
    let result;
    
    if (existingSettings) {
      // 记录已存在，使用update方法
      result = await db.collection('system_settings')
        .doc('global')
        .update({
          data: {
            ...cleanSettings,
            updateTime: new Date()
          }
        });
      console.log('设置更新结果:', result);
    } else {
      // 记录不存在，使用add方法创建
      result = await db.collection('system_settings')
        .add({
          data: {
            _id: 'global',
            ...cleanSettings,
            createTime: new Date(),
            updateTime: new Date()
          }
        });
      console.log('设置创建结果:', result);
    }
    
    return {
      success: true,
      message: '设置保存成功'
    };
  } catch (error) {
    console.error('保存系统设置失败:', error);
    return {
      success: false,
      message: `保存失败: ${error.message}`
    };
  }
} 