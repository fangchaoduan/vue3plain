import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";

//遍历地访问响应式对象的属性;
//考虑如果对象中有循环引用的问题;
function traversal(value, set: Set<Object> = new Set()) {
  //第一步递归要用终结条件,不是对象就不再递归了;
  if (!isObject(value)) {
    return value //如果不是对象,那么就说明只是访问了响应式对象内对象的属性值,此时返回出去是原始值就好了;
  }

  //来到这里,就一定是对象了;
  //如果是对象,并且已经访问过了,就直接返回当前对象值;
  if (set.has(value)) {
    return value
  }

  //先把当前对象放到set中,防止循环引用;
  set.add(value)
  for (let key in value) {//value可能有多个属性,如a与b等...;
    //console.log('key--->', key)
    traversal(value[key], set);//这里的属性值可能是对象,也可能是原始值;//这里只是访问响应式对象内对象的属性值,并不需要返回;
    //因为走到这一步,说明外部传入的必定是一个对象;所以需要返回的是整个对象,即后面的`return value`中的vaule必定为对象;
  }

  return value
}

//source是用户传入的对象,cb就是对应的用户的回调;
export function watch(source: Function | Object | undefined, cb: Function) {

  let getter: Function;
  if (isReactive(source)) {
    //对用户传入的数据 进行 循环;(递归循环,只要循环就会访问对象上的每一个属性,访问属性的时候会收集effect);
    //getter = () => source //相当于`getter = () => { return source }`;//但是此时并没有对数据进行访问,收集不了依赖;

    //遍历之后,就可以了;
    //递归循环地访问;
    getter = () => {
      return traversal(source)
    }
  } else if (isFunction(source)) {
    getter = source as Function
  } else {
    return
  }

  let cleanup: Function | undefined
  const onCleanup = (fn: Function | undefined) => {
    cleanup = fn//保存用户的函数;
  }
  let oldValue;
  //每次watch监听到的值变化了,都会调用一个job;
  const job = () => {
    if (cleanup) {
      cleanup();//下一次watch开始触发上一次watch的清理;
    }
    const newValue = effect.run()
    cb?.(newValue, oldValue, onCleanup)
    oldValue = newValue
  }
  //在effect中访问属性就会依赖收集
  const effect = new ReactiveEffect(getter, job)//监控自己构造的函数,变化后重新执行job();
  oldValue = effect.run()
}