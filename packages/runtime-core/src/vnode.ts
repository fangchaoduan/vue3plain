//type,即节点类型;props,属性;children,子节点;

import { isArray, isString, ShapeFlags } from "@vue/shared";

//判断一个变量是否为虚拟DOM;
export function isVnode(value) {
  return !!value?.__v_isVnode
}

export declare type VNodeChildren = undefined | null | number | string | Array<string | object | number>
export type VNodeProps = object | undefined | null
export type VNode = {
  type: string;
  props: VNodeProps;
  children: VNodeChildren;
  el: null | HTMLElement;//虚拟节点上对应的真实节点,后续diff算法优化要用到;
  key: any;
  __v_isVnode: boolean;
  shapeFlag: number;
}
//虚拟节点有很多:组件的,元素的,文本的等; //h('h1);
export function createVnode(type: string, props: VNodeProps, children: VNodeChildren = null): VNode {
  //组合方案 shapeFlag;
  //想知道一个元素中包含的是多个儿子还是一个儿子;
  //标识;
  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;

  //虚拟DOM就是一个对象,用于diff算法等的优化;真实DOM的属性比较多;
  const vnode = {//key;
    type,
    props,
    children,
    el: null,//虚拟节点上对应的真实节点,后续diff算法优化要用到;
    key: props?.['key'],
    __v_isVnode: true,
    shapeFlag
  }
  if (children) {
    let type = 0;
    if (isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN;
    } else {
      children = String(children)
      type = ShapeFlags.TEXT_CHILDREN
    }
    //vnode.shapeFlag |= type
    vnode.shapeFlag = vnode.shapeFlag | type
  }
  return vnode

}

/* <div>
  <h1></h1>
  <h1></h1>
</div>
<div>
  123
</div> */