
//null,值;
//值,值;
//值,null;

import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/event";
import { patchStyle } from "./modules/style";

//patch实际上就是补丁或比对的意思;
//因为这个方法即要能创建,又要能修改,还要能移除;
//dom属性的操作api;


export function patchProp(el: HTMLElement, key: string, prevValue: any, nextValue: unknown) {

  //[vue模块解析](https://vue-next-template-explorer.netlify.app/);用来看模板转成VNode;

  //要单独处理的:
  if (key === 'class') {//类名-el.className;
    //class="a" class="a b" class;
    patchClass(el, nextValue as string | null)
  } else if (key === 'style') {//样式-el.style;
    //style {color:'red',fontSize:'12'} {color:'blue',background:'red'};
    patchStyle(el, prevValue as object | null, nextValue as object | null)
  } else if (/^[o][n][^a-z]/.test(key)) {//事件-events;addEventListener;
    //一般模板中`<div @xx>文本</div>`会转成`["div", { onXx: () => {} }, "文本"]`;
    //即属性名以小写on开头,后方如果是字母,则转为大写;
    patchEvent(el, key, nextValue as Function | Array<Function> | null)
  } else {//普通属性;//正常属性可以用el.setAttribute();
    patchAttr(el, key, nextValue as string)
  }


}
//虚拟DOM;
//如何创建真实DOM;
//dom-diff 最长递增子序列;
//组件的实现;模板渲染; 核心的组件更新等等; 组件 ....;
//模板编译-编译原理 + 代码转化 + 代码生成 + (编译优化);

/* //一次比对多个属性;
for (const key in obj) {
  patchProp(el, key, null, obj[key])
} */