// 在微信开发者工具控制台执行此脚本
// 用于清除当前用户的云端数据

(async function clearUserData() {
  console.log('🧹 开始清除用户数据...');
  
  try {
    // 1. 清除本地存储
    wx.clearStorageSync();
    console.log('✅ 1/3 本地数据已清除');
    
    // 2. 清除云端用户信息
    const userResult = await wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'deleteMyself'  // 需要添加这个功能
      }
    });
    console.log('✅ 2/3 云端用户数据已清除:', userResult);
    
    // 3. 清除购物车数据
    const cartResult = await wx.cloud.callFunction({
      name: 'cart',
      data: {
        action: 'clearAll'
      }
    });
    console.log('✅ 3/3 购物车数据已清除:', cartResult);
    
    console.log('🎉 清除完成！请重新编译小程序');
    
  } catch (error) {
    console.error('❌ 清除失败:', error);
  }
})();

