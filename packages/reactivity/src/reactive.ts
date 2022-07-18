import { isObject } from "@vue/shared";
import { mutableHandlers, ReactiveFlags } from "./baseHandler";

//用来记录一个对象是否已经设置了代理,做一个缓存,如果已经做了代理,就直接返回之前设置过的代理对象;
//1) 实现同一个对象,代理多次,返回同一个代理;
const reactiveMap: WeakMap<object, object> = new WeakMap()//key只能是对象;

//查看一个变量是否为响应式对象中数据;
export function isReactive(value): boolean {
  return !!value?.[ReactiveFlags.IS_REACTIVE]
}
//1) 将数据转化成响应式的数据,reactive只能做对象的代理;
export function reactive(target: Object): Object | undefined {
  if (!isObject(target)) {
    return
  }
  //若是普通对象进行代理,会通过new Proxy代理一次;
  //若是代理对象进行代理,可以看一下他有没有被代理过,如果访问这个代理对象,有get方法的时间说明就访问过了;


  const exisitingProxy = reactiveMap.get(target)
  if (exisitingProxy) {
    return exisitingProxy
  }

  //如果目标是一个代理对象,那么一定被代理过了,那么就会走该代理对象的get方法;
  //而如果该目标对象是reactive生成的代理对象,那么访问ReactiveFlags.IS_REACTIVE属性时,就一定会返回true;
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }

  const proxy: Object = new Proxy(target, mutableHandlers)


  reactiveMap.set(target, proxy)
  return proxy
}


