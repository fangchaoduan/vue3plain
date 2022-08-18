export { effect } from './effect'
export { reactive } from './reactive'
export { computed } from './computed'

export { watch } from './watch'
//添加了watch,实际上watch就是一个effect,只是这个effect是在一个闭包中,而effect所在闭包中会记录变化的前后值及上一次watch中没执行的回调;watch第一个参数用于在get中收集effect,而第二个参数类似于effect的调度函数,调度函数会使用闭包中的值,以达到监听到变动前后的值及下次回调之类的效果;

//export { ref } from './ref'
//export { ref,toRefs,toRef,proxyRefs } from './ref'
export * from './ref'
//添加了ref,toRefs,toRef,proxyRefs;实际上ref就是一个RefImpl类实例,同时也是effect,只是在[get value]时收集依赖,在[set value]时执行当前ref收集的依赖;toRefs用于把响应式数据变成ref对象;toRef把响应式数据的某个属性变成ref对象;把ref对象变成代理对象以减少.value的书写;

export * from './effect'
//使其在别的地方可以使用通过"@vue/reactivity"使用'./effect.ts'中导出的方法或变量;

//effectScope相关方法;
export * from './effectScope'