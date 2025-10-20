// 清理无效头像数据脚本
// 在云开发控制台 → 数据库 → users 集合 → 数据 → 点击"新增记录"旁的"..." → "导入数据"

// 或者直接在云函数中执行：

const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 查找所有包含临时路径的用户
    const usersResult = await db.collection('users')
      .where({
        avatar: db.RegExp({
          regexp: '^wxfile://',  // 匹配以 wxfile:// 开头的
          options: 'i'
        })
      })
      .get();
    
    console.log('找到的无效头像用户数量:', usersResult.data.length);
    
    // 批量清空这些用户的头像字段
    const updatePromises = usersResult.data.map(user => {
      return db.collection('users')
        .doc(user._id)
        .update({
          data: {
            avatar: ''  // 清空头像
          }
        });
    });
    
    await Promise.all(updatePromises);
    
    return {
      success: true,
      message: `已清理 ${usersResult.data.length} 个用户的无效头像`,
      count: usersResult.data.length
    };
    
  } catch (error) {
    console.error('清理失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

