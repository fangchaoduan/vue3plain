import { reactive } from "@vue/reactivity";
import { hasOwn, isFunction } from "@vue/shared";
import { VueComponent } from "vue";
import { initProps } from "./componentProps";
import { RenderVNode, VueInstance } from "./renderer";

//使用VueComponent类型的虚拟节点创建一个vue组件实例;
export function createComponentInstance(vnode: RenderVNode) {
  const instance: VueInstance = {//组件的实例;
    data: null,
    vnode,
    subTree: null,
    isMounted: false,
    update: null,
    propsOptions: (vnode.type as VueComponent).props,
    props: {},
    attrs: {},
    proxy: null,
    render: null,
  }
  return instance
}

//一些vue中的公开属性方法;
const publictPropertyMap = {
  $attrs: (instance: VueInstance) => instance.attrs
}

//vue组件实例的代理对象;
const publicInstanceProxy = {
  get(target: VueInstance, key: string | symbol) {
    const { data, props } = target
    if (data && hasOwn(data, key)) {
      //取data()上的值的流程;
      return data[key]
    } else if (props && hasOwn(props, key)) {
      //取props上的值的流程;
      return props[key]
    }

    //取this.$attrs的属性的流程;
    const getter = publictPropertyMap[key];//this.$attrs;得到一个取值的方法;
    if (getter) {
      //console.log('getter(target)--->',getter(target))
      return getter(target)
    }
  },
  set(target: VueInstance, key: string | symbol, value: any) {

    const { data, props } = target
    if (data && hasOwn(data, key)) {
      //赋值data()上的值的流程;
      data[key] = value
      return true

    } else if (props && hasOwn(props, key)) {
      //取props上的值的流程;

      //用户操作的属性是代理对象,在这里面被屏蔽了;
      //但是可以通过instance.props拿到真实的props并且进行更改;
      console.warn('禁止修改props上的属性' + (key as string))
      return false
    }
    return true
  }
}

//给vue组件实例进行赋值及代理;
export function setupComponent(instance: VueInstance) {
  const { props, type } = instance.vnode

  initProps(instance, props);//给实例赋上props及attrs的值;
  instance.proxy = new Proxy(instance, publicInstanceProxy)

  const data = (type as VueComponent).data

  if (data) {
    if (!isFunction(data)) {
      return console.warn('vue3中组件的data只能是函数,不能再像vue2中可以是对象了');
    }

    //instance实例的上data就是一个新增的响应式数据,它会收集instance.render()中依赖的effect;
    instance.data = reactive(data.call(instance.proxy))
  }

  instance.render = (type as VueComponent).render
}