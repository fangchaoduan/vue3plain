import { isFunction } from "@vue/shared"
import { activeEffect, ReactiveEffect, track, trackEffects, triggerEffects } from "./effect"
class ComputedRefImpl {
  public effect: ReactiveEffect | null | undefined = null;//计算属性对应的effect,内部依赖于`计算属性getter方法中用到的响应式对象`;如果`计算属性getter方法中用到的响应式对象`的值变了,那么将会执行该`计算属性effect`;
  public _dirty: boolean = true;//默认应该取值的时候进入计算;
  public __v_isReadonly: boolean = true;
  public __v_isRef: boolean = true;
  public _value: unknown;
  public dep: Set<ReactiveEffect> = new Set();//用来记录引用到了该计算属性的effect;//如果计算属性的值变动了,那么将会让这些effect列表都执行一次;

  constructor(getter: Function, public setter: Function) {

    //我们将用户的getter放到effect中,这里面的firnamw和lastname就会被这个effect收集起来;
    this.effect = new ReactiveEffect(getter, () => {
      //稍后依赖的属性变化会执行此调度函数;
      //debugger

      if (!this._dirty) {
        this._dirty = true

        //实现一个触发更新;
        triggerEffects(this.dep)
      }

      //到第P9-32:09;
    })
  }

  //类中的属性访问器,底层就是Object.definedProperty();
  get value() {

    //做依赖收集,用计算属性的值收集其它effect;
    //track(this, 'get', 'value')

    trackEffects(this.dep, activeEffect)

    if (this._dirty) {//说明这个值是脏的;
      this._dirty = false//说明不脏了,用于屏蔽再次取值;
      this._value = this.effect.run()
    }
    return this._value
  }
  set value(newValue) {
    this.setter(newValue)
  }
}
export const computed = (getterOrOptions: Function | { get?: Function, set?: Function }) => {
  const onlyGetter = isFunction(getterOrOptions)
  let getter: Function
  let setter: Function

  if (onlyGetter) {
    getter = getterOrOptions as Function
    setter = () => { console.warn(`no set ;计算属性没有设置set方法;`) }
  } else {
    getter = (getterOrOptions as { get?: Function, set?: Function })?.get || (() => { console.warn(`计算属性没有设置get方法;`) });
    setter = (getterOrOptions as { get?: Function, set?: Function })?.set || (() => { console.warn(`no set ;计算属性没有设置set方法;`) });
  }
  return new ComputedRefImpl(getter, setter)
}