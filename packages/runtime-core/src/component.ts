import { proxyRefs, reactive } from "@vue/reactivity";
import { hasOwn, isFunction, isObject } from "@vue/shared";
import { ComponentRender, VueComponent } from "vue";
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
    next: null,
    setupState: {}
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

  const setup = (type as VueComponent).setup
  if (setup) {
    const setupContext = {}//上下文;
    const setupResult = setup(instance.props, setupContext)
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