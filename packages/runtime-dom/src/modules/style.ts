//比对样式;
export function patchStyle(el: HTMLElement, prevValue: object | null | undefined = {}, nextValue: object | null | undefined = {}) {
  //debugger
  //样式需要比对差异;
  //1. 新对象的直接赋值;
  //2. 老对象的用key看新的有没有同名key,如果没有,则代表要把老对象的key属性去除;

  //其实也可以先清空老对象上的所有key,再赋值上新对象的所有key;
  /* //确保必定为对象;
  if (!prevValue) {
    prevValue = {}
  }
  if (!nextValue) {
    nextValue = {}
  } */

  for (const key in nextValue) {
    //用新的直接覆盖即可;
    el.style[key] = nextValue[key]
  }

  if (!prevValue) {
    return
  }
  for (const key in prevValue) {
    //console.log('nextValue[key]--->', nextValue[key])
    if (!(nextValue[key] === undefined || nextValue[key] === null)) {
      continue
    }
    el.style[key] = null
  }
}