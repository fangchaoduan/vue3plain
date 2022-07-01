export let activeEffect: ReactiveEffect | undefined = undefined;

function cleanupEffect(effect: ReactiveEffect) {
  const { deps } = effect//deps收集的是与该`ReactiveEffect实例`关联的所有`源对象的某个属性对应的所有ReactiveEffect实例集合Set`;

  //相当于与该`ReactiveEffect实例`关联的所有`源对象的某个属性`都清空了对于该`ReactiveEffect实例`的引用;
  for (let index = 0; index < deps.length; index++) {
    deps[index].delete(effect)
    //在`源对象的某个属性对应的所有ReactiveEffect实例集合Set`中解除当前ReactiveEffect实例,以便后面`ReactiveEffect实例.fn()`执行时,重新把`该ReactiveEffect实例`放到`源对象的某个属性对应的所有ReactiveEffect实例集合Set`中;
    //同时,也让`源对象的某个属性`变动后,在`源对象的某个属性对应的所有ReactiveEffect实例集合Set`找不到该`ReactiveEffect实例`,进行该`ReactiveEffect实例.fn()`执行不了;

  }

  effect.deps.length = 0
  //清空`ReactiveEffect实例.deps`,以便后面`ReactiveEffect实例.fn()`执行时,重新把`源对象的某个属性对应的所有ReactiveEffect实例集合Set`放到`ReactiveEffect实例.deps`中;
  //相当于告知该`ReactiveEffect实例`,已经没有任何一个`源对象的某个属性`引用了它;
}

//把用户的一次effect的创建一个对应的ReactiveEffect实例;
class ReactiveEffect {
  public parent: ReactiveEffect | null | undefined = null;//`该ReactiveEffect实例对应的effect`的父effect对应的ReactiveEffect实例;默认没父节点;
  public deps: Array<Set<ReactiveEffect>> = [];
  //这里表示在实例上新增了active属性;
  public active: boolean = true;//effect的激活状态;默认是激活状态;
  constructor(public fn: Function) {//用户传递的参数也会放在this上,相当于this.fn=fn;
  }
  //run就是执行effect;
  run() {
    //这里表示如果是非激活的情况,只需要执行函数,不需要进行依赖收集;
    if (!this.active) {
      return this.fn()
    }

    //这里就要依赖收集了; 核心就是将当前的effect和稍后渲染的属性关联在一起;
    //1. 在执行run()时,如果当前的ReactiveEffect实例为激活状态,那么就会把该ReactiveEffect实例赋值到模块中全局变量activeEffect中;
    //2. 当调用this.fn()时,就会执行一次用户传入进来的回调方法;
    //3. 在用户传入进来的回调方法中,如果涉及到响应式对象的取值,那么就必定就会执行响应式对象中的get方法;
    //4. 在响应式对象中的get方法中,可以拿到当前响应式对象的源对象及属性名及代理对象,以及此时值为ReactiveEffect实例的全局变量activeEffect,此时可以把这几个数据给关联起来;
    //5. 把全局变量activeEffect与响应式对象源对象及属性名及代理对象关联到全局变量targetMap,并在当前ReactiveEffect实例的deps属性中记录了[与`当前ReactiveEffect实例自身相关的响应式对象源对象及属性名`关联的所有ReactiveEffect实例所在的Set实例对象];this.fn()就执行完了;
    //6. 响应式对象源对象+属性名+全局变量targetMap可以找到`与响应式对象源对象+属性名关联的所有ReactiveEffect实例所在的Set实例对象`;
    //7. ReactiveEffect实例可以通过它自身的deps属性找到[与`当前ReactiveEffect实例自身相关的响应式对象源对象及属性名`关联的所有ReactiveEffect实例所在的Set实例对象];
    //8. this.fn()执行完,把全局变量activeEffect重新设置为undefined;
    //9. 而如果响应式数据改变了,那么就必定会走到响应式对象的set方法中;

    //10. 用户主动改了响应式对象的某个属性,那么就必定会走到响应式对象的set方法中,此时可以拿到响应式对象源对象+属性名+全局变量targetMap;
    //11. 响应式对象源对象+属性名+全局变量targetMap可以找到`与响应式对象源对象+属性名关联的所有ReactiveEffect实例所在的Set实例对象`;
    //12. 遍历Set实例对象,让Set实例对象中的每个ReactiveEffect实例都执行一次run(),于是第1步到第9步都会重新执行一遍;//故而需要把该ReactiveEffect实例与`响应式对象源对象+属性名+全局变量targetMap`的引用清除一遍;
    try {
      this.parent = activeEffect
      activeEffect = this

      //这里需要在执行用户函数之前将之前收集的内容清空,activeEffect.deps = [Set<ReactiveEffect>,Set<ReactiveEffect>,...]
      console.log("cleanupEffect start");
      cleanupEffect(this)
      console.log("cleanupEffect end");


      return this.fn()//当稍后调用取值操作的时候,就可以获取到这个全局的activeEffect了;
    } finally {
      activeEffect = this.parent
      this.parent = null//不手动清好像也没问题,不过好像parent还是会记录旧的effect;
    }
  }
}

export function effect(fn: Function) {
  //这里fn可以根据状态变化,重新执行,effect可以嵌套着写;
  const _effect = new ReactiveEffect(fn)//创建响应式的effect;
  _effect.run()//默认先执行一次;
}




//targetMap用来记录程序全局中所有`响应式对象的源对象中的某个属性`对应的所有`effect对应的ReactiveEffect实例`相互之间的关联关系;
const targetMap: WeakMap<object, Map<PropertyKey, Set<ReactiveEffect>>> = new WeakMap()//弱引用是为了object被干掉后,它对应的Map也就可以被取消引用;
//实际上是: 
//对于已知对象与属性来说是: 已知object+已知PropertyKey+全局变量targetMap --> Set<ReactiveEffect>;
//对于已知ReactiveEffect实例来说是: 已知ReactiveEffect实例+全局变量targetMap 循环遍历于 object+PropertyKey中所有的Set<ReactiveEffect> --> 得到object+PropertyKey;
export function track(target: Object, type: 'get' | 'set', key: PropertyKey, thisReactiveEffect: ReactiveEffect | undefined = activeEffect) {
  //如果activeEffect有传入,就使用传入的;没传入,就使用当前模块的activeEffect;
  var activeEffect: ReactiveEffect | undefined = thisReactiveEffect || activeEffect//好像ts中不能直接使用与本地变量同名的全局变量?
  //如果变量activeEffect没值,那么说明当前get方法中并没有在effect中;
  if (!activeEffect) {
    return
  }

  let depsMap: Map<PropertyKey, Set<ReactiveEffect>> | undefined = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let dep: Set<ReactiveEffect> | undefined = depsMap.get(key);//key -> name /age
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }
  let shouldTrack: boolean = !dep.has(activeEffect)//去重了,即已经有了该ReactiveEffect实例后,后续就不再放入set了;
  if (shouldTrack) {
    console.log('5')
    //debugger
    dep.add(activeEffect)
    //存放的是属性对应的Set,Set里有多个ReactiveEffect实例,activeEffect只是Set里中的某个ReactiveEffect实例;// name:new Set();
    activeEffect.deps.push(dep)//让ReactiveEffect实例记录住对应的dep,稍后清理的时候会用到;
  }
}



export function trigger(target: Object, type: 'get' | 'set', key: PropertyKey, value: unknown, oldValue: unknown, theWeakMap: WeakMap<object, Map<PropertyKey, Set<ReactiveEffect>>> = targetMap, thisReactiveEffect: ReactiveEffect | undefined = activeEffect): undefined {
  //如果activeEffect有传入,就使用传入的;没传入,就使用当前模块的activeEffect;
  var activeEffect: ReactiveEffect | undefined = thisReactiveEffect || activeEffect//好像ts中不能直接使用与本地变量同名的全局变量?

  //如果targetMap有传入,就使用传入的;没传入,就使用当前模块的targetMap;
  var targetMap: WeakMap<object, Map<PropertyKey, Set<ReactiveEffect>>> = theWeakMap || targetMap

  //alert(1)
  const depsMap: Map<PropertyKey, Set<ReactiveEffect>> | undefined = targetMap?.get(target)//找到了与响应式对象源对象关联的Map实例;
  if (!depsMap) {
    return //触发的值不在模块中使用;//即该响应式对象源对象并没有使用过effect;
  }

  let effects: Set<ReactiveEffect> | undefined = depsMap.get(key) //找到了该响应式对象源对象的属性关联的Set实例;

  //永远在执行之前,先拷贝一份,不要关联引用
  if (effects) {
    const effectList: Set<ReactiveEffect> = new Set(effects)
    //如果不拷贝,会在effects.forEach()中-->ReactiveEffect实例.run()中-->cleanupEffect(this)从effects删除当前ReactiveEffect实例-->ReactiveEffect实例.fn()中-->读到属性时在track()中重新向effects添加当前ReactiveEffect实例-->导致effects.forEach()永远执行不完;
    //类似于: const arr = [1]; arr.forEach((item) => { arr.length = 0;arr.push(1)});
    //如果拷贝,会在effectList.forEach()中-->ReactiveEffect实例.run()中-->cleanupEffect(this)从effects删除当前ReactiveEffect实例-->ReactiveEffect实例.fn()中-->读到属性时在track()中重新向effects添加当前ReactiveEffect实例-->effectList.forEach()执行结束;

    effectList.forEach((theReactiveEffect: ReactiveEffect) => {
      console.log('3')
      debugger
      //我们在执行effect的时候,又要执行自己,那我们需要屏蔽掉,不要无限调用;
      if (theReactiveEffect !== activeEffect) {
        theReactiveEffect.run()
      }


    })
  }

}

//1) 先搞了一个响应式对象 new Proxy;
//2) effect默认数据变化要能更新,先将正在执行的effect作为全局变量,渲染(取值),在get方法中进行依赖收集;
//3) WeakMap<object, Map<PropertyKey, Set<ReactiveEffect>>>,即做了一个全局变量WeakMap<源对象, Map<源对象属性, Set<effect对应实例>>>;
//4) 稍后用户发生数据变化,会通过对象属性来查找对应的effect对应实例集合Set,找到effect对应实例全部执行;



/* let set = new Set(['a'])
set.forEach(item => {
  set.delete('a')
  set.add('a')
  console.log('死')
}) */

const arr = ['a', 'b', 'c']