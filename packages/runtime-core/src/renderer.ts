import { isNumber, isString, ShapeFlags } from "@vue/shared";
import { NodeOperateOptions } from "packages/runtime-dom/src/nodeOps";
import { ConvertibleVNode, createVnode, isSameVnode, Text, VNode } from "./vnode"

/* export type RenderOptions = {
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
} */

export type RenderOptions = NodeOperateOptions & {
  patchProp?: (el: HTMLElement, key: string, prevValue: any, nextValue: unknown) => void
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
  const normalize = (child: ConvertibleVNode): VNode => {
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

  /* //挂载子节点列表到容器上;
  //根据`虚拟节点列表children`循环对比新旧虚拟节点,并创建出`虚拟节点对应真实DOM`,把`虚拟节点对应真实DOM`挂载到虚拟节点上,同时把`虚拟节点对应真实DOM`挂载到容器上; */
  const mountChildren = (children: Array<ConvertibleVNode>, container: HTMLElement) => {
    for (let index = 0; index < children?.length; index++) {
      //debugger
      const child = normalize(children[index])
      patch(null, child, container)
    }
  }

  /* //创建出`虚拟节点对应真实DOM`,把`虚拟节点对应真实DOM`挂载到虚拟节点上,同时把`虚拟节点对应真实DOM`挂载到容器上;
  //1.先创建`虚拟节点type对应DOM元素`,同时将`虚拟节点type对应DOM元素`挂载到`虚拟节点`上;
  //2.再用`虚拟节点props`在`虚拟节点type对应DOM元素`上创建`DOM元素各项属性`;
  //3.再用`虚拟节点children`在`虚拟节点type对应DOM元素`上创建`DOM元素子元素`; */
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
      mountChildren(children as ConvertibleVNode[], el)
    }

    //处理完之后,把整个元素丢到容器里;
    hostInsert(el, container)


  }

  const processText = (n1: RenderVNode, n2: RenderVNode, container: RenderContainer) => {
    if (n1 === null) {
      //hostInsert((n2.el = hostCreateText(n2.children as string)),container)

      n2.el = hostCreateText(n2.children as string)
      hostInsert(n2.el, container)
    } else {
      //文本的内容变化了,可以复用老的节点(上的DOM元素);
      //n2.el = n1.el
      //const el = n2.el
      const el = n2.el = n1.el//复用DOM元素,减少性能损失;//这里的DOM元素必定为文本节点;

      //如果新旧文本节点的子节点不一样,则直接更新;
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children as string)//文本的更新;
      }
    }
  }

  const patchProps = (oldProps: object, newProps: object, el: HTMLElement) => {
    //新的里面有,直接用新的盖掉即可;
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key])
    }

    //如果老的里面有而新的没有,则是删除;
    for (const key in oldProps) {
      //debugger
      if (newProps[key] === null || newProps[key] === undefined) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }
  }

  //比较两个虚拟节点的子节点的差异,el就是当前两个虚拟节点对应的真实DOM元素;
  const patchChildren = (n1: RenderVNode, n2: RenderVNode, el: HTMLElement) => {
    //debugger

    const c1 = n1?.children || null//旧虚拟节点的子节点列表;
    const c2 = n2?.children || null//新虚拟节点的子节点列表;

    //子节点列表可能是: 文本, 空的null, 数组;

    //比较两个子节点列表的差异;
    
  }

  //用于进行虚拟节点为HTML元素的比对;
  //如果元素一样: 先复用节点,再比较属性,再比较儿子(子节点);
  const patchElement = (n1: RenderVNode, n2: RenderVNode) => {
    //复用节点;
    //debugger;
    //n2.el = n1.el;
    //const el = n2.el;
    const el = n2.el = n1.el //as HTMLElement //这个方法内的el,必定为元素;

    const oldProps = n1.props || {}//对象;//表示旧虚拟节点的props;
    const newProps = n2.props || {}//对象;//表示新虚拟节点的props;

    //比较属性;
    patchProps(oldProps, newProps, el)

    //比较子节点;
    patchChildren(n1, n2, el)
  }

  /* //比对元素时:
  //虚拟节点类型为元素时比对: 元素类型,元素属性,元素子节点;
  //虚拟节点类型为文本时比对: 文本内部(其实就是元素子节点);
  //虚拟节点类型为组件时比对: 组件属性,插槽; */
  const processElement = (n1: RenderVNode, n2: RenderVNode, container: RenderContainer) => {
    //旧节点n1为null,就创建新节点并插入到容器上;
    if (n1 === null) {
      mountElement(n2, container)
    } else {
      //元素比对;
      patchElement(n1, n2);
    }

  }

  //对比新旧虚拟节点,并创建出`虚拟节点对应真实DOM`,把`虚拟节点对应真实DOM`挂载到虚拟节点上,同时把`虚拟节点对应真实DOM`挂载到容器上;
  /* //对比新旧虚拟节点:
  //若新旧节点一致,就直接退出;
  //若新旧节点不一致;
  //若新节点元素类型为文本,那么用processText()创建文本节点进行处理;
  //若新节点元素类型不为文本,那么用processElement()创建对应元素进行处理; */
  const patch = (n1: RenderVNode, n2: RenderVNode, container: RenderContainer) => {//核心的patch方法;
    //n2如果代表数字,那么应该为`h(Text, '文本')`而不是`h('文本')或h(undefined,'文本')`;
    //也就是说,文本只会出现在`h('h1', {}, [h('span', '文本'),'文本二'])`中的第三个参数中;
    //而`h()第三个参数`的处理一定会经过`mountChildren()`这个函数;
    //`mountChildren()`内部调用`normalize()`把字符串转成类型为symbol的VNode;


    //新旧节点完全一致;
    if (n1 === n2) {
      //新旧节点都一样;
      return
    }

    //旧节点存在,但新旧节点元素类型不一致;
    //判断两个节点是否相同,不相同就卸载再添加;
    //debugger
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1)//删除老的;
      n1 = null;//旧节点置为null,再走后续的新增流程;
    }


    //虚拟节点类型为元素时比对: 元素类型,元素属性,元素子节点;
    //虚拟节点类型为文本时比对: 文本内部(其实就是元素子节点);
    //虚拟节点类型为组件时比对: 组件属性,插槽;
    const { type, shapeFlag } = n2

    switch (type) {
      case Text:
        processText(n1, n2, container)
        break;

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container)
        }
        break
    }

    /* const { type, shapeFlag } = n2
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
    } */
  }

  /* //1) 更新的逻辑思考:
  // - 如果前后元素完全没关系,删除老的,添加新的;
  // - 老的元素和新的元素一样,复用; 属性可能不一样,再比对属性,更新属性; 再比对儿子(子节点); */

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