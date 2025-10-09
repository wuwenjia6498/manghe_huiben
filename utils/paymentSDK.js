/**
 * 微信支付SDK - 简化版
 * 基于微信支付V3 API实现的支付解决方案
 */

/**
 * 完整的支付流程
 * @param {Object} userInfo 用户信息
 * @param {Object} options 支付选项
 * @returns {Promise} 支付结果
 */
function processPayment(userInfo, options = {}) {
  console.log('=== 微信支付SDK：开始支付流程 ===');
  
  return new Promise((resolve) => {
    try {
      // 参数验证
      if (!userInfo || !userInfo.nickName) {
        resolve({
          success: false,
          message: '用户信息不完整',
          code: 'INVALID_USER_INFO'
        });
        return;
      }
      
      // 第一步：创建支付订单
      console.log('第一步：创建支付订单');
      createOrder(userInfo, options)
        .then((orderResult) => {
          if (!orderResult.success) {
            resolve(orderResult);
            return;
          }
          
          // 第二步：调起微信支付
          console.log('第二步：调起微信支付');
          return requestPayment(orderResult.payParams)
            .then((paymentResult) => {
              // 返回完整的支付结果
              resolve({
                success: paymentResult.success,
                message: paymentResult.message,
                orderNo: orderResult.orderNo,
                prepayId: orderResult.prepayId,
                transactionId: paymentResult.transactionId || '',
                cancelled: paymentResult.cancelled || false,
                code: paymentResult.code,
                timestamp: Date.now()
              });
            });
        })
        .catch((error) => {
          console.error('支付流程异常:', error);
          resolve({
            success: false,
            message: error.message || '支付异常',
            code: 'PAYMENT_EXCEPTION',
            timestamp: Date.now()
          });
        });
      
    } catch (error) {
      console.error('微信支付SDK异常:', error);
      resolve({
        success: false,
        message: error.message || '支付异常',
        code: 'PAYMENT_EXCEPTION',
        timestamp: Date.now()
      });
    }
  });
}

/**
 * 创建支付订单
 * @param {Object} userInfo 用户信息
 * @param {Object} options 订单选项
 * @returns {Promise} 订单创建结果
 */
function createOrder(userInfo, options = {}) {
  console.log('=== 微信支付SDK：创建订单 ===');
  
  return new Promise((resolve) => {
    // 显示加载提示
    wx.showLoading({
      title: '创建订单中...',
      mask: true
    });
    
    // 调用云函数创建订单
    wx.cloud.callFunction({
      name: 'createPayment',
      data: {
        userInfo: userInfo,
        options: options,
        timestamp: Date.now()
      },
      success: (res) => {
        wx.hideLoading();
        console.log('订单创建云函数响应:', res);
        
        if (res.result && res.result.success) {
          resolve({
            success: true,
            orderNo: res.result.data.orderNo,
            prepayId: res.result.data.prepayId,
            payParams: res.result.data.payParams
          });
        } else {
          resolve({
            success: false,
            message: res.result ? res.result.message : '创建订单失败',
            code: 'CREATE_ORDER_FAILED'
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('调用创建订单云函数失败:', error);
        resolve({
          success: false,
          message: error.errMsg || '调用云函数失败',
          code: 'CLOUD_FUNCTION_ERROR'
        });
      }
    });
  });
}

/**
 * 调起微信支付
 * @param {Object} payParams 支付参数
 * @returns {Promise} 支付结果
 */
function requestPayment(payParams) {
  console.log('=== 微信支付SDK：调起微信支付 ===');
  console.log('支付参数:', payParams);
  
  return new Promise((resolve) => {
    wx.requestPayment({
      timeStamp: payParams.timeStamp,
      nonceStr: payParams.nonceStr,
      package: payParams.package,
      signType: payParams.signType,
      paySign: payParams.paySign,
      success: (res) => {
        console.log('微信支付成功:', res);
        resolve({
          success: true,
          message: '支付成功',
          code: 'SUCCESS',
          transactionId: res.transactionId || ''
        });
      },
      fail: (error) => {
        console.error('微信支付失败:', error);
        
        // 用户取消支付
        if (error.errMsg && error.errMsg.includes('cancel')) {
          resolve({
            success: false,
            cancelled: true,
            message: '用户取消支付',
            code: 'USER_CANCEL'
          });
        } else {
          // 其他支付错误
          resolve({
            success: false,
            message: error.errMsg || '支付失败',
            code: 'PAYMENT_FAILED'
          });
        }
      }
    });
  });
}

// 导出函数
module.exports = {
  processPayment
};

