export let activeEffect: ReactiveEffect | undefined = undefined;
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

/* //特殊场景: effect嵌套effect,但内部effect执行结束后,就会将全局变量activeEffect置为undefined;
effect(() => { //effect1; //此时全局变量activeEffect为effect1;
  state.name //name->effect1;
  effect(() => {//effect2; //此时全局变量activeEffect为effect2;
    state.age//age->effect2;
  })
  state.address //由于结束了effect2,此时全局变量activeEffect置为undefined;
})
//解决方法一,把activeEffect设置为栈,进去就不停放当前ReactiveEffect实例进栈,每次get方法中都只取栈中最后一个,出来后,执行完fn()后就丢弃栈中最后一个; */

/* //特殊场景: effect嵌套effect,但内部effect执行结束后,就会将全局变量activeEffect置为undefined;
effect(() => { //effect1; //此时this.parent -> null; 全局变量activeEffect -> effect1;
  state.name //name -> activeEffect -> effect1;
  effect(() => {//effect2; //此时this.parent -> effect1; 全局变量activeEffect -> effect2;
    state.age//age -> activeEffect -> effect2;
  })
  state.address//由于结束了effect2,此时全局变量activeEffect -> this.parent -> effect1;
  effect(() => {//effect3; //此时this.parent -> effect1; 全局变量activeEffect -> effect3;
    state.age//age -> activeEffect -> effect3;
  })
})
//解决方法二,把activeEffect添加一个属性用于记录父effect设置为树形结构;
//进去就把当前ReactiveEffect实例的parent属性设置为旧全局变量activeEffect的值,并把当前ReactiveEffect实例设置为全局变量activeEffect的新值,执行完fn()后就把把当前ReactiveEffect实例设置为它的parent属性即旧全局变量activeEffect的值;
//执行流程类型于树形结构; */


//依赖收集就是:
//一个effect对应一个ReactiveEffect实例实例;
//一个`ReactiveEffect实例`对应多个`某个对象的某个属性`;一个`某个对象的某个属性`对应多个`ReactiveEffect实例`;
//结论: 多对多;

//targetMap用来记录程序全局中所有`响应式对象的源对象中的某个属性`对应的所有`effect对应的ReactiveEffect实例`相互之间的关联关系;
//实际上是: 
//对于已知对象与属性来说是: 已知object+已知PropertyKey+全局变量targetMap --> Set<ReactiveEffect>;
//对于已知ReactiveEffect实例来说是: 已知ReactiveEffect实例+全局变量targetMap 循环遍历于 object+PropertyKey中所有的Set<ReactiveEffect> --> 得到object+PropertyKey;
const targetMap: WeakMap<object, Map<PropertyKey, Set<ReactiveEffect>>> = new WeakMap()//弱引用是为了object被干掉后,它对应的Map也就可以被取消引用;
export function track(target: Object, type: 'get' | 'set', key: PropertyKey, thisReactiveEffect: ReactiveEffect | undefined = activeEffect) {
  //单向记录;//即单向指的是 属性记录了ReactiveEffect实例;
  //反向记录: 应该也让ReactiveEffect实例记录它被那些对象的那些属性收集过;这样做的好处是是为了可以清理;
  //对象 -> 多个属性 -> 多个effect
  //WeakMap={对象Map:{属性string:effect的Set集合}}
  //{对象:{name:[]}}

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
    dep.add(activeEffect)
    //debugger
    //存放的是属性对应的Set,Set里有多个ReactiveEffect实例,activeEffect只是Set里中的某个ReactiveEffect实例;// name:new Set();
    activeEffect.deps.push(dep)//让ReactiveEffect实例记录住对应的dep,稍后清理的时候会用到;
  }
}

/* //特殊场景: 分支控制,某些场景中要删除effect;
//如果flag在该ReactiveEffect实例的fn()函数执行后由true变动为false了,那么响应式对象this中name属性对应的Set里的该ReactiveEffect实例应该就要被删除,而该ReactiveEffect实例就要被添加到响应式对象this中age属性对应的Set里;
effect(() => {
  flag ? this.name : this.age
})
//实际上是: 
//对于已知对象与属性来说是: object+PropertyKey --> Set<ReactiveEffect>;
//对于已知ReactiveEffect实例来说是: ReactiveEffect实例 循环遍历于 object+PropertyKey中所有的Set<ReactiveEffect> --> 得到object+PropertyKey;
//解决方式: 该effect对应的ReactiveEffect实例中也记录它被`那些对象的那些属性`中的Set<ReactiveEffect>收集过;在执行该ReactiveEffect实例的fn()函数后,在`那些对象的那些属性`中的Set<ReactiveEffect>清除对自身的引用; */


export function trigger(target: Object, type: 'get' | 'set', key: PropertyKey, value: unknown, oldValue: unknown, theWeakMap: WeakMap<object, Map<PropertyKey, Set<ReactiveEffect>>> = targetMap, thisReactiveEffect: ReactiveEffect | undefined = activeEffect): undefined {

  //如果activeEffect有传入,就使用传入的;没传入,就使用当前模块的activeEffect;
  var activeEffect: ReactiveEffect | undefined = thisReactiveEffect || activeEffect//好像ts中不能直接使用与本地变量同名的全局变量?

  //如果targetMap有传入,就使用传入的;没传入,就使用当前模块的targetMap;
  var targetMap: WeakMap<object, Map<PropertyKey, Set<ReactiveEffect>>> = theWeakMap || targetMap
  //debugger
  const depsMap: Map<PropertyKey, Set<ReactiveEffect>> | undefined = targetMap?.get(target)//找到了与响应式对象源对象关联的Map实例;
  if (!depsMap) {
    return //触发的值不在模块中使用;//即该响应式对象源对象并没有使用过effect;
  }

  const effects: Set<ReactiveEffect> | undefined = depsMap.get(key) //找到了该响应式对象源对象的属性关联的Set实例;
  effects?.forEach((theReactiveEffect: ReactiveEffect) => {
    //我们在执行effect的时候,又要执行自己,那我们需要屏蔽掉,不要无限调用;
    if (theReactiveEffect !== activeEffect) {
      theReactiveEffect.run()
    }
    

  })

}
