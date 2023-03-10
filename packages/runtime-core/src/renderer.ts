import { reactive } from "@vue/reactivity";
import { hasOwn, invokeArrayFns, isArray, isNumber, isString, PatchFlags, ShapeFlags } from "@vue/shared";
import { ReactiveEffect } from "@vue/reactivity";
import { NodeOperateOptions } from "packages/runtime-dom/src/nodeOps";
import { getSequence } from "./sequence";
import { ComponentRender, ConvertibleVNode, createVnode, Fragment, isSameVnode, Text, VNode, VNodeChildren, VueComponent } from "./vnode"
import { queueJob } from "./scheduler";
import { hasPropsChanged, initProps, updateProps } from "./componentProps";
import { createComponentInstance, renderComponent, setupComponent } from "./component";
import { LifecycleHooks } from "./apiLifecycle";
import { TeleportComponent } from "./components/Teleport";
import { isKeepAlive } from "./components/KeepAlive";


export type RenderOptions = NodeOperateOptions & {
  patchProp: (el: HTMLElement, key: string, prevValue: any, nextValue: unknown) => void
}

export type RenderVNode = null | undefined | VNode & {
  component?: null | undefined | VueInstance;
}
export type RenderContainer = HTMLElement & {
  _vnode?: null | undefined | RenderVNode;
};

export type VueInstance = {//组件的实例;
  ctx: {
    activate?: (vnode: VNode & { component?: VueInstance; }, container: RenderContainer, anchor: RenderAnchor) => void;
    deactivate?: (vnode: RenderVNode) => void;
    renderer?: {
      createElement: (tagName: string) => HTMLElement,
      move(vnode: RenderVNode, container: RenderContainer, anchor?: RenderAnchor): void
    }
  },//实例的上下文,KeepAlive要用到;
  provides: object;//该组件的依赖;//所有组件用的都是父组件的provides;
  parent: null | VueInstance;//父组件;
  data: null | object;//实例的状态;
  vnode: VNode;  //vue2的源码中组件的虚拟节点叫$vnode,渲染的内容叫_vnode;//vue3中的虚拟节点就叫vnode;
  subTree: VNode | null;//vnode:组件的虚拟节点; subTree:渲染的组件内容,即render返回的虚拟节点或模板编译出来的虚拟节点?
  isMounted: boolean;//组件是否已经挂载了;
  update: null | Function;//让组件强制进行更新更新的方法;
  propsOptions: object;//组件上的props属性;//如VueComponent.props即vnode.type.props;//vnode.VueComponent实际上就是用户在h()中传的第二个参数;
  props: object;//组件的props,即特意声明的props;
  attrs: object;//组件的attrs,即不声明的属性;
  proxy: object | null;//代理对象,用来当成组件的render()的this;
  next: null | VNode,//下次更新需要使用的新的虚拟节点,是一个临时变量,更新时就会重新清空;
  render?: ComponentRender | null;//用户在h()函数第一个入参的render()方法;
  setupState: object,//用户在h()函数第一个入参的render()方法运行后返回的对象;
  slots: object,//组件的插槽相关内容;
} & {
    [lifecycle in LifecycleHooks]?: Array<Function>;//组件生命周期钩子函数;
  };


export type RenderAnchor = HTMLElement | Text | null | undefined

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

  //把数字或字符串转成VNode,影响到原子节点数组;
  const normalize = (child: ConvertibleVNode[], index: number): VNode => {
    //是字符串或数字时;
    if (isString(child[index]) || isNumber(child[index])) {
      const vnode = createVnode(Text, null, String(child[index]))
      child[index] = vnode
    }

    //为虚拟节点时;
    return (child[index] as VNode)
  }

  /* //挂载子节点列表到容器上;
  //根据`虚拟节点列表children`循环对比新旧虚拟节点,并创建出`虚拟节点对应真实DOM`,把`虚拟节点对应真实DOM`挂载到虚拟节点上,同时把`虚拟节点对应真实DOM`挂载到容器上; */
  const mountChildren = (children: Array<ConvertibleVNode>, container: HTMLElement, parentComponent: null | VueInstance = null) => {
    for (let index = 0; index < children?.length; index++) {
      //debugger
      const child = normalize(children, index)//处理后要进行替换,否则children中存放的依旧是字符串;
      patch(null, child, container, null, parentComponent)
    }
  }

  /* //创建出`虚拟节点对应真实DOM`,把`虚拟节点对应真实DOM`挂载到虚拟节点上,同时把`虚拟节点对应真实DOM`挂载到容器上;
  //1.先创建`虚拟节点type对应DOM元素`,同时将`虚拟节点type对应DOM元素`挂载到`虚拟节点`上;
  //2.再用`虚拟节点props`在`虚拟节点type对应DOM元素`上创建`DOM元素各项属性`;
  //3.再用`虚拟节点children`在`虚拟节点type对应DOM元素`上创建`DOM元素子元素`; */
  const mountElement = (vnode: RenderVNode, container: RenderContainer, anchor: RenderAnchor = null, parentComponent: null | VueInstance) => {
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
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {//文本;
      hostSetElementText(el, children as string)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {//数组;
      //这里代表子节点是一个数组;
      //debugger
      mountChildren(children as ConvertibleVNode[], el, parentComponent)
    }

    //处理完之后,把整个元素丢到容器里;
    hostInsert(el, container, anchor)


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
        hostPatchProp(el, key, oldProps[key], undefined)
      }
    }
  }

  const unmountChildren = (children: VNode[], parentComponent: null | VueInstance) => {
    for (let index = 0; index < children.length; index++) {
      //debugger
      unmount(children[index], parentComponent)
    }
  }


  const patchKeyedChildren = (c1: VNode[], c2: VNode[], el: HTMLElement, parentComponent: null | VueInstance) => {//比较两个元素
    let i = 0;//表示新旧虚拟节点从前向后循环时最后一个相等的角标;
    let e1 = c1.length - 1;//表示旧虚拟节点从前向后循环时最后一个相等的角标;
    let e2 = c2.length - 1;//表示新虚拟节点从前向后循环时最后一个相等的角标;

    //特殊处理...........
    //用于减少进行diff算法比较的范围;
    //先分别比较新虚拟节点与旧虚拟节点的前面及后面的同等节点;留下中间不同的以便乱序比较;
    //原因是因为一个数组变动前后,前面和后面会有一大块的内容不改变;

    //sync from start;从前面往后比;
    for (; i <= e1 && i <= e2; i++) {//有任何一方停止循环,则直接跳出;
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVnode(n1, n2)) {
        //debugger
        patch(n1, n2, el)//这样做就是比较两个节点的属性和子节点;
      } else {
        break
      }
    }

    //sync from end;从后面往前比;
    for (; i <= e1 && i <= e2; e1--, e2--) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el)
      } else {
        break
      }
    }

    //console.log('i--->', i, 'e1--->', e1, 'e2--->', e2)//尽可能减少比较的内容;

    //有一方全部比较完毕了,要么就删除,要么就添加;
    if (i > e1) {
      //common sequence + mount;同序列挂载;
      //i比e1大,说明有新增的;
      //i和e2之间的是新增的部份;//即[i,i+1,i+2,...,e2]中对应角标是要新增的;
      if (i <= e2) {
        for (; i <= e2; i++) {
          const nextPos = e2 + 1;//表示e2的下一个元素;
          //根据下一个人的索引来看参照物;
          const anchor = nextPos < c2.length ? c2[nextPos].el : null
          patch(null, c2[i], el, anchor)//创建新节点,扔到容器中;
        }
      }
    } else if (i > e2) {
      //common sequence + unmount;同序列卸载;
      //i比e2大,说明有要卸载的;
      //i和e1之间的是卸载的部份;//即[i,i+1,i+2,...,e1]中对应角标是要卸载的;
      if (i <= e1) {
        for (; i <= e1; i++) {
          unmount(c1[i], parentComponent)
        }
      }
    }

    //优化完毕-------------------------------------;

    //乱序比对;

    //思路:
    //用新虚拟节点乱序部份的key及新虚拟节点角标做一个映射表;
    //用循环旧虚拟节点乱序部份的key从映射表中拿到对应新虚拟节点;如果没找到,说明该旧虚拟节点要被删除;如果找到,用一个数组记录下新虚拟节点乱序部份角标及`旧虚拟节点角标+1`的映射关系,并比对新旧虚拟节点关系;
    //对新虚拟节点乱序部份循环了一遍,根据新虚拟节点乱序部份角标及`旧虚拟节点角标+1`的映射关系来倒叙进行插入或创建;

    //console.log('i--->', i, 'e1--->', e1, 'e2--->', e2)
    // debugger
    let s1 = i;
    let s2 = i;

    const keyToNewIndexMap: Map<any, number> = new Map()//key -> newIndex;
    for (let index = s2; index <= e2; index++) {
      keyToNewIndexMap.set(c2[index].key, index)
    }

    //循环老的元素 看一下新的里面有没有,如果有说明要比较差异,没有要添加到列表中,老的有新的没有要删除;
    const toBePatched = e2 - s2 + 1;//新的总个数;
    const newIndexToOldIndexMap: number[] = new Array(toBePatched).fill(0)//一个记录是否比对过的映射表;//新节点总个数中顺序对应着老虚拟节点的角标;



    for (let index = s1; index <= e1; index++) {
      const oldChild = c1[index];//老的孩子;
      const newIndex = keyToNewIndexMap.get(oldChild.key)//用老的孩子去新的里面找;
      if (newIndex === undefined) {
        unmount(oldChild, parentComponent)//多余的删掉;
      } else {
        //新的位置对应的老的位置; //如果数组里放的值>0,说明已经patch过了;
        newIndexToOldIndexMap[newIndex - s2] = index + 1;//用来标记当前所patch过的结果;
        patch(oldChild, c2[newIndex], el)
      }
    }
    //到这只是新老属性和儿子的比对,没有移动位置;//也没有新增过新节点中多余出来的节点;
    //console.log('newIndexToOldIndexMap--->', JSON.parse(JSON.stringify(newIndexToOldIndexMap)))


    //获取最长递增子序列;
    const increment = getSequence(newIndexToOldIndexMap)

    //需要移动位置;
    //目前无论如何都做了一遍倒叙进行插入或创建;
    let j = increment.length - 1
    //console.log('increment--->', increment)
    for (let theIndex = toBePatched - 1; theIndex >= 0; theIndex--) {//[3,2,1,0];
      const index = theIndex + s2
      const current = c2[index];//找到当前节点;(最后没做过处理的要新增的元素);
      const anchor = index + 1 < c2.length ? c2[index + 1].el : null
      if (newIndexToOldIndexMap[theIndex] === 0) {
        //创建;
        //之前的表类似于[5,3,4,0];//值为0,说明没patch过,就说明要创建;
        patch(null, current, el, anchor)//创建新节点;

        //newIndexToOldIndexMap一般为[5,3,4,0]例如: 
        //[5,3,4,0] -> 对应角标theIndex[0,1,2,3] -> 最长递增角标[1,2] -> 对应递增值[3,4] -> 要改的值为[5]与[0] -> 要改的值对应角标theIndex为[0]与[3],其中[0]为插入以改变排序,[3]为新增并插入;

      } else {
        //不是0,说明是已经比对过属性和儿子的了;

        //console.log(theIndex,increment,j,increment[j])
        if (theIndex !== increment[j]) {
          hostInsert(current.el, el, anchor)
        } else {
          console.log('这里不做插入了;')
          j-- //如果i===increment[theIndex],则说明这个节点不用动;同时j要减一,用于下次比较;
        }

        //插入;//复用了节点;//不过这些节点也已经在标识时patch过了;
        //目前无论如何都做了一遍倒叙插入,其实可以不用全部都插入一遍;
        //可以根据刚才的数组来减少插入次数;
        //可以用最长递增子序列来实现,处于最长递增子序列中的数据,可以不用插入;只需要改变不是处于最长递增子序列中的元素就可以了;
        //hostInsert(current.el, el, anchor)
      }

      //这里发现缺失逻辑,需要看一下current有没有el,如果没有el说明是新增的逻辑;

      //当前的节点是新增的没有所谓的el;
      //hostInsert(current.el,el,anchor);

      //最长递增子序列来实现; //vue2在移动元素的时候会有浪费; //优化,这个只是优化diff算法中乱序比对数组时的创建及插入的性能浪费;
    }

  }

  //全量比较虚拟节点的子节点列表;
  //比较两个虚拟节点的子节点的差异,el就是当前两个虚拟节点对应的真实DOM元素;
  const patchChildren = (n1: RenderVNode, n2: RenderVNode, el: HTMLElement, parentComponent: null | VueInstance = null) => {
    const c1 = n1?.children || null//旧虚拟节点的子节点列表;
    const c2 = n2?.children || null//新虚拟节点的子节点列表;

    const prevShapeFlag = n1.shapeFlag;//之前的虚拟节点的类型;
    const shapeFlag = n2.shapeFlag;//之后的虚拟节点的类型;

    /* //子节点列表可能是: 文本, 空的null, 数组;
      新子节点列表	旧子节点列表	操作方式;
      文本	数组	（删除旧节点列表，设置文本内容）;
      文本	文本	（设置文本内容）;
      数组	数组	（diff算法）;
      数组	文本	（清空文本，进行挂载）;
      空	数组	（删除旧节点列表）;
      空	文本	（清空文本）;
      旧儿子为空时,processElement()里不调用patchElement(),同时patchChildren()是在patchElement()里的,走不到这个方法;
      文本	空	（设置文本内容);
      数组	空	（进行挂载）;
      空	空	（无需处理）;
     */
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {//判断新虚拟节点为文本;
      //两种情况:
      //文本	数组	（删除旧节点列表，设置文本内容）;
      //文本	文本	（设置文本内容）;//更新文本相当于设置文本内容;
      //这里的思路是如果老节点是数组,那么就先删除旧节点列表;
      //之后不管老节点的类型,只要新老节点的子节点不相等,统一设置文本内容;

      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {//判断老节点为数组;
        //删除所有子节点;
        unmountChildren(c1 as VNode[], parentComponent)//文本	数组	（删除旧节点列表，设置文本内容）;
      }

      if (c1 !== c2) {
        hostSetElementText(el, c2 as string)//文本	文本	（设置文本内容）;包括了文本和空;
      }

    } else {
      //目前新虚拟节点为数组或者为空;

      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) { //判断老虚拟节点为数组;
        //两种情况;
        //数组	数组	（diff算法）;
        //空	数组	（删除旧节点列表）;
        //这里的思路是如果新虚拟节点为数组,进行子节点列表的对比,里面用到了diff算法;
        //如果新虚拟节点不为数组,卸载掉所有的旧虚拟节点;

        //判断新虚拟节点为数组;
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          //diff算法;
          patchKeyedChildren(c1 as VNode[], c2 as VNode[], el, parentComponent)
        } else {
          //现在新虚拟节点不是数组,就代表新虚拟节点为空? (文本和空 删除以前的);
          unmountChildren(c1 as VNode[], parentComponent)
        }
      } else {
        //两种情况;
        //空	文本	（清空文本）;
        //数组	文本	（清空文本，进行挂载）;
        //这里的思路是如果老节点为文本,那么不管当前新节点为数组还是空,都直接清空当前文本;
        //如果当前新节点为数组,那么就挂载新节点的子节点;

        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {//判断老虚拟节点为文本;
          hostSetElementText(el, '')
        }

        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {//判断新虚拟节点为数组;
          mountChildren(c2 as ConvertibleVNode[], el, parentComponent)
        }

      }
    }

  }

  //靶向更新;
  const patchBlockChildren = (n1: RenderVNode, n2: RenderVNode, parentComponent: null | VueInstance) => {
    for (let i = 0; i < n2.dynamicChildren.length; i++) {
      //之前是树的递归比较,现在是数组的比较;
      patchElement(n1.dynamicChildren[i], n2.dynamicChildren[i], parentComponent)
    }
  }

  //用于进行虚拟节点为HTML元素的比对;
  //如果元素一样: 先复用节点,再比较属性,再比较儿子(子节点);
  const patchElement = (n1: RenderVNode, n2: RenderVNode, parentComponent: null | VueInstance) => {
    //复用节点;
    const el = n2.el = n1.el as HTMLElement //这个方法内的el,必定为元素;

    const oldProps = n1.props || {}//对象;//表示旧虚拟节点的props;
    const newProps = n2.props || {}//对象;//表示新虚拟节点的props;

    //比较属性;

    const { patchFlag } = n2
    //console.log('oldProps?.class--->', oldProps?.class, 'newProps?.class--->', newProps?.class,)
    //console.log('patchFlag--->', patchFlag)
    if (patchFlag & PatchFlags.CLASS) {
      if (oldProps?.class !== newProps?.class) {
        //debugger
        hostPatchProp(el, 'class', null, newProps.class)
      }
      //像style .. 与事件等,都可以仿照这个来进行靶向更新;
    } else {
      //比较所有属性;
      patchProps(oldProps, newProps, el)
    }

    //比较子节点;
    //debugger
    //n2 = normalize(n2)//这里n2的子节点可能还是个数组,数组中可能并不是VNode,要把子节点转成VNode;
    if (isArray(n2.children)) {
      for (let index = 0; index < (n2.children as Array<ConvertibleVNode>)?.length; index++) {
        //debugger
        n2.children[index] = normalize(n2.children as Array<ConvertibleVNode>, index)//处理后要进行替换,否则children中存放的依旧是字符串;
      }
    }

    //这里的patchChildren()是一个全量的diff算法;
    //不过有些节点是非动态节点,实际更新时,一般只要比较动态节点就好了;
    //查看新虚拟节点是否有动态节点;
    //有动态节点数组,直接比对动态节点数组--数组的比较;
    //没动态节点数组,就和之前一样比对子节点列表--树的递归比较;
    if (n2.dynamicChildren) {
      // debugger
      //元素之间的优化--靶向更新,只比较动态节点了;
      console.log("n2.dynamicChildren--->", n2.dynamicChildren);
      patchBlockChildren(n1, n2, parentComponent)
    } else {
      //h1还在这呢;
      patchChildren(n1, n2, el, parentComponent)
    }

  }

  //处理元素:
  const processElement = (n1: RenderVNode, n2: RenderVNode, container: RenderContainer, anchor: RenderAnchor = null, parentComponent: null | VueInstance) => {
    //旧节点n1为null,就创建新节点并插入到容器上;
    if (n1 === null) {
      mountElement(n2, container, anchor, parentComponent)
    } else {
      //元素比对;
      patchElement(n1, n2, parentComponent);
    }

  }

  //处理空标签;
  const processFragment = (n1: RenderVNode, n2: RenderVNode, container: RenderContainer, parentComponent: null | VueInstance) => {
    if (n1 === null || n1 === undefined) {
      if (!isArray(n2.children)) {
        console.log("Fragment的子节点不是数组,直接退出挂载");
        return
      }
      mountChildren(n2.children, container, parentComponent)//走的是新增,直接把子节点挂载到容器中;
    } else {
      //走的是比对,比对新旧虚拟节点的子节点列表;

      //debugger//这里n2的子节点可能还是个数组,数组中可能并不是VNode,要把子节点转成VNode;
      if (isArray(n2.children)) {
        for (let index = 0; index < (n2.children as Array<ConvertibleVNode>)?.length; index++) {
          //debugger
          n2.children[index] = normalize(n2.children as Array<ConvertibleVNode>, index)//处理后要进行替换,否则children中存放的依旧是字符串;
        }
      }

      patchChildren(n1, n2, container, parentComponent)//走的是diff算法;
    }
  }



  //把vue组件挂载到容器上;
  const mountComponent = (vnode: RenderVNode, container: RenderContainer, anchor: RenderAnchor = null, parentComponent: null | VueInstance) => {
    //1) 要创造一个组件的实例;
    const instance = vnode.component = createComponentInstance(vnode, parentComponent)

    if (isKeepAlive(vnode)) {
      instance.ctx.renderer = {
        createElement: hostCreateElement,//创建元素用这个方法;
        move(vnode: RenderVNode, container: RenderContainer) {//move的vnode肯定是组件;
          hostInsert(vnode.component.subTree.el, container)
        }
      }
    }
    //2) 给实例上赋值并进行代理;
    setupComponent(instance)
    //3) 根据vue组件实例创建一个effect,并赋值到vue组件实例上;
    setupRenderEffect(instance, container, anchor)
  }

  //vue组件实例在运行render()前的处理逻辑;
  const updateComponentPreRender = (instance: VueInstance, next: VNode) => {
    instance.next = null;//清空next;
    instance.vnode = next;//实例上最新的虚拟节点;
    updateProps(instance.props, next.props)

    // instance.slots = next.children as object //更新插槽;//应该还要做比对的,但目前简单点,直接用新的代替老的;
    //这样写不行,组件中setup()中解析后,依旧会是老对象;
    //也就是说,这里直接改了整个引用,产生了新引用及旧引用,但setup()如果用花括号语法解析,那么setup()中引用的永远是旧引用;实际上需要的是更新旧引用的值就好了;

    Object.assign(instance.slots, next.children as object)//更新插槽;
    // debugger
  }

  //根据vue组件实例创建一个effect,并赋值到vue组件实例上;//effect中将创建一个虚拟节点,并将虚拟节点挂载到容器上;
  const setupRenderEffect = (instance: VueInstance, container: RenderContainer, anchor: RenderAnchor = null) => {
    const { render, vnode } = instance
    const componentUpdateFn = () => {//区分是初始化,还是要更新;
      //console.log('instance--->', instance)
      if (!instance.isMounted) {
        //初始化;

        const { bm, m } = instance //生命周期;
        //生命周期钩子-onBeforeMount-组件实例挂载前;
        if (bm) {
          invokeArrayFns(bm)
        }

        //const subTree: VNode = render.call(instance.proxy, instance.proxy);//得到一个虚拟节点;//作为this,后续this会改;
        const subTree: VNode = renderComponent(instance);//得到一个虚拟节点;//作为this,后续this会改;
        patch(null, subTree, container, anchor, instance)//创造了subTree的真实节点并且插入了容器;


        instance.subTree = subTree//将虚拟节点挂载到实例上;
        instance.isMounted = true

        // instance.vnode.el = subTree.el//把虚拟节点上绑定的el,存到vnode的el上;
        //生命周期钩子-onMounted-组件实例挂载后;
        // 得先等subTree好之后才调用;
        if (m) {//一定要保证subTree已经有了,再去调用mounted;
          invokeArrayFns(m)
        }
      } else {
        //组件内部更新;

        const { next } = instance
        if (next) {
          //更新前,也需要拿到最新的属性来进行更新;
          updateComponentPreRender(instance, next)
        }

        //console.log('组件内部更新;')

        const { bu, u } = instance //生命周期;
        //生命周期钩子-onBeforeUpdate-组件实例更新前;
        if (bu) {
          invokeArrayFns(bu)
        }

        //const subTree: VNode = render.call(instance.proxy, instance.proxy);//得到一个新的节点;
        const subTree: VNode = renderComponent(instance);//得到一个虚拟节点;//作为this,后续this会改;
        patch(instance.subTree, subTree, container, anchor, instance)
        instance.subTree = subTree//将新节点保存到实例上,变成下次更新时的老节点;

        // console.log('instance.subTree--->', instance.subTree)
        //生命周期钩子-onUpdated-组件实例更新后;
        if (u) {
          invokeArrayFns(u)
        }
      }
    }

    //组件的异步更新;
    const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(instance.update as Function))//默认创建时是不会运行第一个入参的函数的;

    //将组件强制更新的逻辑保存到了组件的实例上,后续可以使用;
    const update = instance.update = effect.run.bind(effect)//调用effect.run()可以让组件强制重新渲染; //执行运行第一个入参的函数;
    update()
  }

  //比对新旧组件对应的虚拟节点,看是否要更新;
  const shouldUpdateComponent = (n1: RenderVNode, n2: RenderVNode) => {
    //插槽就是children;
    const { props: prevProps, children: prevChildren } = n1;
    const { props: nextProps, children: nextChildren } = n2;
    //只要有插槽就强制进行更新,不用比对;
    if (prevChildren || nextChildren) {//有孩子就一定要更新,没孩子才去再去比较属性;
      return true
    }

    //没插槽,并且属性一样,就不用更新;
    if (prevProps === nextProps) {
      return false
    }
    return hasPropsChanged(prevProps, nextProps)
  }

  //更新组件;
  const updateComponent = (n1: RenderVNode, n2: RenderVNode) => {
    //instance.props 是响应式的,而且可以更改; 属性的更新会导致页面重新渲染;
    //debugger
    const instance = (n2.component = n1.component)//对于元素而言,复用的是dom节点;对于组件来说,复用的是实例;//而执行这个方法,必定要复用组件,减少花销;

    //属性更新;
    //updateProps(instance, prevProps, nextProps)
    //后续插槽发生了变化 逻辑和updateProps()肯定是不一样;

    //没必要分别比对props及插槽,只要一个方法确定是否要更新,之后直接调用vue组件实例的更新方法就可以了;
    //需要更新就强制调用组件的update()方法;
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;//将新的虚拟节点放到next属性上;
      //debugger
      instance.update()//统一调用update()方法来进行更新;
    }
  }
  //处理组件;
  const processComponent = (n1: RenderVNode, n2: RenderVNode, container: RenderContainer, anchor: RenderAnchor = null, parentComponent: null | VueInstance) => {//统一处理组件,里面再区分是普通的还是函数式组件;
    //不过函数式组件已经不建议使用了;[函数式组件-vue官方文档](https://v3.cn.vuejs.org/guide/migration/functional-components.html#函数式组件);

    if (n1 === null) {//keep-alive组件时:假设my1->my2->my1;
      // debugger
      if (n2.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        //keep-alive组件的挂载;
        parentComponent.ctx.activate(n2, container, anchor)
      } else {
        mountComponent(n2, container, anchor, parentComponent)//组件的挂载;
      }
      //mountComponent(n2, container, anchor, parentComponent)

    } else {
      //组件更新靠的是props;
      updateComponent(n1, n2)
    }

  }



  //div -> My; //A -> Fragment -> My;
  //对比新旧虚拟节点,并创建出`虚拟节点对应真实DOM`,把`虚拟节点对应真实DOM`挂载到虚拟节点上,同时把`虚拟节点对应真实DOM`挂载到容器上;
  const patch = (n1: RenderVNode, n2: RenderVNode, container: RenderContainer, anchor: RenderAnchor = null, parentComponent: null | VueInstance = null) => {
    // debugger
    //新旧节点完全一致;
    if (n1 === n2) {
      return
    }
    //旧节点存在,但新旧节点元素类型不一致;//判断两个节点是否相同,不相同就卸载再添加;
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1, parentComponent)//删除老的;
      n1 = null;//旧节点置为null,再走后续的新增流程;
    }

    //虚拟节点类型为元素时比对: 元素类型,元素属性,元素子节点;
    //虚拟节点类型为文本时比对: 文本内部(其实就是元素子节点);
    //虚拟节点类型为组件时比对: 组件属性,插槽;
    const { type, shapeFlag } = n2
    switch (type) {
      case Text://文本的标签;
        processText(n1, n2, container)
        break;
      case Fragment://无用的标签;
        processFragment(n1, n2, container, parentComponent)
        break
      default: //元素的标签;
        if (shapeFlag & ShapeFlags.ELEMENT) {
          //debugger
          processElement(n1, n2, container, anchor, parentComponent)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          //文档一般只能在会的时候看,不会的时候很难看懂;
          processComponent(n1, n2, container, anchor, parentComponent)
        } else if (shapeFlag & ShapeFlags.TELEPORT) {
          // debugger
          (type as TeleportComponent).process(n1, n2, container, anchor, {
            mountChildren,
            patchChildren,
            move(vnode: RenderVNode, container: Element, anchor: RenderAnchor) {
              hostInsert(vnode.component ? vnode.component.subTree.el : vnode.el, container, anchor)
            }
            //... 其它方法;
          })
        }
        break
    }
  }


  const unmount = (vnode: RenderVNode, parentComponent: null | VueInstance) => {
    // debugger
    if (vnode.type === Fragment) {//Fragment删除的时候,要清空儿子,不是删除真实dom;
      return unmountChildren(vnode.children as VNode[], parentComponent)
    } else if (vnode.shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
      return parentComponent.ctx.deactivate(vnode);//直接把虚拟节点传递给keep-alive组件中删除的方法;//进入这个if分支里,parentComponent必定为keep-alive组件;vnode为插槽;
      // return 
    } else if (vnode.shapeFlag & ShapeFlags.COMPONENT) {//如果是vnode的话,就移除组件的真实节点;
      // console.log('真实的卸载: vnode--->', vnode)
      return unmount(vnode.component.subTree, null)
    }
    hostRemove(vnode.el)//删除掉虚拟节点对应的DOM元素;//el.removeChild();
  }

  //用新传入的虚拟节点,并把虚拟节点挂载到容器上;
  const render = (vnode: RenderVNode, container: RenderContainer) => {//渲染过程是用传入的`renderOptions`来进行渲染;
    //console.log('vnode--->', vnode, '\n container--->', container)

    //如果当前vnode是空的话;
    if (vnode === null || vnode === undefined) {
      //卸载逻辑;

      //之前确实渲染过了,那么就卸载掉dom;
      if (container._vnode) {
        unmount(container._vnode, null)
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

//文本的处理,需要自己增加类型;因为不能通过`document.createElement('文本')`创建文本元素;
//根原因是h()的第一个参数只能是字符串,但这个字符串不能判断它为DOM类型名还是文本;
//而文本必定是`h()`的第二个参数或第三个参数中的,在处理子节点时处理包装一下文本为VNode节点就好了;
//如果`render()第一个参数`传入null的时候在渲染时,则是卸载逻辑,需要将DOM节点删掉;