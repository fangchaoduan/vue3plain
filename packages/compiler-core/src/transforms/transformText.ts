import { NodeTypes } from "../ast"
import { ParseNode } from "../parse"
import { TransformContext } from "../transform"

//用于转化文本的;
export function transformText(node: ParseNode, context: TransformContext) {
  //可以判断入参是不是文本;
  //console.log('transformText--->', node, context)

  //当期望 将多个子节点拼接在一起;
  //if(node.type===2){}//不行;
  //需要遇到元素的时候,才能处理多个子节点; //比如: {{ aaa }} + aaa;

  // console.log(`进入2`)
  if (node.type === NodeTypes.ELEMENT || node.type === NodeTypes.ROOT) {
    //退出函数;
    return () => {
      // console.log(`退出2`)
    }
  }
}

//codegen(代码生成); (周日 pinia的实现原理 vue-router实现原理);

//手写一个keep-alive provide/inject teleport suspense;

//ts -> ;
//ts + vite + pinia;