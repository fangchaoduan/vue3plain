//provides: parent ? parent.provides : Object.create(null)

import { currentInstance } from "./component";

//依赖注入相关api;
//parent: {state:'xxx'} -> child: {a:1} -> grandson: {} ;
//实际上主要核心在于组件实例化时,通过Object.create(父组件上的provides)方法用原型链记下了父组件上的provides;
//provide()实际上就是把值放到自身上;如果是第一次,则用过Object.create()记下了父组件上的provides;
export function provide(key: PropertyKey, value: any) {
  if (!currentInstance) {
    return//此provide一定要用到setup()语法中;//即组件中;
  }

  const parentProvides = currentInstance.parent && currentInstance.parent.provides;

  let provides = currentInstance.provides;//自己的provides;//不过这个provides一开始是来自于父节点的;

  // debugger
  //自己的provides不能定义在父亲上,否则会导致儿子提供的属性 父亲也能用;
  if (parentProvides === provides) {//此时只有第一次provide相同,第二次是不同的;
    //原型查找;
    // debugger
    //Object.create() 并不叫拷贝,只叫链;
    //(实际上就是创建一个空对象的原型链变成源对象,并把新创建的空对象返回出去,新对象实际上并没有任何属性,只是在新对象上找不到某个属性时,会去找源对象上找);
    provides = currentInstance.provides = Object.create(provides)
  }


  provides[key] = value
  // provide('a', 1);//创建一个新对象,并重新赋值,性能消耗有点大;
  // provide('a', 2)
}

//只是查找;
//实际上就是通过原型链一级一级往上找父组件provides的值;
export function inject(key: PropertyKey, defaultValue: any) {
  // debugger
  if (!currentInstance) {
    return//此inject一定要用到setup()语法中;//即组件中;
  }
  const provides = currentInstance.parent && currentInstance.parent.provides
  if (provides && (key in provides)) {//通过父亲的provides将属性返回;
    return provides[key]
  } else if (arguments.length > 1) {
    // return defaultValue

    let theReturn = defaultValue
    if (typeof defaultValue === 'function') {
      theReturn = defaultValue()
    }
    return theReturn
  }
}