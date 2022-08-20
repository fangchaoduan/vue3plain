
/* //可以把h()函数当成一个虚拟节点就好了;
//h()函数的用法: 
//h('div');

//h('div',null,'文本节点一');
//h('div',null,h('span'));
//h('div',null,h('span','虚拟子节点数组内的文本'));
//h('div',null,[h('span'),h('span','虚拟子节点数组内的文本')]);
//h('div',null,['文本节点一',h('span','虚拟子节点数组内的文本')]);
//h('div',null,'文本节点一','文本节点二');
//h('div',null,'文本节点一',h('span','虚拟子节点数组内的文本'));

//h('div',{},'文本节点一');
//h('div',{},h('span'));
//h('div',{},h('span','虚拟子节点数组内的文本'));
//h('div',{},[h('span'),h('span','虚拟子节点数组内的文本')]);
//h('div',{},['文本节点一',h('span','虚拟子节点数组内的文本')]);
//h('div',{},'文本节点一','文本节点二');
//h('div',{},'文本节点一',h('span','虚拟子节点数组内的文本'));

//h('div',h('span','虚拟子节点一的文本'),h('span','虚拟子节点二的文本'));//这种写法不行;虽然能编译,但`第二个参数h('span','虚拟子节点一的文本')`不会编译出来;同时会把`第二个参数h('span','虚拟子节点一的文本')`当成`props`;
 */

import { isArray, isObject, isString } from "@vue/shared"
import { createVnode, isVnode, VNode, VNodeChildren, VNodeProps } from "./vnode"



export function h(type: string, propsChildren: VNodeProps | VNodeChildren, children?: VNodeChildren): VNode {//其实的除了3个之外的肯定是孩子(子节点);
  const theLength = arguments.length


  //h('div',{style:{'color':'red'}});
  //h('div',h('span'));
  //h('div',[h('span','虚拟子节点一的文本'),h('span','虚拟子节点二的文本')]);
  //h('div','文本节点一');
  if (theLength === 2) {//为什么要将子节点包装成数组,因为元素可以循环创建;//但文本就不需要包装了;
    if (isObject(propsChildren) && !isArray(propsChildren)) {
      //是对象但不是数组就走下面;

      if (isVnode(propsChildren)) {//虚拟节点就包装成数组;
        return createVnode(type, null, [propsChildren as (string | number | VNode)])
      }

      //不是数组,就代表它是对象?
      return createVnode(type, propsChildren as VNodeProps)//不是虚拟节点的对象,就认为它是属性;
    } else {
      return createVnode(type, null, propsChildren as VNodeChildren)//是数组或文本;
    }
  } else {
    if (theLength > 3) {
      children = Array.from(arguments).slice(2)
    } else if (theLength === 3 && isVnode(children)) {//h('div',{},h('span'));
      //等于3个;
      children = [children as VNode]
    }

    /* //第二个参数是字符串时;
    if(isString(propsChildren)){
      return createVnode(type, null,[propsChildren, children])
    } */


    //其它;
    //如果有三个参数,默认第二个参数就是props;
    return createVnode(type, propsChildren as object, children)//children的情况有两种--文本或数组;
  }
}

/* function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // single vnode without props
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      // props without children
      return createVNode(type, propsOrChildren);
    }
    else {
      // omit props
      return createVNode(type, null, propsOrChildren);
    }
  }
  else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    }
    else if (l === 3 && isVNode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
} */