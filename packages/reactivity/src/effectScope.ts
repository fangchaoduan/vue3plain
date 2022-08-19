import { ReactiveEffect } from "./effect";


//EffectScope实例 可以存储 EffectScope实例;
//EffectScope实例 可以存储 EffectScope实例.run()内部运行的ReactiveEffect实例;

//`父EffectScope实例` -> `父EffectScope实例.run()内部运行的ReactiveEffect实例` 和 `子EffectScope实例` -> `子EffectScope实例.run()内部运行的ReactiveEffect实例`;
//`父EffectScope实例`.stop() -> `父ReactiveEffect实例`.stop() 和 `子EffectScope实例`.stop() -> `子ReactiveEffect实例`.stop();
//父effectScope.stop() 停止自己家的effect 执行子effectScope.stop() 同时停止自己的effect;

//以前vue3.2之前可以自己收集 子集做stop;//即用一个数组把effect收集起来,遍历做effect的stop()或run();

export let activeEffectScope: EffectScope = null;//`当前EffectScope实例`;

//EffectScope类;
class EffectScope {
  active = true;//EffectScope实例是否处于激活状态;
  parent: EffectScope = null;//EffectScope实例的父实例;
  effects: ReactiveEffect[] = [];//EffectScope实例记录的effect;
  scopes: EffectScope[] = [];//effectScope还有可能要收集子集的effectScope;
  constructor(detached: boolean) {
    //只有不独立的才要收集;
    if (!detached && activeEffectScope) {
      activeEffectScope.scopes.push(this)
    }
  }
  run(fn: Function) {
    if (this.active) {
      try {
        this.parent = activeEffectScope
        activeEffectScope = this
        return fn()
      } finally {
        activeEffectScope = this.parent
      }
    }
  }
  stop() {
    if (this.active) {
      for (let i = 0; i < this.effects.length; i++) {
        this.effects[i].stop()
      }

      for (let i = 0; i < this.scopes.length; i++) {
        this.scopes[i].stop()
      }

      this.active = false
    }
  }
}

//记录`当前ReactiveEffect实例`到`当前EffectScope实例`里;
export function recordEffectScope(effect: ReactiveEffect) {
  if (activeEffectScope && activeEffectScope.active) {
    activeEffectScope.effects.push(effect)
  }
}

//返回一个EffectScope0实例,用于收集该实例的run()方法里执行过的effect;
export function effectScope(detached: boolean = false) {
  return new EffectScope(detached)
}