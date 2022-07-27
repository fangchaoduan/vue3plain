import { isNumber, isString, ShapeFlags } from "@vue/shared";
import { createVnode, Text, VNode } from "./vnode"

export type RenderOptions = {
  insert(child: Node, parent: Element, anchor?: Node): void;
  remove(child: Node): void;
  setElementText(el: Element, text: string): void;
  setText(node: Node, text: string): void;
  querySelector(selector: any): any;
  parentNode(node: Node): ParentNode;
  nextSibling(node: Node): ChildNode;
  createElement(tagName: string): HTMLElement;
  createText(text: string): Text;
  patchProp(el: HTMLElement, key: string, prevValue: any, nextValue: unknown): void
}

type RenderVNode = VNode | null | undefined
type RenderContainer = HTMLElement & {
  _vnode?: RenderVNode
};

export function createRenderer(renderOptions: RenderOptions) {
  const {
    //插入节点;
    insert: hostInsert,

    //remove-删除节点;
    remove: hostRemove,

    //修改元素中的文本;-当传入的是元素时;
    setElementText: hostSetElementText,
    //设置文本节点;-当传入的是文本节点时;
    setText: hostSetText,

    //查询元素;
    querySelector: hostQuerySelector,
    //查询父节点;
    parentNode: hostParentNode,
    //查询兄弟节点;
    nextSibling: hostNextSibling,

    //创建元素节点;
    createElement: hostCreateElement,
    //创建文本节点;
    createText: hostCreateText,
    patchProp: hostPatchProp,
  } = renderOptions

  //把数字或字符串转成VNode;
  const normalize = (child: string | VNode | number): VNode => {
    //是字符串时;
    if (isString(child)) {
      return createVnode(Text, null, child as string)
    }
    //是数字时;
    if (isNumber(child)) {
      return createVnode(Text, null, String(child))
    }
    //为虚拟节点时;
    return (child as VNode)
  }
  //根据`虚拟节点列表children`循环对比新旧虚拟节点,并创建出`虚拟节点对应真实DOM`,把`虚拟节点对应真实DOM`挂载到虚拟节点上,同时把`虚拟节点对应真实DOM`挂载到容器上;
  const mountChildren = (children: Array<string | VNode | number>, container: HTMLElement) => {
    for (let index = 0; index < children?.length; index++) {
      //debugger
      const child = normalize(children[index])
      patch(null, child, container)
    }
  }

  //创建出`虚拟节点对应真实DOM`,把`虚拟节点对应真实DOM`挂载到虚拟节点上,同时把`虚拟节点对应真实DOM`挂载到容器上;
  //1.先创建`虚拟节点type对应DOM元素`,同时将`虚拟节点type对应DOM元素`挂载到`虚拟节点`上;
  //2.再用`虚拟节点props`在`虚拟节点type对应DOM元素`上创建`DOM元素各项属性`;
  //3.再用`虚拟节点children`在`虚拟节点type对应DOM元素`上创建`DOM元素子元素`;
  const mountElement = (vnode: RenderVNode, container: RenderContainer) => {
    const { type, props, children, shapeFlag } = vnode

    //先创建父元素,并挂载到vnode上;
    vnode.el = hostCreateElement(type as string)//将真实元素挂载到这个虚拟节点上,后续用于复用节点和更新节点;
    const el = vnode.el

    //添加属性;//给父元素添加属性;
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    //是否子节点;//处理父元素的子节点;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {//文本; //假设shapeFlag为17时:17&8 => 0 => 等于0 =>false;
      hostSetElementText(el, children as string)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {//数组; //假设shapeFlag为17时:17&16 => 16 => 不等于0 =>true;
      //这里代表子节点是一个数组;
      //debugger
      mountChildren(children as (string | number | VNode)[], el)
    }

    //处理完之后,把整个元素丢到容器里;
    hostInsert(el, container)


  }

  const processText = (n1: RenderVNode, n2: RenderVNode, container: RenderContainer) => {
    if (n1 === null) {
      //hostInsert((n2.el = hostCreateText(n2.children as string)),container)

      n2.el = hostCreateText(n2.children as string)
      hostInsert(n2.el, container)
    }
  }

  //对比新旧虚拟节点,并创建出`虚拟节点对应真实DOM`,把`虚拟节点对应真实DOM`挂载到虚拟节点上,同时把`虚拟节点对应真实DOM`挂载到容器上;
  const patch = (n1: RenderVNode, n2: RenderVNode, container: RenderContainer) => {//核心的patch方法;
    //n2如果代表数字,那么应该为`h(Text, '文本')`而不是`h('文本')或h(undefined,'文本')`;
    //也就是说,文本只会出现在`h('h1', {}, [h('span', '文本'),'文本二'])`中的第三个参数中;
    //而`h()第三个参数`的处理一定会经过`mountChildren()`这个函数;
    //`mountChildren()`内部调用`normalize()`把字符串转成类型为symbol的VNode;


    if (n1 === n2) {
      //新旧节点都一样;
      return
    }

    const { type, shapeFlag } = n2
    if (n1 === null) {
      //初次渲染;
      //后续还有组件的初次渲染,目前还只是元素的初始化渲染;

      switch (type) {
        case Text:
          processText(n1, n2, container)
          break;

        default:
          if (shapeFlag & ShapeFlags.ELEMENT) {
            mountElement(n2, container)
          }
          break
      }

    } else {
      //更新流程;
    }
  }


  const unmount = (vnode: RenderVNode) => {
    hostRemove(vnode.el)//删除掉虚拟节点对应的DOM元素;
  }
  //vnode 虚拟DOM;
  //用新传入的虚拟节点,并把虚拟节点挂载到容器上;
  const render = (vnode: RenderVNode, container: RenderContainer) => {//渲染过程是用传入的`renderOptions`来进行渲染;
    //console.log('vnode--->', vnode, '\n container--->', container)

    //如果当前vnode是空的话;
    if (vnode === null) {
      //卸载逻辑;

      //之前确实渲染过了,那么就卸载掉dom;
      if (container._vnode) {
        unmount(container._vnode) //el;
      }

    } else {
      //这里即有初始化的逻辑,又有更新的逻辑;
      patch(container._vnode || null, vnode, container)
    }
    container._vnode = vnode
  }
  return {
    render
  }
}

//render(h('h1', '第一次文本'), app)
//render(h('h1', '第二次文本'), app)

//文本的处理,需要自己增加类型;因为不能通过`document.createElement('文本')`创建文本元素;
//根原因是h()的第一个参数只能是字符串,但这个字符串不能判断它为DOM类型名还是文本;
//而文本必定是`h()`的第二个参数或第三个参数中的,在处理子节点时处理包装一下文本为VNode节点就好了;
//如果`render()第一个参数`传入null的时候在渲染时,则是卸载逻辑,需要将DOM节点删掉;