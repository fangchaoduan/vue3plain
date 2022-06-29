import { activeEffect, track, trigger } from './effect'//引入的值是一个变量,它可能会变,可能会是ReactiveEffect实例,也可能是undefined;
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}
export const mutableHandlers = {
  get(target: Object, key: PropertyKey, receiver: unknown): unknown {
    //这里可以监控到用户取值了;

    //所有被触发的get方法中,都会判断一次key是否为ReactiveFlags.IS_REACTIVE,如果是,就一定返回true;
    //代理对象上并没有ReactiveFlags.IS_REACTIVE这个属性,但是访问代理对象上的ReactiveFlags.IS_REACTIVE属性,会得到类似于属性值为true的效果;
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }

    //console.log('key--->', key)
    //console.log('activeEffect--->', activeEffect)
    //场景:
    //对象 -> 多个属性 -> 多个effect
    //WeakMap={对象Map:{属性string:effect的Set集合}}
    //{对象:{name:[]}}
    //单向记录;//即单向指的是 属性记录了ReactiveEffect实例;
    //反向记录: 应该也让ReactiveEffect实例记录它被那些对象的那些属性收集过;
    track(target, `get`, key, activeEffect)

    return Reflect.get(target, key, receiver)
  },
  set(target: Object, key: PropertyKey, value: unknown, receiver: any): boolean {
    //这里可以监控到用户设置值了;
    const oldValue: unknown = target[key]//此时还没改原对象,所以从源对象里取的值依旧是老值;
    const result = Reflect.set(target, key, value, receiver)
    if (oldValue !== value) {//值变化了;
      //要更新;
      trigger(target, `set`, key, value, oldValue)
    }

    return result
  }
}
