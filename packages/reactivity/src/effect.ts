export let activeEffect: undefined | ReactiveEffect = undefined;
class ReactiveEffect {
  //这里表示在实例上新增了active属性;
  public active: boolean = true;//effect的激活状态;默认是激活状态;
  constructor(public fn: Function) {//用户传递的参数也会放在this上,相当于this.fn=fn;
  }
  //run就是执行effect;
  run() {
    //这里表示如果是非激活的情况,只需要执行函数,不需要进行依赖收集;
    if (!this.active) {
      this.fn
    }

    //这里就要依赖收集了; 核心就是将当前的effect和稍后渲染的属性关联在一起;
    try {
      activeEffect = this
      return this.fn()//当稍后调用取值操作的时候,就可以获取到这个全局的activeEffect了;
    } finally {
      activeEffect = undefined
    }
  }
}

export function effect(fn: Function) {
  //这里fn可以根据状态变化,重新执行,effect可以嵌套着写;
  const _effect = new ReactiveEffect(fn)//创建响应式的effect;
  _effect.run()//默认先执行一次;
}

/* 特殊场景: effect嵌套effect;
effect(() => {
  state.name //收集state.name
  effect(() => {
    state.age //收集state.age
  })
}) */