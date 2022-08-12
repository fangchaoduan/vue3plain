import { NodeTypes } from "../ast"
import { ParseNode } from "../parse"
import { TransformContext } from "../transform"

//用于转化元素的;
export function transformElement(node: ParseNode, context: TransformContext) {//类似于: patchClass与patchStyle;
  //可以判断入参量是不是元素;
  //console.log('transformElement--->', node, context)

  //期望 给所有儿子处理完后,给元素重新添加children属性;

  // console.log(`进入1`)
  if (node.type === NodeTypes.ELEMENT) {
    //退出函数;
    return () => {
      // console.log(`退出1`)
    }
  }
}