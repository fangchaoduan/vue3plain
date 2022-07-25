//比对普通属性;
export function patchAttr(el: HTMLElement, key: string, nextValue: string) {
  if (nextValue) {
    el.setAttribute(key, nextValue)
  } else {
    el.removeAttribute(key)
  }
}