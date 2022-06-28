const target = {
  name: 'fang',
  get alias() {
    //console.log('源对象this--->',this)
    return this.name
  }
}
const proxy = new Proxy(target, {
  get(target, key, receiver) {
    console.log('key--->', key)
    //console.log('代理对象this--->',this)
    //return target[key]
    return Reflect.get(target,key,receiver)
  },
  set(target, key, value, receiver) {
    target[key] = value
    return true
  }
})
console.log('proxy.alias--->', proxy.alias)//去alias上取了值时,也去了name,当时没有监控到name;
//想要取alias时,监控到;而在alias上取name时,也要监控到;