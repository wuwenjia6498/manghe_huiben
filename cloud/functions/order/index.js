// 订单管理云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  
  try {
    switch (action) {
      case 'createOrder':
        return await createOrder(event, wxContext);
      case 'getOrders':
        return await getOrders(event, wxContext);
      case 'getOrderDetail':
        return await getOrderDetail(event, wxContext);
      case 'getOrderById':
        return await getOrderById(event, wxContext);
      case 'updateOrderStatus':
        return await updateOrderStatus(event, wxContext);
      case 'cancelOrder':
        return await cancelOrder(event, wxContext);
      case 'getAllOrders':
        return await getAllOrders(event, wxContext);
      case 'updateOrderStatusAdmin':
        return await updateOrderStatusAdmin(event, wxContext);
      case 'getOrderStats':
        return await getOrderStats(event, wxContext);
      default:
        return { success: false, message: '未知操作' };
    }
  } catch (error) {
    console.error('订单云函数错误:', error);
    return { success: false, message: error.message };
  }
};

// 创建订单
async function createOrder(event, wxContext) {
  const { products, address, totalAmount, orderAmount, deliveryFee, firstDiscount, fullDiscount, remark } = event;
  const openid = wxContext.OPENID;
  
  console.log('创建订单参数:', {
    totalAmount,
    orderAmount,
    deliveryFee,
    firstDiscount,
    fullDiscount
  });
  
  try {
    // 生成订单号
    const orderNo = generateOrderNo();
    
    // 验证商品信息和库存
    for (let i = 0; i < products.length; i++) {
      const item = products[i];
      const productResult = await db.collection('products').doc(item.productId).get();
      if (!productResult.data) {
        return { success: false, message: `商品 ${item.name} 不存在` };
      }
      
      if (productResult.data.stock < item.quantity) {
        return { success: false, message: `商品 ${item.name} 库存不足` };
      }
    }
    
    // 创建订单
    const orderResult = await db.collection('orders').add({
      data: {
        orderNo: orderNo,
        openid: openid,
        products: products,
        address: address,
        totalAmount: totalAmount, // 最终支付金额
        orderAmount: orderAmount || totalAmount, // 商品总金额
        deliveryFee: deliveryFee || 0, // 运费
        firstDiscount: firstDiscount || 0, // 首单优惠
        fullDiscount: fullDiscount || 0, // 满减优惠
        remark: remark || '',
        deliveryType: event.deliveryType || 'express',
        status: 'pending', // 订单初始状态为待支付
        paymentStatus: 'pending', // 待支付
        createTime: new Date(),
        updateTime: new Date()
      }
    });
    
    // 减少商品库存
    for (let i = 0; i < products.length; i++) {
      const item = products[i];
      await db.collection('products').doc(item.productId).update({
        data: {
          stock: _.inc(-item.quantity),
          sales: _.inc(item.quantity),
          updateTime: new Date()
        }
      });
    }
    
    return {
      success: true,
      data: {
        orderId: orderResult._id,
        orderNo: orderNo
      }
    };
  } catch (error) {
    throw new Error(`创建订单失败: ${error.message}`);
  }
}

// 获取用户订单列表
async function getOrders(event, wxContext) {
  const { page = 1, pageSize = 10, status } = event;
  const openid = wxContext.OPENID;
  
  try {
    // 构建查询条件（必须包含 openid）
    let whereCondition = { openid };
    
    // 根据状态筛选
    if (status) {
      // 所有状态都使用精确匹配
      whereCondition.status = status;
    } else {
      // "全部"订单：只查询有效的订单状态（排除已取消和异常状态）
      whereCondition.status = _.in(['pending', 'paid', 'shipped', 'completed']);
    }
    
    let query = db.collection('orders').where(whereCondition);
    
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
        orders: result.data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  } catch (error) {
    throw new Error(`获取订单列表失败: ${error.message}`);
  }
}

// 获取订单详情
async function getOrderDetail(event, wxContext) {
  const { orderId } = event;
  const openid = wxContext.OPENID;
  
  try {
    const result = await db.collection('orders').doc(orderId).get();
    
    if (!result.data) {
      return { success: false, message: '订单不存在' };
    }
    
    // 验证订单归属
    if (result.data.openid !== openid) {
      // 检查是否为管理员
      const adminCheck = await checkAdminPermission(openid);
      if (!adminCheck.success) {
        return { success: false, message: '无权查看此订单' };
      }
    }
    
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    throw new Error(`获取订单详情失败: ${error.message}`);
  }
}

// 获取订单详情
async function getOrderById(event, wxContext) {
  const { orderId } = event;
  const openid = wxContext.OPENID;
  
  try {
    const result = await db.collection('orders').doc(orderId).get();
    
    if (!result.data) {
      return { success: false, message: '订单不存在' };
    }
    
    // 验证订单归属
    if (result.data.openid !== openid) {
      // 检查是否为管理员
      const adminCheck = await checkAdminPermission(openid);
      if (!adminCheck.success) {
        return { success: false, message: '无权查看此订单' };
      }
    }
    
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    throw new Error(`获取订单详情失败: ${error.message}`);
  }
}

// 更新订单状态
async function updateOrderStatus(event, wxContext) {
  const { orderId, status, paymentStatus } = event;
  const openid = wxContext.OPENID;
  
  try {
    // 验证订单归属
    const orderResult = await db.collection('orders').doc(orderId).get();
    if (!orderResult.data || orderResult.data.openid !== openid) {
      return { success: false, message: '订单不存在或无权操作' };
    }
    
    const updateData = {
      updateTime: new Date()
    };
    
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    
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

// 取消订单
async function cancelOrder(event, wxContext) {
  const { orderId } = event;
  const openid = wxContext.OPENID;
  
  try {
    // 验证订单归属和状态
    const orderResult = await db.collection('orders').doc(orderId).get();
    if (!orderResult.data || orderResult.data.openid !== openid) {
      return { success: false, message: '订单不存在或无权操作' };
    }
    
    const order = orderResult.data;
    if (order.status !== 'pending') {
      return { success: false, message: '只能取消待付款订单' };
    }
    
    // 更新订单状态
    await db.collection('orders').doc(orderId).update({
      data: {
        status: 'cancelled',
        updateTime: new Date()
      }
    });
    
    // 恢复商品库存
    for (let i = 0; i < order.products.length; i++) {
      const item = order.products[i];
      await db.collection('products').doc(item.productId).update({
        data: {
          stock: _.inc(item.quantity),
          sales: _.inc(-item.quantity),
          updateTime: new Date()
        }
      });
    }
    
    return {
      success: true,
      message: '订单已取消'
    };
  } catch (error) {
    throw new Error(`取消订单失败: ${error.message}`);
  }
}

// 获取所有订单（管理员）
async function getAllOrders(event, wxContext) {
  const { page = 1, pageSize = 20, status, orderNo, startDate, endDate } = event;
  const openid = wxContext.OPENID;
  
  // 验证管理员权限
  const adminCheck = await checkAdminPermission(openid);
  if (!adminCheck.success) {
    return adminCheck;
  }
  
  try {
    let query = db.collection('orders');
    
    // 构建查询条件
    const conditions = [];
    
    if (status) {
      conditions.push({ status });
    }
    
    if (orderNo) {
      conditions.push({ orderNo: db.RegExp({ regexp: orderNo, options: 'i' }) });
    }
    
    if (startDate && endDate) {
      conditions.push({
        createTime: _.and(_.gte(new Date(startDate)), _.lte(new Date(endDate)))
      });
    }
    
    if (conditions.length > 0) {
      query = query.where(_.and(conditions));
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
        orders: result.data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  } catch (error) {
    throw new Error(`获取订单列表失败: ${error.message}`);
  }
}

// 更新订单状态（管理员）
async function updateOrderStatusAdmin(event, wxContext) {
  const { orderId, status, paymentStatus, trackingNo } = event;
  const openid = wxContext.OPENID;
  
  // 验证管理员权限
  const adminCheck = await checkAdminPermission(openid);
  if (!adminCheck.success) {
    return adminCheck;
  }
  
  try {
    const updateData = {
      updateTime: new Date()
    };
    
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (trackingNo) updateData.trackingNo = trackingNo;
    
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

// 生成订单号
function generateOrderNo() {
  const now = new Date();
  const timestamp = now.getTime();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MH${timestamp}${random}`;
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

// 获取订单统计数据
async function getOrderStats(event, wxContext) {
  const openid = wxContext.OPENID;
  
  try {
    // 获取全部订单数量（排除已取消）
    const allCount = await db.collection('orders')
      .where({ 
        openid,
        status: _.neq('cancelled')
      })
      .count();
    
    // 获取待支付订单数量
    const pendingCount = await db.collection('orders')
      .where({ openid, status: 'pending' })
      .count();
    
    // 获取待发货订单数量
    const paidCount = await db.collection('orders')
      .where({ openid, status: 'paid' })
      .count();
    
    // 获取待收货订单数量
    const shippedCount = await db.collection('orders')
      .where({ openid, status: 'shipped' })
      .count();
    
    // 获取已完成订单数量
    const completedCount = await db.collection('orders')
      .where({ openid, status: 'completed' })
      .count();
    
    return {
      success: true,
      data: {
        all: allCount.total,
        pending: pendingCount.total,  // 待支付
        paid: paidCount.total,        // 待发货
        shipped: shippedCount.total,  // 待收货
        completed: completedCount.total // 已完成
      }
    };
  } catch (error) {
    throw new Error(`获取订单统计失败: ${error.message}`);
  }
} 