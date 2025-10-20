const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/**
 * 检查用户状态（是否被封禁）
 * @returns {Promise<Object>} { isBlocked: boolean, message: string }
 */
const checkUserStatus = async () => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'checkUserStatus'
      }
    });

    if (res.result && res.result.success) {
      return {
        isBlocked: res.result.data.isBlocked,
        status: res.result.data.status,
        message: res.result.data.message
      };
    } else {
      console.error('检查用户状态失败:', res);
      return {
        isBlocked: false,
        status: 'active',
        message: ''
      };
    }
  } catch (error) {
    console.error('检查用户状态异常:', error);
    // 出错时默认不拦截，避免误伤正常用户
    return {
      isBlocked: false,
      status: 'active',
      message: ''
    };
  }
}

/**
 * 显示账号被封禁的提示
 */
const showBlockedAlert = () => {
  wx.showModal({
    title: '账号已被封禁',
    content: '您的账号已被管理员封禁，无法进行购买操作。如有疑问，请联系客服。',
    showCancel: false,
    confirmText: '我知道了'
  });
}

module.exports = {
  formatTime,
  checkUserStatus,
  showBlockedAlert
}
