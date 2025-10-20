// 用户认证云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  
  try {
    switch (action) {
      case 'login':
        return await login(wxContext, event);
      case 'getUserInfo':
        return await getUserInfo(wxContext);
      case 'updateUserInfo':
        return await updateUserInfo(wxContext, event);
      case 'checkAdmin':
        return await checkAdmin(wxContext);
      case 'createAdmin':
        return await createAdmin(wxContext, event);
      default:
        return { success: false, message: '未知操作' };
    }
  } catch (error) {
    console.error('认证云函数错误:', error);
    return { success: false, message: error.message };
  }
};

// 用户登录
async function login(wxContext, event) {
  const { userInfo } = event;
  const openid = wxContext.OPENID;
  
  try {
    const userResult = await db.collection('users').where({
      openid: openid
    }).get();
    
    let user;
    if (userResult.data.length === 0) {
      // 新用户，创建用户记录
      const createResult = await db.collection('users').add({
        data: {
          openid: openid,
          nickname: (userInfo && userInfo.nickName) || '',
          avatar: (userInfo && userInfo.avatarUrl) || '',
          phone: '',
          createTime: new Date(),
          updateTime: new Date(),
          status: 'active'
        }
      });
      
      user = {
        _id: createResult._id,
        openid: openid,
        nickname: (userInfo && userInfo.nickName) || '',
        avatar: (userInfo && userInfo.avatarUrl) || '',
        phone: '',
        createTime: new Date(),
        updateTime: new Date(),
        status: 'active'
      };
    } else {
      // 已存在用户
      user = userResult.data[0];
      if (userInfo) {
        await db.collection('users').doc(user._id).update({
          data: {
            nickname: userInfo.nickName,
            avatar: userInfo.avatarUrl,
            updateTime: new Date()
          }
        });
        user.nickname = userInfo.nickName;
        user.avatar = userInfo.avatarUrl;
      }
    }
    
    return {
      success: true,
      data: {
        user: user,
        openid: openid
      }
    };
  } catch (error) {
    console.error('登录失败:', error);
    throw new Error(`登录失败: ${error.message}`);
  }
}

// 获取用户信息
async function getUserInfo(wxContext) {
  const openid = wxContext.OPENID;
  
  try {
    const result = await db.collection('users').where({
      openid: openid
    }).get();
    
    if (result.data.length === 0) {
      return { success: false, message: '用户不存在' };
    }
    
    return {
      success: true,
      data: result.data[0]
    };
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw new Error(`获取用户信息失败: ${error.message}`);
  }
}

// 更新用户信息
async function updateUserInfo(wxContext, event) {
  const { userInfo } = event;
  const openid = wxContext.OPENID;
  
  try {
    // 构建更新数据（避免使用对象展开语法）
    const updateData = Object.assign({}, userInfo, {
      updateTime: new Date()
    });
    
    // 执行更新
    await db.collection('users').where({
      openid: openid
    }).update({
      data: updateData
    });
    
    // 获取更新后的用户信息
    const userResult = await db.collection('users').where({
      openid: openid
    }).get();
    
    if (userResult.data.length === 0) {
      throw new Error('用户不存在');
    }
    
    return {
      success: true,
      data: {
        user: userResult.data[0]
      }
    };
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return {
      success: false,
      message: `更新用户信息失败: ${error.message}`
    };
  }
}

// 检查管理员权限
async function checkAdmin(wxContext) {
  const openid = wxContext.OPENID;
  
  try {
    const result = await db.collection('admin_users').where({
      openid: openid,
      status: 'active'
    }).get();
    
    return {
      success: true,
      data: {
        isAdmin: result.data.length > 0,
        adminInfo: result.data[0] || null
      }
    };
  } catch (error) {
    throw new Error(`检查管理员权限失败: ${error.message}`);
  }
}

// 创建管理员
async function createAdmin(wxContext, event) {
  const { adminInfo } = event;
  const openid = wxContext.OPENID;
  
  try {
    const data = Object.assign({}, adminInfo, {
      openid: openid,
      createTime: new Date(),
      updateTime: new Date(),
      status: 'active'
    });
    
    const result = await db.collection('admin_users').add({
      data: data
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    throw new Error(`创建管理员失败: ${error.message}`);
  }
} 