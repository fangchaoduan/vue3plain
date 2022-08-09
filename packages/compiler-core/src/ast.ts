//ast语法树相关type;
export const enum NodeTypes {
  ROOT, // 根节点 Fragment;
  ELEMENT, // 元素;
  TEXT, // 文本;
  COMMENT, // 注释;
  SIMPLE_EXPRESSION, // 简单表达式--如: :a="aaa"中的aaa;
  INTERPOLATION,  // 插值--模版表达式--如{{aaa}};
  ATTRIBUTE, // 属性;
  DIRECTIVE, // 指令;
  // containers
  COMPOUND_EXPRESSION, // 复合表达式--如:{{aa}}abc;
  IF,//v-if?
  IF_BRANCH, //if分支?
  FOR,//v-for?
  TEXT_CALL,//文本调用;
  //codegen;
  VNODE_CALL,//元素调用;
  JS_CALL_EXPRESSION,//js调用表达式;
  //还有很多,这里没写完;
}