// 购物车管理云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  
  try {
    switch (action) {
      case 'addToCart':
        return await addToCart(event, wxContext);
      case 'getCartItems':
        return await getCartItems(event, wxContext);
      case 'updateCartItem':
        return await updateCartItem(event, wxContext);
      case 'removeFromCart':
        return await removeFromCart(event, wxContext);
      case 'clearCart':
        return await clearCart(event, wxContext);
      case 'getCartCount':
        return await getCartCount(event, wxContext);
      default:
        return { success: false, message: '未知操作' };
    }
  } catch (error) {
    console.error('购物车云函数错误:', error);
    return { success: false, message: error.message };
  }
};

// 添加商品到购物车
async function addToCart(event, wxContext) {
  const { productId, quantity = 1 } = event;
  const openid = wxContext.OPENID;
  
  try {
    // 检查商品是否存在
    const productResult = await db.collection('products').doc(productId).get();
    if (!productResult.data) {
      return { success: false, message: '商品不存在' };
    }
    
    const product = productResult.data;
    
    // 检查库存
    if (product.stock < quantity) {
      return { success: false, message: '库存不足' };
    }
    
    // 检查购物车中是否已存在该商品
    const cartResult = await db.collection('cart').where({
      openid: openid,
      productId: productId
    }).get();
    
    if (cartResult.data.length > 0) {
      // 更新数量
      const cartItem = cartResult.data[0];
      const newQuantity = cartItem.quantity + quantity;
      
      if (product.stock < newQuantity) {
        return { success: false, message: '库存不足' };
      }
      
      await db.collection('cart').doc(cartItem._id).update({
        data: {
          quantity: newQuantity,
          updateTime: new Date()
        }
      });
    } else {
      // 新增购物车项
      await db.collection('cart').add({
        data: {
          openid: openid,
          productId: productId,
          productName: product.name,
          price: product.price,
          quantity: quantity,
          createTime: new Date(),
          updateTime: new Date()
        }
      });
    }
    
    return {
      success: true,
      message: '已添加到购物车'
    };
  } catch (error) {
    throw new Error(`添加到购物车失败: ${error.message}`);
  }
}

// 获取购物车商品列表
async function getCartItems(event, wxContext) {
  const openid = wxContext.OPENID;
  
  try {
    const result = await db.collection('cart')
      .where({ openid })
      .orderBy('createTime', 'desc')
      .get();
    
    // 验证商品信息并更新价格
    const cartItems = [];
    let totalAmount = 0;
    
    for (const item of result.data) {
      const productResult = await db.collection('products').doc(item.productId).get();
      
      if (productResult.data && productResult.data.status === 'active') {
        const product = productResult.data;
        const cartItem = {
          ...item,
          productName: product.name,
          productPrice: product.price,
          totalPrice: item.quantity * product.price
        };
        
        cartItems.push(cartItem);
        
        if (item.isAvailable) {
          totalAmount += cartItem.totalPrice;
        }
        
        // 如果价格有变化，更新购物车
        if (item.price !== product.price) {
          await db.collection('cart').doc(item._id).update({
            data: {
              price: product.price,
              updateTime: new Date()
            }
          });
        }
      } else {
        // 商品已下架，删除购物车项
        await db.collection('cart').doc(item._id).remove();
      }
    }
    
    return {
      success: true,
      data: {
        cartItems: cartItems.map(item => ({
          ...item,
          productName: item.productName,
          productPrice: item.productPrice,
          totalPrice: item.totalPrice
        })),
        totalAmount: totalAmount,
        count: cartItems.length
      }
    };
  } catch (error) {
    throw new Error(`获取购物车失败: ${error.message}`);
  }
}

// 更新购物车商品数量
async function updateCartItem(event, wxContext) {
  const { cartItemId, quantity } = event;
  const openid = wxContext.OPENID;
  
  try {
    // 验证购物车项归属
    const cartResult = await db.collection('cart').doc(cartItemId).get();
    if (!cartResult.data || cartResult.data.openid !== openid) {
      return { success: false, message: '购物车项不存在或无权操作' };
    }
    
    const cartItem = cartResult.data;
    
    // 检查商品库存
    const productResult = await db.collection('products').doc(cartItem.productId).get();
    if (!productResult.data) {
      return { success: false, message: '商品不存在' };
    }
    
    if (productResult.data.stock < quantity) {
      return { success: false, message: '库存不足' };
    }
    
    // 更新数量
    if (quantity <= 0) {
      // 删除购物车项
      await db.collection('cart').doc(cartItemId).remove();
    } else {
      await db.collection('cart').doc(cartItemId).update({
        data: {
          quantity: quantity,
          updateTime: new Date()
        }
      });
    }
    
    return {
      success: true,
      message: '更新成功'
    };
  } catch (error) {
    throw new Error(`更新购物车失败: ${error.message}`);
  }
}

// 从购物车删除商品
async function removeFromCart(event, wxContext) {
  const { cartItemId } = event;
  const openid = wxContext.OPENID;
  
  try {
    // 验证购物车项归属
    const cartResult = await db.collection('cart').doc(cartItemId).get();
    if (!cartResult.data || cartResult.data.openid !== openid) {
      return { success: false, message: '购物车项不存在或无权操作' };
    }
    
    await db.collection('cart').doc(cartItemId).remove();
    
    return {
      success: true,
      message: '已从购物车删除'
    };
  } catch (error) {
    throw new Error(`删除购物车项失败: ${error.message}`);
  }
}

// 清空购物车
async function clearCart(event, wxContext) {
  const openid = wxContext.OPENID;
  
  try {
    await db.collection('cart').where({ openid }).remove();
    
    return {
      success: true,
      message: '购物车已清空'
    };
  } catch (error) {
    throw new Error(`清空购物车失败: ${error.message}`);
  }
}

// 获取购物车商品数量
async function getCartCount(event, wxContext) {
  const openid = wxContext.OPENID;
  
  try {
    const result = await db.collection('cart').where({ openid }).count();
    
    return {
      success: true,
      data: {
        count: result.total
      }
    };
  } catch (error) {
    throw new Error(`获取购物车数量失败: ${error.message}`);
  }
} 