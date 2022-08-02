import { reactive } from "@vue/reactivity";
import { hasOwn } from "@vue/shared";
import { VueInstance } from "./renderer";

//把用户传入的rawProps中的属性区分成props或attrs,并挂载到实例instance上;
export function initProps(instance: VueInstance, rawProps: object) {
  //debugger

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

  //这里props不希望在组件内部被更改,但是props得是响应式的;因为后续属性变化了要更新视图,用的应该是shallowReactive,但由于没写用的应该是shallowReactive这个方法,所以用reactive代替先;
  instance.props = reactive(props)//用的应该是shallowReactive,但由于没写用的应该是shallowReactive这个方法,所以用reactive代替先;
  //props中: 
  //能: 如果父组件改了props -> 子组件上的props变化 -> 子组件更新; 
  //不能: 子组件改了props ->不应该让子组件更新; 
  //如果props用的reactive(),就会导致子组件也更新了 -> 同时还改了父组件中props的值;
  //如果props用的shallowReactive(),就是props的子属性改了,子组件也不会更新;
  //更改props的主动权应该交给父组件,故而应该用shallowReactive()浅响应式;

  instance.attrs = attrs;

}