export const nodeOps = {
  //增加 删除 修改 查询

  //插入节点;
  insert(child, parent, anchor = null) {
    parent.insertBefore(child, anchor)//insertBefore可以等价于appendChild;
  },

  //remove-删除节点;
  remove(child) {
    const parentNode = child.parentNode;
    if (parentNode) {
      parentNode.removeChild(child)
    }
  },

  //文本节点,元素中的内容;

  //修改元素中的文本;-当传入的是元素时;
  setElementText(el, text) {
    el.textContent = text
  },
  //设置文本节点;-当传入的是文本节点时;
  setText(node, text) {
    node.nodeValue = text
  },

  //查询元素;
  querySelector(selector) {
    return document.querySelector(selector)
  },
  //查询父节点;
  parentNode(node) {
    return node.parentNode
  },
  //查询兄弟节点;
  nextSibling(node) {
    return node.nextSibling
  },

  //创建元素节点;
  createElement(tagName) {
    return document.createElement(tagName)
  },
  //创建文本节点;
  createText(text) {
    return document.createTextNode(text)
  }


}
/* //要写的方法;
const fang = {
  insert: hostInsert,//插入节点;
  remove: hostRemove,//删除节点;
  patchProp: hostPatchProp,//属性操作,要单独去写;//patch实际上就是补丁或比对的意思;//因为这个方法即要能创建,又要能修改,还要能移除;
  createElement: hostCreateElement,//创建元素;
  createText: hostCreateText,//创建文本;
  createComment: hostCreateComment,//创建注释;
  setText: hostSetText,//设置文本节点文本;
  setElementText: hostSetElementText,//设置元素节点文本;
  parentNode: hostParentNode,//获取父节点;
  nextSibling: hostNextSibling,//获取兄弟节点;
  setScopeId: hostSetScopeId = NOOP,//`NOOP`就是空函数的意思;
  cloneNode: hostCloneNode,//把节点拷贝;
  insertStaticContent: hostInsertStaticContent,//插入静态内容;
} */