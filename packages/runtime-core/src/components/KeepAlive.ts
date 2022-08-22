import { ShapeFlags } from "@vue/shared";
import { onMounted } from "../apiLifecycle";
import { getCurrentInstance } from "../component";
import { isVnode, VNode } from "../vnode"


export const KeepAliveImpl = {
  __isKeepAlive: true,
  setup(props, { slots }) {

    const keys = new Set();//缓存的key;
    const cache: Map<any, VNode> = new Map();//那个key 对应的哪个虚拟节点;

    const instance = getCurrentInstance()
    const { createElement, move } = instance.ctx.renderer
    // debugger

    const storageContainer = createElement('div')//稍后要把渲染好的组件移入进行;

    let pendingCacheKey = null
    //要怎么操作dom元素;
    onMounted(() => {
      if (pendingCacheKey) {

        cache.set(pendingCacheKey, instance.subTree)//挂载完毕后缓存当前实例对应的subTree;
      }
      // debugger
    })

    //本身keep-alive无意义;
    return () => {
      // debugger
      //keep-alive 默认会去取slots的default属性返回的虚拟节点的第一个;
      const vnode = slots.default()//原则上这里应该是取的第一个,但为了方便,传入时一般只传入一个,并且不用数组包起来;

      //看一下vnode是不是组件,只有组件才能缓存;
      //必须是虚拟节点而且是带状态的组件;
      //也就是说如果不是虚拟节点或者该虚拟节点的类型是函数式组件而不是状态组件(即类组件)就直接返回,而不做缓存;
      if (!isVnode(vnode) || !((vnode as VNode).shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {
        return vnode
      }
      const comp = (vnode as VNode).type
      const key = (vnode.key === null || vnode.key === undefined) ? comp : vnode.key

      const cacheVnode = cache.get(key);//看有没有缓存过;
      if (cacheVnode) {

      } else {
        debugger
        keys.add(key)//缓存key;
        pendingCacheKey = key
        //cache.set(key, vnode)//这个缓存的是整个插槽的所有状态,但理论上只应缓存其中的某个状态;
      }


      return vnode
    }
  }
}
export const isKeepAlive = (vnode: VNode) => vnode.type.__isKeepAlive