import { proxyRefs, reactive } from "@vue/reactivity";
import { hasOwn, isFunction, isObject, ShapeFlags } from "@vue/shared";
import { ComponentRender, VNodeChildren, VueComponent } from "vue";
import { initProps } from "./componentProps";
import { RenderVNode, VueInstance } from "./renderer";

//`当前执行vue组件实例`;
export let currentInstance: VueInstance | null = null;

//设置一个vue组件实例为`当前执行vue组件实例`;
export const setCurrentInstance = (instance: VueInstance | null) => currentInstance = instance
/* export const setCurrentInstance = (instance: VueInstance|null) => {
  return currentInstance = instance
} */

//获取`当前执行vue组件实例`;
export const getCurrentInstance = () => currentInstance
/* export const getCurrentInstance = (instance: VueInstance) => {
  return currentInstance
} */

//使用VueComponent类型的虚拟节点创建一个vue组件实例;
export function createComponentInstance(vnode: RenderVNode, parent: null | VueInstance) {
  //parent: {} -> child: {} -> grandson: {} ;
  const instance: VueInstance = {//组件的实例;
    ctx: {},
    provides: parent ? parent.provides : Object.create(null),//所有的组件用的都是父亲的provides;
    parent,
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
    next: null,
    setupState: {},
    slots: {},
  }
  return instance
}

//一些vue中的公开属性方法;
const publictPropertyMap = {
  $attrs: (instance: VueInstance) => instance.attrs,
  $slots: (instance: VueInstance) => instance.slots,
}

//vue组件实例的代理对象;
const publicInstanceProxy = {
  get(target: VueInstance, key: string | symbol) {
    const { data, props, setupState } = target
    //取值顺序由下方的if()顺序来;
    if (data && hasOwn(data, key)) {
      //取data()上的值的流程;
      return data[key]
    } else if (props && hasOwn(setupState, key)) {
      //取setup()返回出来对象的值的流程;
      return setupState[key]
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

    const { data, props, setupState } = target
    //赋值顺序由下方的if()顺序来;
    if (data && hasOwn(data, key)) {
      //赋值data()上的值的流程;
      data[key] = value
      //return true

    } else if (props && hasOwn(setupState, key)) {
      //赋值setup()返回出来对象的值的流程;
      setupState[key] = value
      //return true
    } else if (props && hasOwn(props, key)) {
      //赋值props上的值的流程;

      //用户操作的属性是代理对象,在这里面被屏蔽了;
      //但是可以通过instance.props拿到真实的props并且进行更改;
      console.warn('禁止修改props上的属性' + (key as string))
      return false
    }
    return true
  }
}

//初始化vue组件实例的插槽;
function initSlots(instance: VueInstance, children: VNodeChildren) {
  //判断实例上的虚拟节点是否是带插槽的;
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children as object //保留children,当成插槽的render()函数用来生成虚拟节点;
  }
}

//给vue组件实例进行赋值及代理;
export function setupComponent(instance: VueInstance) {
  const { props, type, children } = instance.vnode

  initProps(instance, props);//给实例赋上props及attrs的值;
  initSlots(instance, children)
  instance.proxy = new Proxy(instance, publicInstanceProxy)

  const data = (type as VueComponent).data

  if (data) {
    if (!isFunction(data)) {
      return console.warn('vue3中组件的data只能是函数,不能再像vue2中可以是对象了');
    }

    //instance实例的上data就是一个新增的响应式数据,它会收集instance.render()中依赖的effect;
    instance.data = reactive(data.call(instance.proxy))
  }

  const setup = (type as VueComponent).setup
  if (setup) {

    //上下文;
    const setupContext = {
      //事件的实现原理;
      //典型的发布订阅模式;
      //父组件上用`@事件名`来将订阅放到instance.vnode.props;子组件内部则用emit()将事件名对应的事件发布;
      //组件实例上的虚拟节点的props属性即instance.vnode.props,则是一个中转;
      emit: (event: string, ...args) => {
        //vue里面,@绑定的事件,会变成`onX`,即`前面加on,同时事件名首字母大写`;
        //把用户通过emit()传入的事件名处理成真正的props名;
        const eventName = `on${event[0].toUpperCase() + event.slice(1)}`

        //找到虚拟节点的属性在存放props,取出在h()函数中绑定的事件;
        const handler = instance.vnode.props[eventName]
        if (handler) {
          handler(...args)
        }
      },
      attrs: instance.attrs,
      slots: instance.slots,
    }

    setCurrentInstance(instance)
    //调用setup()时必定知道当前实例是谁;
    //而钩子函数需要用到当前实例;
    const setupResult = setup(instance.props, setupContext)
    setCurrentInstance(null)


    if (isFunction(setupResult)) {
      instance.render = setupResult as ComponentRender
    } else if (isObject(setupResult)) {
      //对内部的ref进行`取消.value`;
      instance.setupState = proxyRefs(setupResult)
    }
  }

  //依旧没新建render,便直接取实例虚拟节点上的render();
  if (!instance.render) {
    instance.render = (type as VueComponent).render
  }


}

export function renderComponent(instance: VueInstance) {
  const { vnode, render, props } = instance;
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    return render.call(instance.proxy, instance.proxy);//得到一个虚拟节点;//作为this,后续this会改;

  } else {
    return (vnode.type as Function)(props)
  }

}
