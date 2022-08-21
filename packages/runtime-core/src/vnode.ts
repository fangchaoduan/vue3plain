//type,即节点类型;props,属性;children,子节点;

import { isArray, isFunction, isObject, isString, PatchFlags, ShapeFlags } from "@vue/shared";
import { isTeleport, TeleportComponent } from "./components/Teleport";


export const Text = Symbol('Text')//用于h()函数内部创建文本的标识;
export const Fragment = Symbol('Fragment')//用于h()函数内部创建Fragment的标识,表示无用的标签,没什么实际意义的标签;

//判断一个变量是否为虚拟DOM;
export function isVnode(value) {
  return !!value?.__v_isVnode
}

//判断两个虚拟节点是否是相同节点;
//思路是: 1) 标签名相同; 2) key是一样的;
export function isSameVnode(n1: VNode, n2: VNode) {
  return (n1.type === n2.type) && (n1.key === n2.key)
}

export type ComponentRender = () => VNode
export type ComponentSetup = (props?: object, context?: object) => (ComponentRender | object)
export type VueComponent = {
  data?: () => (object);//vue2中data可以是函数或对象;但vue3中data只能是函数;
  render?: ComponentRender;
  props?: (() => (object)) | object;
  setup?: ComponentSetup;
  [propName: string]: any;//可以定义多余属性;
}

//虚拟节点的type类型;
export type VNodeType = string | Symbol | VueComponent | TeleportComponent | (() => VNode)

//虚拟节点的props类型;
export declare type VNodeProps = undefined | null | {
  class?: null | undefined | object,
  [property: string]: any,
}

//虚拟节点的children类型;//如果是对象,则代理是组件的插槽;
export type VNodeChildren = undefined | null | ConvertibleVNode | Array<ConvertibleVNode> | object

//虚拟节点类型,可以认为它不包含null与undefined;
export type VNode = {
  type: VNodeType;
  props: VNodeProps;
  children: VNodeChildren;
  el: null | HTMLElement | Text;//虚拟节点上对应的真实节点,后续diff算法优化要用到;
  key: any;
  __v_isVnode: boolean;
  shapeFlag: number;
  patchFlag: PatchFlags;//动态虚拟节点标识;
  dynamicChildren?: VNode[];//动态节点节点类型;
}

//可转化为虚拟节点的类型;
export type ConvertibleVNode = string | VNode | number

//虚拟节点有很多:组件的,元素的,文本的等; //h('h1);
export function createVnode(type: VNodeType, props: VNodeProps, children: VNodeChildren = null, patchFlag: PatchFlags = 0): VNode {
  //组合方案 shapeFlag;
  //想知道一个元素中包含的是多个儿子还是一个儿子;
  //标识;

  // debugger
  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT :
    isTeleport(type) ? ShapeFlags.TELEPORT ://针对不同的类型增添shapeFlag;
      isFunction(type) ? ShapeFlags.FUNCTIONAL_COMPONENT :
        isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : 0;

  //虚拟DOM就是一个对象,用于diff算法等的优化;真实DOM的属性比较多;
  const vnode: VNode = {//key;
    type,
    props,
    children,
    el: null,//虚拟节点上对应的真实节点,后续diff算法优化要用到;
    key: props?.['key'],
    __v_isVnode: true,
    shapeFlag,
    patchFlag,
  }
  if (children) {
    let type = 0;
    if (isArray(children)) {
      //说明是子节点列表;
      type = ShapeFlags.ARRAY_CHILDREN;
    } else if (isObject(children)) {
      //说明是组件的插槽;
      type = ShapeFlags.SLOTS_CHILDREN;//说明这个组件是带有插槽的;
    } else {
      //说明是单独的一个子节点;
      children = String(children)
      type = ShapeFlags.TEXT_CHILDREN
    }
    //vnode.shapeFlag |= type
    vnode.shapeFlag = vnode.shapeFlag | type
  }

  if (currentBlock && vnode.patchFlag > 0) {
    currentBlock.push(vnode)
  }
  return vnode

}

//创建虚拟节点,与createVnode一样;
//把createVnode重命名为createElementVNode,并导出createElementVNode;
export { createVnode as createElementVNode }

//用来收集多个动态节点的数组;
let currentBlock: VNode[] | null = null;

//用一个数组来收集多个动态节点;
export function openBlock() {
  //类似于: 生命周期: 用instance 收集-> 多个fn;
  currentBlock = []

}
export function createElementBlock(type: VNodeType, props: object, children: VNodeChildren, patchFlag: PatchFlags): VNode {
  return setupBlock(createVnode(type, props, children, patchFlag))
}

export function createTextVNode(value: any, patchFlag: PatchFlags = 0): VNode {
  return createVnode(Text, null, String(value), patchFlag)
}
/* export function createTextVNode(text: ' ', flag = 0) { // 创建文本虚拟节点
  return createVnode(Text, null, text, flag)
} */

function setupBlock(vnode: VNode): VNode {
  vnode.dynamicChildren = currentBlock
  currentBlock = null
  return vnode;
}
/* //创建虚拟节点,实际上就是createVnode;
export function createElementVNode() {

} */
export function toDisplayString(value: any) {
  //debugger
  return isString(value) ? value : value === undefined || value === null ? '' : isObject(value) ? JSON.stringify(value) : String(value)
}