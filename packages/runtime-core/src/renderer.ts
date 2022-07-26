import { ShapeFlags } from "@vue/shared";
import { VNode, VNodeChildren } from "./vnode"

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

  const mountChildren = (children: Array<string | VNode | number>, container: HTMLElement) => {
    for (let index = 0; index < children?.length; index++) {
      //debugger
      patch(null, children[index], container)
    }
  }
  const mountElement = (vnode: RenderVNode, container: RenderContainer) => {
    const { type, props, children, shapeFlag } = vnode

    //先创建父元素,并挂载到vnode上;
    const el = vnode.el = hostCreateElement(type)//将真实元素挂载到这个虚拟节点上,后续用于复用节点和;

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
  const patch = (n1: RenderVNode, n2: string | number |RenderVNode, container: RenderContainer) => {//核心的patch方法;
    //n2可能是一个文本或数字;(数字当成字符串处理);
    if (n1 === n2) {
      //新旧节点都一样;
      return
    }

    if (n1 === null) {
      //初次渲染;
      //后续还有组件的初次渲染,目前还只是元素的初始化渲染;
      mountElement(n2, container)
    } else {
      //更新流程;
    }
  }


  //vnode 虚拟DOM;
  const render = (vnode: RenderVNode, container: RenderContainer) => {//渲染过程是用传入的`renderOptions`来进行渲染;
    //console.log('vnode--->', vnode, '\n container--->', container)

    //如果当前vnode是空的话;
    if (vnode === null) {
      //卸载逻辑;
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