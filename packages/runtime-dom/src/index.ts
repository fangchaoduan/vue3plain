
import { createRenderer } from '@vue/runtime-core'
import { RenderOptions } from 'packages/runtime-core/src/renderer';
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";


const renderOptions: RenderOptions = Object.assign(nodeOps, { patchProp })//domAPI 属性api;
//console.log('renderOptions--->', renderOptions)



//createRenderer(renderOptions).render(h('h1','hello'),document.getElementById('app'));
export function render(vnode, container: HTMLElement) {
  //在创建渲染器的时候传入选项;
  createRenderer(renderOptions).render(vnode, container);
}
export * from '@vue/runtime-core'