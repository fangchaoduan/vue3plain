function createInvoker<T extends Function | Array<Function>>(callback: T) {
  if (typeof callback !== 'function') {
    //不是函数时;(暂时不写)
    const invoker = (event: any) => {
      for (let index = 0; index < (invoker.value as Array<Function>).length; index++) {
        invoker.value[index](event)
      }
    };
    invoker.value = callback
    return invoker

  }

  const invoker = (event: any) => (invoker.value as Function)(event);
  invoker.value = callback
  return invoker
}


//比对事件;
//第一次绑定onClick事件-->事件a; //el._vei = {}; el._vei = {onClick:invoker函数} invoker函数.value为事件a; el.addEventListener('click', (event) => invoker.value(event)); el.addEventListener('click', (event) => a(event));
//第二次绑定onClick事件-->事件b; //el._vei = {onClick:invoker函数} invoker函数.value为事件b; el.addEventListener('click', (event) => invoker.value(event)); el.addEventListener('click', (event) => b(event));
//第三次绑定onClick事件-->null(无事件); //el.addEventListener('click', (event) => invoker.value(event)); el._vei = {};
//第四次绑定onClick事件-->[事件c,事件d];
//第四次绑定onClick事件-->事件e;
export function patchEvent(el: HTMLElement & { _vei?: object }, eventName: string, nextValue: Function | Array<Function> | null) {
  //事件绑定都缓存到了当前DOM上;


  //可以先移除掉事件,再重新绑定事件;
  //remove -> add ===> add + 自定义事件(里面调用绑定的方法);

  //const invokers = el._vei || (el._vei = {})
  if (!el._vei) {
    el._vei = {}
  }
  const invokers = el._vei

  const exits = invokers[eventName]//先看有没有缓存过;

  //目前这里只考虑到nextValue只为Function的处理;
  //没有考虑到可能一次为Function,另一次为Array<Function>的情况;
  if (exits && nextValue) {//已经绑定过事件了;
    exits.value = nextValue//没有卸载函数,只是改了invoker.value属性;
  } else {
    //还没绑定过事件;
    //onClick=click;
    const eventLower = eventName.slice(2).toLowerCase();
    if (nextValue) {
      //const invoker = invokers[eventName] = createInvoker(nextValue)
      invokers[eventName] = createInvoker(nextValue)
      const invoker = invokers[eventName]

      el.addEventListener(eventLower, invoker)
    } else if (exits) {
      //如果有老值,需要将老的绑定事件移除掉;
      el.removeEventListener(eventLower, exits)
      invokers[eventName] = undefined
    }
  }

}