import { isObject } from "@vue/shared";

//用来记录一个对象是否已经设置了代理,做一个缓存,如果已经做了代理,就直接返回之前设置过的代理对象;
//1) 实现同一个对象,代理多次,返回同一个代理;
const reactiveMap = new WeakMap()//key只能是对象;

//2) 代理对象被再次代理,可以直接返回;
const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

//1) 将数据转化成响应式的数据,reactive只能做对象的代理;
export function reactive(target: Object) {
  if (!isObject(target)) {
    return
  }
  //1) 实现同一个对象,代理多次,返回同一个代理;
  const exisitingProxy = reactiveMap.get(target)
  if (exisitingProxy) {
    return exisitingProxy
  }

  //2) 代理对象被再次代理,可以直接返回;
  //这里触发代理对象的get方法;
  if (target[ReactiveFlags.IS_REACTIVE]) {
    //如果目标是一个代理对象,那么一定被代理过了,那么就会走该代理对象的get方法;
    //而如果该目标对象是reactive生成的代理对象,那么访问ReactiveFlags.IS_REACTIVE属性时,就一定会返回true;
    return target
  }

  //若是普通对象进行代理,会通过new Proxy代理一次;
  //若是代理对象进行代理,可以看一下他有没有被代理过,如果访问这个代理对象,有get方法的时间说明就访问过了;

  //并没有重新定义属性,只是代理在取值的时候会调用get,在赋值时会调用set;
  //
  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      //会代理对象上取值,就走get这里;
      //这里可以监控到用户取值了;
      //console.log('get中key--->', key)

      //2) 代理对象被再次代理,可以直接返回;
      //所有被触发的get方法中,都会判断一次key是否为ReactiveFlags.IS_REACTIVE,如果是,就一定返回true;
      //代理对象上并没有ReactiveFlags.IS_REACTIVE这个属性,但是访问代理对象上的ReactiveFlags.IS_REACTIVE属性,会得到类似于属性值为true的效果;
      if (key === ReactiveFlags.IS_REACTIVE) {
        return true
      }

      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      //到代理上设置值,就执行set这里;
      //这里可以监控到用户设置值了;
      //console.log('set中key--->', key)
      return Reflect.set(target, key, value, receiver)
    }
  })

  //1) 实现同一个对象,代理多次,返回同一个代理;
  reactiveMap.set(target, proxy)
  return proxy
}

/* //特殊场景:
//想要取alias时,监控到;而在alias上取name时,也要监控到;
const target = {
  name: 'fang',
  get alias() {
    console.log('this--->',this)
    return this.name
  }
}
const proxy = new Proxy(target, {
  get(target, key, receiver) {
    console.log('key--->', key)
    return target[key]
  },
  set(target, key, value, receiver) {
    target[key] = value
    return true
  }
})
console.log('proxy.alias--->', proxy.alias)//去alias上取了值时,也去了name,当时没有监控到name;
 */

/* //特殊场景解决:
const target = {
  name: 'fang',
  get alias() {
    //console.log('源对象this--->',this)
    return this.name //因为这里也取值了target.name,所以最好这里也通过代理对象监控到,所以才使用了Reflect;
  }
}
const proxy = new Proxy(target, {
  get(target, key, receiver) {
    //target为代理对象对应的源对象; key为属性名; receiver为当前代理对象;
    console.log('key--->', key)
    //console.log('代理对象this--->',this)
    //return target[key]
    return Reflect.get(target,key,receiver)//把在通过get取target上key对应的值时,把在源对象target上key取值过程中值为target的this的指向设置为receiver;
  },
  set(target, key, value, receiver) {
    //target为代理对象对应的源对象; key为属性名; value为属性值; receiver为当前代理对象;
    return Reflect.set(target, key, value, receiver)
  }
})
console.log('proxy.alias--->', proxy.alias)//去alias上取了值时,也去了name,当时没有监控到name;
//只有直接在代理上取值才会走代理对象上的get方法,在源对象上的取值并不会走代理对象上的get方法;

//想要取alias时,监控到;而在alias上取name时,也要监控到;
//因为在页面中使用了alias对应的值,稍后name变化了,要重新渲染; */
