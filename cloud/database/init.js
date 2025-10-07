// 数据库初始化脚本
const { COLLECTIONS } = require('../env.js');

// 商品分类初始数据
const categories = [
  {
    _id: 'cat_001',
    name: '0-3岁绘本',
    description: '适合0-3岁幼儿的绘本',
    image: '/images/category-0-3.jpg',
    sort: 1,
    status: 'active',
    createTime: new Date()
  },
  {
    _id: 'cat_002', 
    name: '3-6岁绘本',
    description: '适合3-6岁儿童的绘本',
    image: '/images/category-3-6.jpg',
    sort: 2,
    status: 'active',
    createTime: new Date()
  },
  {
    _id: 'cat_003',
    name: '6-12岁绘本', 
    description: '适合6-12岁儿童的绘本',
    image: '/images/category-6-12.jpg',
    sort: 3,
    status: 'active',
    createTime: new Date()
  },
  {
    _id: 'cat_004',
    name: '教育绘本',
    description: '具有教育意义的绘本',
    image: '/images/category-education.jpg',
    sort: 4,
    status: 'active',
    createTime: new Date()
  }
];

// 盲盒商品初始数据
const products = [
  {
    _id: 'prod_001',
    name: '经典童话盲盒',
    description: '包含经典童话故事绘本，让孩子重温经典',
    price: 99,
    originalPrice: 129,
    categoryId: 'cat_002',
    stock: 100,
    sales: 0,
    tags: ['经典', '童话', '3-6岁'],
    contents: [
      '小红帽',
      '三只小猪',
      '白雪公主',
      '灰姑娘',
      '丑小鸭'
    ],
    probability: {
      '小红帽': 0.3,
      '三只小猪': 0.25,
      '白雪公主': 0.2,
      '灰姑娘': 0.15,
      '丑小鸭': 0.1
    },
    status: 'active',
    createTime: new Date(),
    updateTime: new Date()
  },
  {
    _id: 'prod_002',
    name: '科普启蒙盲盒',
    description: '培养孩子科学思维的启蒙绘本',
    price: 119,
    originalPrice: 149,
    categoryId: 'cat_003',
    stock: 80,
    sales: 0,
    tags: ['科普', '启蒙', '6-12岁'],
    contents: [
      '奇妙的宇宙',
      '动物世界',
      '植物王国',
      '科学实验',
      '发明家故事'
    ],
    probability: {
      '奇妙的宇宙': 0.25,
      '动物世界': 0.25,
      '植物王国': 0.2,
      '科学实验': 0.2,
      '发明家故事': 0.1
    },
    status: 'active',
    createTime: new Date(),
    updateTime: new Date()
  }
];

// 管理员用户初始数据
const adminUsers = [
  {
    _id: 'admin_001',
    openid: '', // 需要替换为实际的管理员openid
    nickname: '超级管理员',
    role: 'super_admin',
    permissions: ['all'],
    status: 'active',
    createTime: new Date()
  }
];

module.exports = {
  categories,
  products,
  adminUsers,
  COLLECTIONS
}; 