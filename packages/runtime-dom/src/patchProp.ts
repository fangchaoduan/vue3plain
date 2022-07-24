
//patch实际上就是补丁或比对的意思;
//因为这个方法即要能创建,又要能修改,还要能移除;
//dom属性的操作api;
export function patchProp(el, key, prevValue, nextValue) {
  //正常属性可以用el.setAttribute();

  //要单独处理的:
  //类名-el.className;

  //样式-el.style;

  //事件-events;

  //普通属性;
}
//虚拟DOM;
//如何创建真实DOM;
//dom-diff 最长递增子序列;
//组件的实现;模板渲染; 核心的组件更新等等; 组件 ....;
//模板编译-编译原理 + 代码转化 + 代码生成 + (编译优化);