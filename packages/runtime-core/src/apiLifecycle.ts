import { currentInstance, setCurrentInstance } from "./component"
import { VueInstance } from "./renderer"

//定义一些生命周期相关的枚举;
export const enum LifecycleHooks {
  BEFORE_MOUNT = 'bm',//挂载前;
  MOUNTED = 'm',//挂载后;
  BEFORE_UPDATE = 'bu',//更新前;
  UPDATED = 'u',//更新后;
}

type HookFunction = (hook: Function) => any

function createHook(type: string): HookFunction {
  //返回出去的函数是个闭包;
  //闭包里的必定有当时的变量target,而变量target则指向函数创建时的currentInstance变量,而currentInstance变量则指向一个vue组件实例的引用地址;
  //故而target一直指向createHook()被调用时vue组件实例;
  //虽然currentInstance一直在变null或另一个组件,但target则只是currentInstance在返回出去的HookFunction第一次被调用时所引用的`当前执行vue组件实例`;
  return (hook: Function, target: VueInstance = currentInstance) => {
    //hook需要绑定到对应的实例上;
    //之前写的依赖收集,仿它的逻辑,把当前实例放到全局环境上;
    //debugger

    //要确保是在vue组件实例的setup()中才执行;
    if (target) {
      //关联此currentInstance和hook;

      const hooks: Array<Function> = target[type] || (target[type] = [])
      // if(!target[type]){
      //   target[type] = []
      // }
      // const hooks = target[type]

      //hooks.push(hook)//稍后执行hook的时候,这个instance指代的是谁呢?//即hook中通过getCurrentInstance()得到的当前实例的instance指代是谁?
      //console.log('hooks--->', hooks)

      //用于在调用钩子函数前,把`当前执行vue组件实例`设置为hook被创建时的vue组件实例;
      const wrappedHook = () => {
        setCurrentInstance(target)
        hook()//将当前实例保存到currentInstance上;
        setCurrentInstance(null)
      }

      hooks.push(wrappedHook)


    }
  }
}
//hooks.forEach()//即hook中通过getCurrentInstance()得到的当前实例的instance指代是谁?


//工厂模式;
//生命周期钩子-onBeforeMount-组件实例挂载前;
export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)

//生命周期钩子-onMounted-组件实例挂载后;
export const onMounted = createHook(LifecycleHooks.MOUNTED)

//生命周期钩子-onBeforeUpdate-组件实例更新前;
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)

//生命周期钩子-onUpdated-组件实例更新后;
export const onUpdated = createHook(LifecycleHooks.UPDATED)

//a -> h(B) -> b ->h(c); 
//JavaScript是单线程的,所以h()必定是依次执行的,故而h()中的setup()也是依次单向执行的;
//故而不会让组件A中的setup()执行过程中还执行组件B的h()中的setup();