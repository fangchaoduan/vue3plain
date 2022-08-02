//入参是否是对象;
export const isObject = (value: any): boolean => {
  return typeof value === 'object' && value !== null
}

//入参是否是字符串;
export const isString = (value: any): boolean => {
  return typeof value === 'string'
}

//入参是否是数字;
export const isNumber = (value: any): boolean => {
  return typeof value === 'number'
}

//入参是否是方法;
export const isFunction = (value: any): boolean => {
  return typeof value === 'function'
}

//入参是否是数组;
export const isArray = Array.isArray;

//把第一个入参设置为原型,并以此原型返回一个新对象;
export const assign = Object.assign;

//查看一个属性是否在对象原型上;
const hasOwnProperty = Object.prototype.hasOwnProperty

//判断key是否是value上的一个属性;
export const hasOwn = (value: any, key: PropertyKey): boolean => hasOwnProperty.call(value, key)

//ShapeFlags表示节点自身类型,并且子节点是数组还是字符串;
export const enum ShapeFlags {
  ELEMENT = 1, //1<<0; //元素; 
  FUNCTIONAL_COMPONENT = 2, //1<<1; //函数式组件;
  STATEFUL_COMPONENT = 4, //1<<2; //状态组件(正常的选项式组件);
  TEXT_CHILDREN = 8, //1<<3; //;
  ARRAY_CHILDREN = 16, //1<<4; //;
  SLOTS_CHILDREN = 32, //1<<5; //;
  TELEPORT = 64, //1<<6; //;
  SUSPENSE = 128, //1<<7; //;
  COMPONENT_SHOULD_KEEP_ALIVE = 256, //1<<8; //;
  COMPONENT_KEPT_ALIVE = 512, //1<<9; //;
  COMPONENT = 6 //COMPONENT = ShapeFlags.FUNCTIONAL_COMPONENT | ShapeFlags.STATEFUL_COMPONENT; //即: COMPONENT = 2 | 4;//组件包含函数式组件与状态组件;
}
/* //位运算:&,|适合权限的组合;
//let user= 增加 | 删除;//user&增加 > 0就说明有权限;
const 有子元素的元素 = ShapeFlags.ELEMENT | ShapeFlags.ARRAY_CHILDREN//1|16=17;
console.log('有子元素的元素--->',有子元素的元素)
const 是否包含子元素数组 = ShapeFlags.ARRAY_CHILDREN & 有子元素的元素
console.log('是否包含子元素数组--->',是否包含子元素数组) */