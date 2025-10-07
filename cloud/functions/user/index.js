// 用户管理云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  
  try {
    switch (action) {
      case 'getProfile':
        return await getUserProfile(wxContext);
      case 'updateProfile':
        return await updateUserProfile(wxContext, event);
      case 'getAddresses':
        return await getUserAddresses(wxContext);
      case 'addAddress':
        return await addUserAddress(wxContext, event);
      case 'updateAddress':
        return await updateUserAddress(wxContext, event);
      case 'deleteAddress':
        return await deleteUserAddress(wxContext, event);
      case 'setDefaultAddress':
        return await setDefaultAddress(wxContext, event);
      default:
        return { success: false, message: '未知操作' };
    }
  } catch (error) {
    console.error('用户管理云函数错误:', error);
    return { success: false, message: error.message };
  }
};

// 获取用户资料
async function getUserProfile(wxContext) {
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
    throw new Error(`获取用户资料失败: ${error.message}`);
  }
}

// 更新用户资料
async function updateUserProfile(wxContext, event) {
  const { profileData } = event;
  const openid = wxContext.OPENID;
  
  try {
    const result = await db.collection('users').where({
      openid: openid
    }).update({
      data: {
        ...profileData,
        updateTime: new Date()
      }
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    throw new Error(`更新用户资料失败: ${error.message}`);
  }
}

// 获取用户地址列表
async function getUserAddresses(wxContext) {
  const openid = wxContext.OPENID;
  
  try {
    const result = await db.collection('addresses').where({
      openid: openid,
      deleted: false
    }).orderBy('isDefault', 'desc').orderBy('createTime', 'desc').get();
    
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    throw new Error(`获取地址列表失败: ${error.message}`);
  }
}

// 添加用户地址
async function addUserAddress(wxContext, event) {
  const { addressData } = event;
  const openid = wxContext.OPENID;
  
  try {
    // 如果是默认地址，先将其他地址设为非默认
    if (addressData.isDefault) {
      await db.collection('addresses').where({
        openid: openid,
        deleted: false
      }).update({
        data: {
          isDefault: false
        }
      });
    }
    
    const result = await db.collection('addresses').add({
      data: {
        ...addressData,
        openid: openid,
        deleted: false,
        createTime: new Date(),
        updateTime: new Date()
      }
    });
    
    return {
      success: true,
      data: { _id: result._id }
    };
  } catch (error) {
    throw new Error(`添加地址失败: ${error.message}`);
  }
}

// 更新用户地址
async function updateUserAddress(wxContext, event) {
  const { addressId, addressData } = event;
  const openid = wxContext.OPENID;
  
  try {
    // 如果是默认地址，先将其他地址设为非默认
    if (addressData.isDefault) {
      await db.collection('addresses').where({
        openid: openid,
        deleted: false
      }).update({
        data: {
          isDefault: false
        }
      });
    }
    
    const result = await db.collection('addresses').doc(addressId).update({
      data: {
        ...addressData,
        updateTime: new Date()
      }
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    throw new Error(`更新地址失败: ${error.message}`);
  }
}

// 删除用户地址
async function deleteUserAddress(wxContext, event) {
  const { addressId } = event;
  
  try {
    const result = await db.collection('addresses').doc(addressId).update({
      data: {
        deleted: true,
        updateTime: new Date()
      }
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    throw new Error(`删除地址失败: ${error.message}`);
  }
}

// 设置默认地址
async function setDefaultAddress(wxContext, event) {
  const { addressId } = event;
  const openid = wxContext.OPENID;
  
  try {
    // 先将所有地址设为非默认
    await db.collection('addresses').where({
      openid: openid,
      deleted: false
    }).update({
      data: {
        isDefault: false
      }
    });
    
    // 设置指定地址为默认
    const result = await db.collection('addresses').doc(addressId).update({
      data: {
        isDefault: true,
        updateTime: new Date()
      }
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    throw new Error(`设置默认地址失败: ${error.message}`);
  }
} 