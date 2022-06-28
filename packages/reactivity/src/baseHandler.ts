import { activeEffect } from './effect'//引入的值是一个变量,它可能会变,可能会是ReactiveEffect实例,也可能是undefined;
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}
export const mutableHandlers = {
  get(target, key, receiver) {
    //这里可以监控到用户取值了;

    //所有被触发的get方法中,都会判断一次key是否为ReactiveFlags.IS_REACTIVE,如果是,就一定返回true;
    //代理对象上并没有ReactiveFlags.IS_REACTIVE这个属性,但是访问代理对象上的ReactiveFlags.IS_REACTIVE属性,会得到类似于属性值为true的效果;
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }

    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    //这里可以监控到用户设置值了;

    return Reflect.set(target, key, value, receiver)
  }
}