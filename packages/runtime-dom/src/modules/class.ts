//比对类名;
export function patchClass(el: HTMLElement, nextValue: string | null) {

  if (nextValue === null) {
    el.removeAttribute('class')//如果不需要class,直接移除;
  } else {
    el.className = nextValue
  }
}