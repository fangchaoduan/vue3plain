import { reactive } from "@vue/reactivity";
import { hasOwn } from "@vue/shared";
import { VueInstance } from "./renderer";

//把用户传入的rawProps中的属性区分成props或attrs,并挂载到实例instance上;
export function initProps(instance: VueInstance, rawProps: object) {
  const props = {};//要挂载到实例上props;
  const attrs = {};//要挂载到实例上的attrs;
  const options = instance.propsOptions || {}//用户设置的props选项;

  if (rawProps) {
    for (const key in rawProps) {
      const value = rawProps[key]
      if (hasOwn(options, key)) {
        props[key] = value
      } else {
        attrs[key] = value
      }
    }
  }

  //instance实例的上props就是一个新增的响应式数据,它会收集instance.render()中依赖的effect;
  instance.props = reactive(props)//用的应该是shallowReactive,但由于没写用的应该是shallowReactive这个方法,所以用reactive代替先;
  instance.attrs = attrs;
}

//新旧props是否发生了变化;
export const hasPropsChanged = (prevProps: object = {}, nextProps: object = {}): boolean => {
  const nextKeys = Object.keys(nextProps)

  //比对属性前后 个数是否一致;
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true
  }

  //比对属性对应的值是否一致; //如: {a:{xxx:xxx}} 与 {a:{qqq:qq}};
  //vue2中子组件传给父组件消息: this.$emit('xxx',data);直接就传了个新对象;
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i]
    if (nextProps[key] !== prevProps[key]) {
      return true
    }
  }
  return false
}

//用新的props响应式数据来更新旧的props响应式数据;
export function updateProps(prevProps: object, nextProps: object) {

  //直接用新props进行新增属性或重新赋值;
  for (const key in nextProps) {
    prevProps[key] = nextProps[key];//核心;//这里就会触发effect更新,但由于activeEffect都是同一个ReactiveEffect,所以没有多次更新;
  }

  //旧props之前有的,但新props的没有了则删除;
  for (const key in prevProps) {
    if (!hasOwn(nextProps, key)) {
      delete prevProps[key]
    }
  }

}