import { isNumber, isString } from "@vue/shared";
import { h } from "../h";
import { RenderAnchor, RenderContainer, RenderVNode, VueInstance } from "../renderer";
import { ConvertibleVNode, createVnode, VNode } from "../vnode";
import { Text } from "../vnode"

export const TeleportImpl = {
  __isTeleport: true,//标识是否为传送门组件;
  process(n1: RenderVNode, n2: RenderVNode, container: RenderContainer, anchor: RenderAnchor = null, internals: TeleportInternals) {//处理传送门组件;
    // debugger
    //新添加的子节点是字符串或数字时;
    for (let index = 0; index < (n2.children as ConvertibleVNode[])?.length; index++) {
      if (isString(n2.children[index]) || isNumber(n2.children[index])) {
        const vnode = createVnode(Text, null, String(n2.children[index]))
        n2.children[index] = vnode
      }
    }
    
    const { mountChildren, patchChildren, move } = internals;
    if (!n1) {
      const target = document.querySelector(n2.props.to)
      if (target) {

        mountChildren(n2.children as ConvertibleVNode[], target)
      }
    } else {

      patchChildren(n1, n2, container);//儿子内容变化; 这个时候还是发生在老容器中的;

      if (n2.props.to !== n1.props.to) {
        const nextTarget = document.querySelector(n2.props.to);


        (n2.children as ConvertibleVNode[]).forEach((child) => {
          //将更新后的孩子放到新的容器里 移动到新的容器中;
          // debugger

          //这里没对文本和数字做处理,可以自己手动处理一下,但目前先用vnode写法;
          move(child as VNode, nextTarget)
        });
      }
    }
  }
}

export type TeleportComponent = {
  __isTeleport: boolean;
  process(n1: RenderVNode, n2: RenderVNode, container: RenderContainer, anchor: RenderAnchor, internals: TeleportInternals): void;
}
export type TeleportInternals = {
  mountChildren: (children: ConvertibleVNode[], container: HTMLElement, parentComponent?: null | VueInstance) => void;//用于挂载子节点的;
  patchChildren: (n1: RenderVNode, n2: RenderVNode, el: HTMLElement, parentComponent?: null | VueInstance) => void;//用于比对子节点内容的;
  move(vnode: RenderVNode, container: Element, anchor?: RenderAnchor): void;//用于移动子节点的;
  [property: string]: Function;
}

export const isTeleport = (type: any) => type.__isTeleport