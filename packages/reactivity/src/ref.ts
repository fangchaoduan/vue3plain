import { isArray, isObject } from "@vue/shared"
import { activeEffect, ReactiveEffect, trackEffects, triggerEffects } from "./effect"
import { reactive } from "./reactive"

//如果是对象,就把对象转成响应式对象;
function toReactive(value: unknown) {
  return isObject(value) ? reactive(value as object) : value
}

class RefImpl {
  public dep: Set<ReactiveEffect> = new Set();
  public _value: any;//_value是存放经过响应式处理的值;
  public __v_isRef: boolean = true;

  //rawValue是存放用户传入的原始值;
  constructor(public rawValue: unknown) {
    this._value = toReactive(rawValue)
  }
  get value() {
    trackEffects(this.dep, activeEffect)
    return this._value
  }
  set value(newValue: unknown) {//watch;
    if (newValue !== this.rawValue) {
      this._value = toReactive(newValue)
      this.rawValue = newValue

      triggerEffects(this.dep)
    }
  }
}


export function ref(value: unknown) {
  return new RefImpl(value)
}

//也就是让`对象名[属性名].value`可以访问到`对象名[属性名]`;
//通过响应式对象与属性名生成一个ref对象;
class ObjectRefImpl { //只是将.value属性代理到原始类型上;
  constructor(public object: object, public key: PropertyKey) {

  }
  get value() {
    return this.object[this.key]//这里进行依赖收集;
  }
  set value(newValue) {
    this.object[this.key] = newValue//这里触发依赖的effect列表;
  }
}

//toRef把响应式数据的某个属性变成ref对象;
export function toRef(theObject: object, key: PropertyKey): ObjectRefImpl {
  return new ObjectRefImpl(theObject, key)
}

//把响应式数据变成ref对象,可以通过`.value`调用`响应式对象属性`拿到对应的属性值;
//比如: `ref对象[属性名].value`可以取到`响应式对象[属性名]`;
export function toRefs(object: object): object {
  const result = isArray(object) ? new Array(object.length) : {}

  for (const key in object) {
    result[key] = toRef(object, key);
  }

  return result
}

//把ref对象变成代理对象,可以通过`代理对象属性`调用`ref对象属性.value`拿到对应的属性值;
//比如: `代理对象名[属性名]`可以取到`ref对象名[属性名].value`;
//这个api一般用不到,一般只在vue内部渲染模版时才用到,用于简化模版数据的填入;
export function proxyRefs(object: object) {
  return new Proxy(object, {
    get(target, key, recevier) {
      const r = Reflect.get(target, key, recevier)
      return r.__v_isRef ? r.value : r//是ref的话,就帮它进入`.value`,不是ref,就直接返回原来的值;
    },
    set(target, key, value, recevier) {
      const oldValue = target[key]
      if (oldValue.__v_isRef) {//说明是ref;
        oldValue.value = value
        return true
      } else {
        return Reflect.set(target, key, value, recevier)
      }
    }
  })
}
