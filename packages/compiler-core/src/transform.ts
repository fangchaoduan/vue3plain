import { NodeTypes } from "./ast";
import { ParseNode } from "./parse";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";
import { transformElement } from "./transforms/transformElement";
import { transformExpression } from "./transforms/transformExpression";
import { transformText } from "./transforms/transformText";

export type TransformContext = {
  currentnode: ParseNode;//当前正在转化的是谁;
  parent: any;//当前转化的父节点是谁;
  helpers: Map<any, any>;//记录:使用了多少次那些如`createTextVnode()`之类的方法;//用于优化如: 超过20个相同节点会被字符串化;
  helper(name: any): any;
  nodeTransforms: ((node: ParseNode, context: TransformContext) => void | Function)[];
}
function createTransformContext(root: ParseNode) {
  const context: TransformContext = {
    currentnode: root,
    parent: null,
    helpers: new Map(),

    //根据使用过的方法进行优化;
    helper(name) {
      const count = context.helpers.get(name) || 0;
      context.helpers.set(name, count + 1)
      return name
    },

    nodeTransforms: [
      transformElement,
      transformText,
      transformExpression,
    ]
  }
  return context
}

function traverse(node: ParseNode, context: TransformContext) {
  context.currentnode = node
  const transforms = context.nodeTransforms
  const exitsFns = []
  for (let i = 0; i < transforms.length; i++) {
    //在执行的时候,有可能这个子节点被删除了;
    const onExit = transforms[i](node, context)
    if (onExit) {
      exitsFns.push(onExit)
    }
    //如果当前节点被删掉了,那么就不考虑儿子了;
    if (!context.currentnode) {
      return
    }
  }



  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      //宏 常量;
      context.helper(TO_DISPLAY_STRING)
      break;
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      //如果有子节点,再遍历子节点;
      for (let i = 0; i < node.children.length; i++) {
        context.parent = node
        traverse(node.children[i], context)
      }
  }

  context.currentnode = node;//当执行退出函数的时候,保存currentNode指向依旧是对的;
  let i = exitsFns.length
  while (i--) {
    exitsFns[i]()
  }
}
export function transform(ast: ParseNode) {
  //对树进行遍历操作;
  const context = createTransformContext(ast)
  traverse(ast, context)

}