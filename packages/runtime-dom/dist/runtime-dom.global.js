var VueRuntimeDOM = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/runtime-dom/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    Fragment: () => Fragment,
    KeepAlive: () => KeepAliveImpl,
    LifecycleHooks: () => LifecycleHooks,
    ReactiveEffect: () => ReactiveEffect,
    Teleport: () => TeleportImpl,
    Text: () => Text,
    activeEffect: () => activeEffect,
    activeEffectScope: () => activeEffectScope,
    computed: () => computed,
    createComponentInstance: () => createComponentInstance,
    createElementBlock: () => createElementBlock,
    createElementVNode: () => createVnode,
    createRenderer: () => createRenderer,
    createTextVNode: () => createTextVNode,
    createVnode: () => createVnode,
    currentInstance: () => currentInstance,
    defineAsyncComponent: () => defineAsyncComponent,
    effect: () => effect,
    effectScope: () => effectScope,
    getCurrentInstance: () => getCurrentInstance,
    h: () => h,
    inject: () => inject,
    isSameVnode: () => isSameVnode,
    isVnode: () => isVnode,
    onBeforeMount: () => onBeforeMount,
    onBeforeUpdate: () => onBeforeUpdate,
    onMounted: () => onMounted,
    onUpdated: () => onUpdated,
    openBlock: () => openBlock,
    provide: () => provide,
    proxyRefs: () => proxyRefs,
    reactive: () => reactive,
    recordEffectScope: () => recordEffectScope,
    ref: () => ref,
    render: () => render,
    renderComponent: () => renderComponent,
    setCurrentInstance: () => setCurrentInstance,
    setupComponent: () => setupComponent,
    toDisplayString: () => toDisplayString,
    toRef: () => toRef,
    toRefs: () => toRefs,
    track: () => track,
    trackEffects: () => trackEffects,
    trigger: () => trigger,
    triggerEffects: () => triggerEffects,
    watch: () => watch
  });

  // packages/shared/src/index.ts
  var isObject = (value) => {
    return typeof value === "object" && value !== null;
  };
  var isString = (value) => {
    return typeof value === "string";
  };
  var isNumber = (value) => {
    return typeof value === "number";
  };
  var isFunction = (value) => {
    return typeof value === "function";
  };
  var isArray = Array.isArray;
  var invokeArrayFns = (fns) => {
    for (let index = 0; index < fns.length; index++) {
      fns[index]();
    }
  };
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwn = (value, key) => hasOwnProperty.call(value, key);

  // packages/reactivity/src/effectScope.ts
  var activeEffectScope = null;
  var EffectScope = class {
    constructor(detached) {
      this.active = true;
      this.parent = null;
      this.effects = [];
      this.scopes = [];
      if (!detached && activeEffectScope) {
        activeEffectScope.scopes.push(this);
      }
    }
    run(fn) {
      if (this.active) {
        try {
          this.parent = activeEffectScope;
          activeEffectScope = this;
          return fn();
        } finally {
          activeEffectScope = this.parent;
        }
      }
    }
    stop() {
      if (this.active) {
        for (let i = 0; i < this.effects.length; i++) {
          this.effects[i].stop();
        }
        for (let i = 0; i < this.scopes.length; i++) {
          this.scopes[i].stop();
        }
        this.active = false;
      }
    }
  };
  function recordEffectScope(effect2) {
    if (activeEffectScope && activeEffectScope.active) {
      activeEffectScope.effects.push(effect2);
    }
  }
  function effectScope(detached = false) {
    return new EffectScope(detached);
  }

  // packages/reactivity/src/effect.ts
  var activeEffect = void 0;
  function cleanupEffect(effect2) {
    const { deps } = effect2;
    for (let index = 0; index < deps.length; index++) {
      deps[index].delete(effect2);
    }
    effect2.deps.length = 0;
  }
  var ReactiveEffect = class {
    constructor(fn, scheduler) {
      this.fn = fn;
      this.scheduler = scheduler;
      this.parent = null;
      this.deps = [];
      this.active = true;
      recordEffectScope(this);
    }
    run() {
      if (!this.active) {
        return this.fn();
      }
      try {
        this.parent = activeEffect;
        activeEffect = this;
        cleanupEffect(this);
        return this.fn();
      } finally {
        activeEffect = this.parent;
        this.parent = null;
      }
    }
    stop() {
      if (this.active) {
        this.active = false;
        cleanupEffect(this);
      }
    }
  };
  function effect(fn, option = {}) {
    const _effect = new ReactiveEffect(fn, option == null ? void 0 : option.scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
  }
  var targetMap = /* @__PURE__ */ new WeakMap();
  function track(target, type, key, thisReactiveEffect = activeEffect) {
    var activeEffect2 = thisReactiveEffect || activeEffect2;
    if (!activeEffect2) {
      return;
    }
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      depsMap = /* @__PURE__ */ new Map();
      targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
      dep = /* @__PURE__ */ new Set();
      depsMap.set(key, dep);
    }
    trackEffects(dep, activeEffect2);
  }
  function trackEffects(dep, thisReactiveEffect = activeEffect) {
    var activeEffect2 = thisReactiveEffect || activeEffect2;
    if (activeEffect2) {
      let shouldTrack = !dep.has(activeEffect2);
      if (shouldTrack) {
        dep.add(activeEffect2);
        activeEffect2.deps.push(dep);
      }
    }
  }
  function trigger(target, type, key, value, oldValue, theWeakMap = targetMap, thisReactiveEffect = activeEffect) {
    var activeEffect2 = thisReactiveEffect || activeEffect2;
    var targetMap2 = theWeakMap || targetMap2;
    const depsMap = targetMap2 == null ? void 0 : targetMap2.get(target);
    if (!depsMap) {
      return;
    }
    let effects = depsMap.get(key);
    if (effects) {
      triggerEffects(effects);
    }
  }
  function triggerEffects(effects) {
    const effectList = new Set(effects);
    effectList.forEach((theReactiveEffect) => {
      if (theReactiveEffect !== activeEffect) {
        if (theReactiveEffect.scheduler) {
          theReactiveEffect.scheduler();
        } else {
          theReactiveEffect.run();
        }
      }
    });
  }

  // packages/reactivity/src/baseHandler.ts
  var mutableHandlers = {
    get(target, key, receiver) {
      if (key === "__v_isReactive" /* IS_REACTIVE */) {
        return true;
      }
      track(target, `get`, key, activeEffect);
      const res = Reflect.get(target, key, receiver);
      if (isObject(res)) {
        return reactive(res);
      }
      return res;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);
      if (oldValue !== value) {
        trigger(target, `set`, key, value, oldValue);
      }
      return result;
    }
  };

  // packages/reactivity/src/reactive.ts
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  function isReactive(value) {
    return !!(value == null ? void 0 : value["__v_isReactive" /* IS_REACTIVE */]);
  }
  function reactive(target) {
    if (!isObject(target)) {
      return;
    }
    const exisitingProxy = reactiveMap.get(target);
    if (exisitingProxy) {
      return exisitingProxy;
    }
    if (target["__v_isReactive" /* IS_REACTIVE */]) {
      return target;
    }
    const proxy = new Proxy(target, mutableHandlers);
    reactiveMap.set(target, proxy);
    return proxy;
  }

  // packages/reactivity/src/computed.ts
  var ComputedRefImpl = class {
    constructor(getter, setter) {
      this.setter = setter;
      this.effect = null;
      this._dirty = true;
      this.__v_isReadonly = true;
      this.__v_isRef = true;
      this.dep = /* @__PURE__ */ new Set();
      this.effect = new ReactiveEffect(getter, () => {
        if (!this._dirty) {
          this._dirty = true;
          triggerEffects(this.dep);
        }
      });
    }
    get value() {
      trackEffects(this.dep, activeEffect);
      if (this._dirty) {
        this._dirty = false;
        this._value = this.effect.run();
      }
      return this._value;
    }
    set value(newValue) {
      this.setter(newValue);
    }
  };
  var computed = (getterOrOptions) => {
    const onlyGetter = isFunction(getterOrOptions);
    let getter;
    let setter;
    if (onlyGetter) {
      getter = getterOrOptions;
      setter = () => {
        console.warn(`no set ;\u8BA1\u7B97\u5C5E\u6027\u6CA1\u6709\u8BBE\u7F6Eset\u65B9\u6CD5;`);
      };
    } else {
      getter = (getterOrOptions == null ? void 0 : getterOrOptions.get) || (() => {
        console.warn(`\u8BA1\u7B97\u5C5E\u6027\u6CA1\u6709\u8BBE\u7F6Eget\u65B9\u6CD5;`);
      });
      setter = (getterOrOptions == null ? void 0 : getterOrOptions.set) || (() => {
        console.warn(`no set ;\u8BA1\u7B97\u5C5E\u6027\u6CA1\u6709\u8BBE\u7F6Eset\u65B9\u6CD5;`);
      });
    }
    return new ComputedRefImpl(getter, setter);
  };

  // packages/reactivity/src/watch.ts
  function traversal(value, set = /* @__PURE__ */ new Set()) {
    if (!isObject(value)) {
      return value;
    }
    if (set.has(value)) {
      return value;
    }
    set.add(value);
    for (let key in value) {
      traversal(value[key], set);
    }
    return value;
  }
  function watch(source, cb) {
    let getter;
    if (isReactive(source)) {
      getter = () => {
        return traversal(source);
      };
    } else if (isFunction(source)) {
      getter = source;
    } else {
      return;
    }
    let cleanup;
    const onCleanup = (fn) => {
      cleanup = fn;
    };
    let oldValue;
    const job = () => {
      if (cleanup) {
        cleanup();
      }
      const newValue = effect2.run();
      cb == null ? void 0 : cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    };
    const effect2 = new ReactiveEffect(getter, job);
    oldValue = effect2.run();
  }

  // packages/reactivity/src/ref.ts
  function toReactive(value) {
    return isObject(value) ? reactive(value) : value;
  }
  var RefImpl = class {
    constructor(rawValue) {
      this.rawValue = rawValue;
      this.dep = /* @__PURE__ */ new Set();
      this.__v_isRef = true;
      this._value = toReactive(rawValue);
    }
    get value() {
      trackEffects(this.dep, activeEffect);
      return this._value;
    }
    set value(newValue) {
      if (newValue !== this.rawValue) {
        this._value = toReactive(newValue);
        this.rawValue = newValue;
        triggerEffects(this.dep);
      }
    }
  };
  function ref(value) {
    return new RefImpl(value);
  }
  var ObjectRefImpl = class {
    constructor(object, key) {
      this.object = object;
      this.key = key;
    }
    get value() {
      return this.object[this.key];
    }
    set value(newValue) {
      this.object[this.key] = newValue;
    }
  };
  function toRef(theObject, key) {
    return new ObjectRefImpl(theObject, key);
  }
  function toRefs(object) {
    const result = isArray(object) ? new Array(object.length) : {};
    for (const key in object) {
      result[key] = toRef(object, key);
    }
    return result;
  }
  function proxyRefs(object) {
    return new Proxy(object, {
      get(target, key, recevier) {
        const r = Reflect.get(target, key, recevier);
        return r.__v_isRef ? r.value : r;
      },
      set(target, key, value, recevier) {
        const oldValue = target[key];
        if (oldValue.__v_isRef) {
          oldValue.value = value;
          return true;
        } else {
          return Reflect.set(target, key, value, recevier);
        }
      }
    });
  }

  // packages/runtime-core/src/sequence.ts
  function getSequence(arr) {
    const len = arr.length;
    const result = [0];
    const p = new Array(len).fill(0);
    let resultLastIndex;
    for (let i = 0; i < len; i++) {
      const arrI = arr[i];
      if (arrI === 0) {
        continue;
      }
      resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        result.push(i);
        p[i] = resultLastIndex;
        continue;
      }
      let start = 0;
      let end = result.length - 1;
      let middle;
      for (; start < end; ) {
        middle = (start + end) / 2 | 0;
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      if (arr[result[end]] > arrI) {
        result[end] = i;
        p[i] = result[end - 1];
      }
    }
    for (let i = result.length - 1, last = result[i]; i >= 0; last = p[last], i--) {
      result[i] = last;
    }
    return result;
  }

  // packages/runtime-core/src/components/Teleport.ts
  var TeleportImpl = {
    __isTeleport: true,
    process(n1, n2, container, anchor = null, internals) {
      var _a;
      for (let index = 0; index < ((_a = n2.children) == null ? void 0 : _a.length); index++) {
        if (isString(n2.children[index]) || isNumber(n2.children[index])) {
          const vnode = createVnode(Text, null, String(n2.children[index]));
          n2.children[index] = vnode;
        }
      }
      const { mountChildren, patchChildren, move } = internals;
      if (!n1) {
        const target = document.querySelector(n2.props.to);
        if (target) {
          mountChildren(n2.children, target);
        }
      } else {
        patchChildren(n1, n2, container);
        if (n2.props.to !== n1.props.to) {
          const nextTarget = document.querySelector(n2.props.to);
          n2.children.forEach((child) => {
            move(child, nextTarget);
          });
        }
      }
    }
  };
  var isTeleport = (type) => type.__isTeleport;

  // packages/runtime-core/src/vnode.ts
  var Text = Symbol("Text");
  var Fragment = Symbol("Fragment");
  function isVnode(value) {
    return !!(value == null ? void 0 : value.__v_isVnode);
  }
  function isSameVnode(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }
  function createVnode(type, props, children = null, patchFlag = 0) {
    let shapeFlag = isString(type) ? 1 /* ELEMENT */ : isTeleport(type) ? 64 /* TELEPORT */ : isFunction(type) ? 2 /* FUNCTIONAL_COMPONENT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : 0;
    const vnode = {
      type,
      props,
      children,
      el: null,
      key: props == null ? void 0 : props["key"],
      __v_isVnode: true,
      shapeFlag,
      patchFlag
    };
    if (children) {
      let type2 = 0;
      if (isArray(children)) {
        type2 = 16 /* ARRAY_CHILDREN */;
      } else if (isObject(children)) {
        type2 = 32 /* SLOTS_CHILDREN */;
      } else {
        children = String(children);
        type2 = 8 /* TEXT_CHILDREN */;
      }
      vnode.shapeFlag = vnode.shapeFlag | type2;
    }
    if (currentBlock && vnode.patchFlag > 0) {
      currentBlock.push(vnode);
    }
    return vnode;
  }
  var currentBlock = null;
  function openBlock() {
    currentBlock = [];
  }
  function createElementBlock(type, props, children, patchFlag) {
    return setupBlock(createVnode(type, props, children, patchFlag));
  }
  function createTextVNode(value, patchFlag = 0) {
    return createVnode(Text, null, String(value), patchFlag);
  }
  function setupBlock(vnode) {
    vnode.dynamicChildren = currentBlock;
    currentBlock = null;
    return vnode;
  }
  function toDisplayString(value) {
    return isString(value) ? value : value === void 0 || value === null ? "" : isObject(value) ? JSON.stringify(value) : String(value);
  }

  // packages/runtime-core/src/scheduler.ts
  var queue = [];
  var isFlushing = false;
  var resolvePromise = Promise.resolve();
  function queueJob(job) {
    if (!queue.includes(job)) {
      queue.push(job);
    }
    if (!isFlushing) {
      isFlushing = true;
      resolvePromise.then(() => {
        isFlushing = false;
        const copy = queue.slice(0);
        queue.length = 0;
        for (let i = 0; i < copy.length; i++) {
          const job2 = copy[i];
          job2();
        }
        copy.length = 0;
      });
    }
  }

  // packages/runtime-core/src/componentProps.ts
  function initProps(instance, rawProps) {
    const props = {};
    const attrs = {};
    const options = instance.propsOptions || {};
    if (rawProps) {
      for (const key in rawProps) {
        const value = rawProps[key];
        if (hasOwn(options, key)) {
          props[key] = value;
        } else {
          attrs[key] = value;
        }
      }
    }
    instance.props = reactive(props);
    instance.attrs = attrs;
    if (instance.vnode.shapeFlag & 2 /* FUNCTIONAL_COMPONENT */) {
      instance.props = instance.attrs;
    }
  }
  var hasPropsChanged = (prevProps = {}, nextProps = {}) => {
    const nextKeys = Object.keys(nextProps);
    if (nextKeys.length !== Object.keys(prevProps).length) {
      return true;
    }
    for (let i = 0; i < nextKeys.length; i++) {
      const key = nextKeys[i];
      if (nextProps[key] !== prevProps[key]) {
        return true;
      }
    }
    return false;
  };
  function updateProps(prevProps, nextProps) {
    for (const key in nextProps) {
      prevProps[key] = nextProps[key];
    }
    for (const key in prevProps) {
      if (!hasOwn(nextProps, key)) {
        delete prevProps[key];
      }
    }
  }

  // packages/runtime-core/src/component.ts
  var currentInstance = null;
  var setCurrentInstance = (instance) => currentInstance = instance;
  var getCurrentInstance = () => currentInstance;
  function createComponentInstance(vnode, parent) {
    const instance = {
      ctx: {},
      provides: parent ? parent.provides : /* @__PURE__ */ Object.create(null),
      parent,
      data: null,
      vnode,
      subTree: null,
      isMounted: false,
      update: null,
      propsOptions: vnode.type.props,
      props: {},
      attrs: {},
      proxy: null,
      render: null,
      next: null,
      setupState: {},
      slots: {}
    };
    return instance;
  }
  var publictPropertyMap = {
    $attrs: (instance) => instance.attrs,
    $slots: (instance) => instance.slots
  };
  var publicInstanceProxy = {
    get(target, key) {
      const { data, props, setupState } = target;
      if (data && hasOwn(data, key)) {
        return data[key];
      } else if (props && hasOwn(setupState, key)) {
        return setupState[key];
      } else if (props && hasOwn(props, key)) {
        return props[key];
      }
      const getter = publictPropertyMap[key];
      if (getter) {
        return getter(target);
      }
    },
    set(target, key, value) {
      const { data, props, setupState } = target;
      if (data && hasOwn(data, key)) {
        data[key] = value;
      } else if (props && hasOwn(setupState, key)) {
        setupState[key] = value;
      } else if (props && hasOwn(props, key)) {
        console.warn("\u7981\u6B62\u4FEE\u6539props\u4E0A\u7684\u5C5E\u6027" + key);
        return false;
      }
      return true;
    }
  };
  function initSlots(instance, children) {
    if (instance.vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
      instance.slots = children;
    }
  }
  function setupComponent(instance) {
    const { props, type, children } = instance.vnode;
    initProps(instance, props);
    initSlots(instance, children);
    instance.proxy = new Proxy(instance, publicInstanceProxy);
    const data = type.data;
    if (data) {
      if (!isFunction(data)) {
        return console.warn("vue3\u4E2D\u7EC4\u4EF6\u7684data\u53EA\u80FD\u662F\u51FD\u6570,\u4E0D\u80FD\u518D\u50CFvue2\u4E2D\u53EF\u4EE5\u662F\u5BF9\u8C61\u4E86");
      }
      instance.data = reactive(data.call(instance.proxy));
    }
    const setup = type.setup;
    if (setup) {
      const setupContext = {
        emit: (event, ...args) => {
          const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
          const handler = instance.vnode.props[eventName];
          if (handler) {
            handler(...args);
          }
        },
        attrs: instance.attrs,
        slots: instance.slots
      };
      setCurrentInstance(instance);
      const setupResult = setup(instance.props, setupContext);
      setCurrentInstance(null);
      if (isFunction(setupResult)) {
        instance.render = setupResult;
      } else if (isObject(setupResult)) {
        instance.setupState = proxyRefs(setupResult);
      }
    }
    if (!instance.render) {
      instance.render = type.render;
    }
  }
  function renderComponent(instance) {
    const { vnode, render: render2, props } = instance;
    if (vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */) {
      return render2.call(instance.proxy, instance.proxy);
    } else {
      return vnode.type(props);
    }
  }

  // packages/runtime-core/src/apiLifecycle.ts
  var LifecycleHooks = /* @__PURE__ */ ((LifecycleHooks2) => {
    LifecycleHooks2["BEFORE_MOUNT"] = "bm";
    LifecycleHooks2["MOUNTED"] = "m";
    LifecycleHooks2["BEFORE_UPDATE"] = "bu";
    LifecycleHooks2["UPDATED"] = "u";
    return LifecycleHooks2;
  })(LifecycleHooks || {});
  function createHook(type) {
    return (hook, target = currentInstance) => {
      if (target) {
        const hooks = target[type] || (target[type] = []);
        const wrappedHook = () => {
          setCurrentInstance(target);
          hook();
          setCurrentInstance(null);
        };
        hooks.push(wrappedHook);
      }
    };
  }
  var onBeforeMount = createHook("bm" /* BEFORE_MOUNT */);
  var onMounted = createHook("m" /* MOUNTED */);
  var onBeforeUpdate = createHook("bu" /* BEFORE_UPDATE */);
  var onUpdated = createHook("u" /* UPDATED */);

  // packages/runtime-core/src/components/KeepAlive.ts
  function resetShapeFlag(vnode) {
    let shapeFlag = vnode.shapeFlag;
    if (shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
      shapeFlag -= 256 /* COMPONENT_SHOULD_KEEP_ALIVE */;
    }
    if (shapeFlag & 512 /* COMPONENT_KEPT_ALIVE */) {
      shapeFlag -= 512 /* COMPONENT_KEPT_ALIVE */;
    }
    vnode.shapeFlag = shapeFlag;
  }
  var KeepAliveImpl = {
    __isKeepAlive: true,
    props: {
      include: {},
      exclude: {},
      max: {}
    },
    setup(props, { slots }) {
      const keys = /* @__PURE__ */ new Set();
      const cache = /* @__PURE__ */ new Map();
      const instance = getCurrentInstance();
      const { createElement, move } = instance.ctx.renderer;
      const storageContainer = createElement("div");
      instance.ctx.deactivate = function(vnode) {
        move(vnode, storageContainer);
      };
      instance.ctx.activate = function(vnode, container, anchor) {
        move(vnode, container, anchor);
      };
      let pendingCacheKey = null;
      function cacheSubTree() {
        if (pendingCacheKey) {
          cache.set(pendingCacheKey, instance.subTree);
        }
      }
      onMounted(cacheSubTree);
      onUpdated(cacheSubTree);
      const { include, exclude, max } = props;
      let current = null;
      function pruneCacheEntry(key) {
        resetShapeFlag(current);
        cache.delete(key);
        keys.delete(key);
      }
      return () => {
        const vnode = slots.default();
        if (!isVnode(vnode) || !(vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */)) {
          return vnode;
        }
        const comp = vnode.type;
        const key = vnode.key === null || vnode.key === void 0 ? comp : vnode.key;
        const name = comp.name;
        if (name && (include && !include.split(",").includes(name)) || exclude && exclude.split(",").includes(name)) {
          return vnode;
        }
        const cacheVnode = cache.get(key);
        if (cacheVnode) {
          vnode.component = cacheVnode.component;
          vnode.shapeFlag |= 512 /* COMPONENT_KEPT_ALIVE */;
          keys.delete(key);
          keys.add(key);
        } else {
          keys.add(key);
          pendingCacheKey = key;
          if (max && keys.size > max) {
            pruneCacheEntry(keys.values().next().value);
          }
        }
        vnode.shapeFlag |= 256 /* COMPONENT_SHOULD_KEEP_ALIVE */;
        current = vnode;
        return vnode;
      };
    }
  };
  var isKeepAlive = (vnode) => vnode.type.__isKeepAlive;

  // packages/runtime-core/src/renderer.ts
  function createRenderer(renderOptions2) {
    const {
      insert: hostInsert,
      remove: hostRemove,
      setElementText: hostSetElementText,
      setText: hostSetText,
      querySelector: hostQuerySelector,
      parentNode: hostParentNode,
      nextSibling: hostNextSibling,
      createElement: hostCreateElement,
      createText: hostCreateText,
      patchProp: hostPatchProp
    } = renderOptions2;
    const normalize = (child, index) => {
      if (isString(child[index]) || isNumber(child[index])) {
        const vnode = createVnode(Text, null, String(child[index]));
        child[index] = vnode;
      }
      return child[index];
    };
    const mountChildren = (children, container, parentComponent = null) => {
      for (let index = 0; index < (children == null ? void 0 : children.length); index++) {
        const child = normalize(children, index);
        patch(null, child, container, null, parentComponent);
      }
    };
    const mountElement = (vnode, container, anchor = null, parentComponent) => {
      const { type, props, children, shapeFlag } = vnode;
      vnode.el = hostCreateElement(type);
      const el = vnode.el;
      if (props) {
        for (const key in props) {
          hostPatchProp(el, key, null, props[key]);
        }
      }
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        hostSetElementText(el, children);
      } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        mountChildren(children, el, parentComponent);
      }
      hostInsert(el, container, anchor);
    };
    const processText = (n1, n2, container) => {
      if (n1 === null) {
        n2.el = hostCreateText(n2.children);
        hostInsert(n2.el, container);
      } else {
        const el = n2.el = n1.el;
        if (n1.children !== n2.children) {
          hostSetText(el, n2.children);
        }
      }
    };
    const patchProps = (oldProps, newProps, el) => {
      for (const key in newProps) {
        hostPatchProp(el, key, oldProps[key], newProps[key]);
      }
      for (const key in oldProps) {
        if (newProps[key] === null || newProps[key] === void 0) {
          hostPatchProp(el, key, oldProps[key], void 0);
        }
      }
    };
    const unmountChildren = (children, parentComponent) => {
      for (let index = 0; index < children.length; index++) {
        unmount(children[index], parentComponent);
      }
    };
    const patchKeyedChildren = (c1, c2, el, parentComponent) => {
      let i = 0;
      let e1 = c1.length - 1;
      let e2 = c2.length - 1;
      for (; i <= e1 && i <= e2; i++) {
        const n1 = c1[i];
        const n2 = c2[i];
        if (isSameVnode(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
      }
      for (; i <= e1 && i <= e2; e1--, e2--) {
        const n1 = c1[e1];
        const n2 = c2[e2];
        if (isSameVnode(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
      }
      if (i > e1) {
        if (i <= e2) {
          for (; i <= e2; i++) {
            const nextPos = e2 + 1;
            const anchor = nextPos < c2.length ? c2[nextPos].el : null;
            patch(null, c2[i], el, anchor);
          }
        }
      } else if (i > e2) {
        if (i <= e1) {
          for (; i <= e1; i++) {
            unmount(c1[i], parentComponent);
          }
        }
      }
      let s1 = i;
      let s2 = i;
      const keyToNewIndexMap = /* @__PURE__ */ new Map();
      for (let index = s2; index <= e2; index++) {
        keyToNewIndexMap.set(c2[index].key, index);
      }
      const toBePatched = e2 - s2 + 1;
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
      for (let index = s1; index <= e1; index++) {
        const oldChild = c1[index];
        const newIndex = keyToNewIndexMap.get(oldChild.key);
        if (newIndex === void 0) {
          unmount(oldChild, parentComponent);
        } else {
          newIndexToOldIndexMap[newIndex - s2] = index + 1;
          patch(oldChild, c2[newIndex], el);
        }
      }
      const increment = getSequence(newIndexToOldIndexMap);
      let j = increment.length - 1;
      for (let theIndex = toBePatched - 1; theIndex >= 0; theIndex--) {
        const index = theIndex + s2;
        const current = c2[index];
        const anchor = index + 1 < c2.length ? c2[index + 1].el : null;
        if (newIndexToOldIndexMap[theIndex] === 0) {
          patch(null, current, el, anchor);
        } else {
          if (theIndex !== increment[j]) {
            hostInsert(current.el, el, anchor);
          } else {
            console.log("\u8FD9\u91CC\u4E0D\u505A\u63D2\u5165\u4E86;");
            j--;
          }
        }
      }
    };
    const patchChildren = (n1, n2, el, parentComponent = null) => {
      const c1 = (n1 == null ? void 0 : n1.children) || null;
      const c2 = (n2 == null ? void 0 : n2.children) || null;
      const prevShapeFlag = n1.shapeFlag;
      const shapeFlag = n2.shapeFlag;
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          unmountChildren(c1, parentComponent);
        }
        if (c1 !== c2) {
          hostSetElementText(el, c2);
        }
      } else {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            patchKeyedChildren(c1, c2, el, parentComponent);
          } else {
            unmountChildren(c1, parentComponent);
          }
        } else {
          if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
            hostSetElementText(el, "");
          }
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(c2, el, parentComponent);
          }
        }
      }
    };
    const patchBlockChildren = (n1, n2, parentComponent) => {
      for (let i = 0; i < n2.dynamicChildren.length; i++) {
        patchElement(n1.dynamicChildren[i], n2.dynamicChildren[i], parentComponent);
      }
    };
    const patchElement = (n1, n2, parentComponent) => {
      var _a;
      const el = n2.el = n1.el;
      const oldProps = n1.props || {};
      const newProps = n2.props || {};
      const { patchFlag } = n2;
      if (patchFlag & 2 /* CLASS */) {
        if ((oldProps == null ? void 0 : oldProps.class) !== (newProps == null ? void 0 : newProps.class)) {
          hostPatchProp(el, "class", null, newProps.class);
        }
      } else {
        patchProps(oldProps, newProps, el);
      }
      if (isArray(n2.children)) {
        for (let index = 0; index < ((_a = n2.children) == null ? void 0 : _a.length); index++) {
          n2.children[index] = normalize(n2.children, index);
        }
      }
      if (n2.dynamicChildren) {
        console.log("n2.dynamicChildren--->", n2.dynamicChildren);
        patchBlockChildren(n1, n2, parentComponent);
      } else {
        patchChildren(n1, n2, el, parentComponent);
      }
    };
    const processElement = (n1, n2, container, anchor = null, parentComponent) => {
      if (n1 === null) {
        mountElement(n2, container, anchor, parentComponent);
      } else {
        patchElement(n1, n2, parentComponent);
      }
    };
    const processFragment = (n1, n2, container, parentComponent) => {
      var _a;
      if (n1 === null || n1 === void 0) {
        if (!isArray(n2.children)) {
          console.log("Fragment\u7684\u5B50\u8282\u70B9\u4E0D\u662F\u6570\u7EC4,\u76F4\u63A5\u9000\u51FA\u6302\u8F7D");
          return;
        }
        mountChildren(n2.children, container, parentComponent);
      } else {
        if (isArray(n2.children)) {
          for (let index = 0; index < ((_a = n2.children) == null ? void 0 : _a.length); index++) {
            n2.children[index] = normalize(n2.children, index);
          }
        }
        patchChildren(n1, n2, container, parentComponent);
      }
    };
    const mountComponent = (vnode, container, anchor = null, parentComponent) => {
      const instance = vnode.component = createComponentInstance(vnode, parentComponent);
      if (isKeepAlive(vnode)) {
        instance.ctx.renderer = {
          createElement: hostCreateElement,
          move(vnode2, container2) {
            hostInsert(vnode2.component.subTree.el, container2);
          }
        };
      }
      setupComponent(instance);
      setupRenderEffect(instance, container, anchor);
    };
    const updateComponentPreRender = (instance, next) => {
      instance.next = null;
      instance.vnode = next;
      updateProps(instance.props, next.props);
      Object.assign(instance.slots, next.children);
    };
    const setupRenderEffect = (instance, container, anchor = null) => {
      const { render: render3, vnode } = instance;
      const componentUpdateFn = () => {
        if (!instance.isMounted) {
          const { bm, m } = instance;
          if (bm) {
            invokeArrayFns(bm);
          }
          const subTree = renderComponent(instance);
          patch(null, subTree, container, anchor, instance);
          instance.subTree = subTree;
          instance.isMounted = true;
          if (m) {
            invokeArrayFns(m);
          }
        } else {
          const { next } = instance;
          if (next) {
            updateComponentPreRender(instance, next);
          }
          const { bu, u } = instance;
          if (bu) {
            invokeArrayFns(bu);
          }
          const subTree = renderComponent(instance);
          patch(instance.subTree, subTree, container, anchor, instance);
          instance.subTree = subTree;
          if (u) {
            invokeArrayFns(u);
          }
        }
      };
      const effect2 = new ReactiveEffect(componentUpdateFn, () => queueJob(instance.update));
      const update = instance.update = effect2.run.bind(effect2);
      update();
    };
    const shouldUpdateComponent = (n1, n2) => {
      const { props: prevProps, children: prevChildren } = n1;
      const { props: nextProps, children: nextChildren } = n2;
      if (prevChildren || nextChildren) {
        return true;
      }
      if (prevProps === nextProps) {
        return false;
      }
      return hasPropsChanged(prevProps, nextProps);
    };
    const updateComponent = (n1, n2) => {
      const instance = n2.component = n1.component;
      if (shouldUpdateComponent(n1, n2)) {
        instance.next = n2;
        instance.update();
      }
    };
    const processComponent = (n1, n2, container, anchor = null, parentComponent) => {
      if (n1 === null) {
        if (n2.shapeFlag & 512 /* COMPONENT_KEPT_ALIVE */) {
          parentComponent.ctx.activate(n2, container, anchor);
        } else {
          mountComponent(n2, container, anchor, parentComponent);
        }
      } else {
        updateComponent(n1, n2);
      }
    };
    const patch = (n1, n2, container, anchor = null, parentComponent = null) => {
      if (n1 === n2) {
        return;
      }
      if (n1 && !isSameVnode(n1, n2)) {
        unmount(n1, parentComponent);
        n1 = null;
      }
      const { type, shapeFlag } = n2;
      switch (type) {
        case Text:
          processText(n1, n2, container);
          break;
        case Fragment:
          processFragment(n1, n2, container, parentComponent);
          break;
        default:
          if (shapeFlag & 1 /* ELEMENT */) {
            processElement(n1, n2, container, anchor, parentComponent);
          } else if (shapeFlag & 6 /* COMPONENT */) {
            processComponent(n1, n2, container, anchor, parentComponent);
          } else if (shapeFlag & 64 /* TELEPORT */) {
            type.process(n1, n2, container, anchor, {
              mountChildren,
              patchChildren,
              move(vnode, container2, anchor2) {
                hostInsert(vnode.component ? vnode.component.subTree.el : vnode.el, container2, anchor2);
              }
            });
          }
          break;
      }
    };
    const unmount = (vnode, parentComponent) => {
      if (vnode.type === Fragment) {
        return unmountChildren(vnode.children, parentComponent);
      } else if (vnode.shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
        return parentComponent.ctx.deactivate(vnode);
      } else if (vnode.shapeFlag & 6 /* COMPONENT */) {
        return unmount(vnode.component.subTree, null);
      }
      hostRemove(vnode.el);
    };
    const render2 = (vnode, container) => {
      if (vnode === null || vnode === void 0) {
        if (container._vnode) {
          unmount(container._vnode, null);
        }
      } else {
        patch(container._vnode || null, vnode, container);
      }
      container._vnode = vnode;
    };
    return {
      render: render2
    };
  }

  // packages/runtime-core/src/h.ts
  function h(type, propsChildren, children) {
    const theLength = arguments.length;
    if (theLength === 2) {
      if (isObject(propsChildren) && !isArray(propsChildren)) {
        if (isVnode(propsChildren)) {
          return createVnode(type, null, [propsChildren]);
        }
        return createVnode(type, propsChildren);
      } else {
        return createVnode(type, null, propsChildren);
      }
    } else {
      if (theLength > 3) {
        children = Array.from(arguments).slice(2);
      } else if (theLength === 3 && isVnode(children)) {
        children = [children];
      }
      return createVnode(type, propsChildren, children);
    }
  }

  // packages/runtime-core/src/apiInject.ts
  function provide(key, value) {
    if (!currentInstance) {
      return;
    }
    const parentProvides = currentInstance.parent && currentInstance.parent.provides;
    let provides = currentInstance.provides;
    if (parentProvides === provides) {
      provides = currentInstance.provides = Object.create(provides);
    }
    provides[key] = value;
  }
  function inject(key, defaultValue) {
    if (!currentInstance) {
      return;
    }
    const provides = currentInstance.parent && currentInstance.parent.provides;
    if (provides && key in provides) {
      return provides[key];
    } else if (arguments.length > 1) {
      let theReturn = defaultValue;
      if (typeof defaultValue === "function") {
        theReturn = defaultValue();
      }
      return theReturn;
    }
  }

  // packages/runtime-core/src/defineAsyncComponent.ts
  function defineAsyncComponent(options) {
    if (typeof options === "function") {
      options = { loader: options };
    }
    return {
      setup() {
        const loaded = ref(false);
        const error = ref(false);
        const loading = ref(false);
        const { loader, timeout, errorComponent, delay, loadingComponent, onError } = options;
        if (delay) {
          setTimeout(() => {
            loading.value = true;
          }, delay);
        }
        let Comp = null;
        function load() {
          return loader().catch((err) => {
            if (onError) {
              return new Promise((resolve, reject) => {
                const retry = () => resolve(load());
                const fail = () => reject(err);
                onError(err, retry, fail);
              });
            }
          });
        }
        load().then((component) => {
          Comp = component;
          loaded.value = true;
        }).catch((err) => error.value = err).finally(() => {
          loading.value = false;
        });
        setTimeout(() => {
          error.value = true;
        }, timeout);
        return () => {
          if (loaded.value) {
            return h(Comp);
          } else if (error.value && errorComponent) {
            return h(errorComponent);
          } else if (loading.value && loadingComponent) {
            return h(loadingComponent);
          }
          return h(Fragment, []);
        };
      }
    };
  }

  // packages/runtime-dom/src/nodeOps.ts
  var nodeOps = {
    insert(child, parent, anchor = null) {
      parent.insertBefore(child, anchor);
    },
    remove(child) {
      const parentNode = child == null ? void 0 : child.parentNode;
      if (parentNode) {
        parentNode.removeChild(child);
      }
    },
    setElementText(el, text) {
      el.textContent = text;
    },
    setText(node, text) {
      node.nodeValue = text;
    },
    querySelector(selector) {
      return document.querySelector(selector);
    },
    parentNode(node) {
      return node.parentNode;
    },
    nextSibling(node) {
      return node.nextSibling;
    },
    createElement(tagName) {
      return document.createElement(tagName);
    },
    createText(text) {
      return document.createTextNode(text);
    }
  };

  // packages/runtime-dom/src/modules/attr.ts
  function patchAttr(el, key, nextValue) {
    if (nextValue) {
      el.setAttribute(key, nextValue);
    } else {
      el.removeAttribute(key);
    }
  }

  // packages/runtime-dom/src/modules/class.ts
  function patchClass(el, nextValue) {
    if (nextValue === null) {
      el.removeAttribute("class");
    } else {
      el.className = nextValue;
    }
  }

  // packages/runtime-dom/src/modules/event.ts
  function createInvoker(callback) {
    if (typeof callback !== "function") {
      const invoker2 = (event) => {
        for (let index = 0; index < invoker2.value.length; index++) {
          invoker2.value[index](event);
        }
      };
      invoker2.value = callback;
      return invoker2;
    }
    const invoker = (event) => invoker.value(event);
    invoker.value = callback;
    return invoker;
  }
  function patchEvent(el, eventName, nextValue) {
    if (!el._vei) {
      el._vei = {};
    }
    const invokers = el._vei;
    const exits = invokers[eventName];
    if (exits && nextValue) {
      exits.value = nextValue;
    } else {
      const eventLower = eventName.slice(2).toLowerCase();
      if (nextValue) {
        invokers[eventName] = createInvoker(nextValue);
        const invoker = invokers[eventName];
        el.addEventListener(eventLower, invoker);
      } else if (exits) {
        el.removeEventListener(eventLower, exits);
        invokers[eventName] = void 0;
      }
    }
  }

  // packages/runtime-dom/src/modules/style.ts
  function patchStyle(el, prevValue = {}, nextValue = {}) {
    for (const key in nextValue) {
      el.style[key] = nextValue[key];
    }
    if (!prevValue) {
      return;
    }
    for (const key in prevValue) {
      if (!(nextValue[key] === void 0 || nextValue[key] === null)) {
        continue;
      }
      el.style[key] = null;
    }
  }

  // packages/runtime-dom/src/patchProp.ts
  function patchProp(el, key, prevValue, nextValue) {
    if (key === "class") {
      patchClass(el, nextValue);
    } else if (key === "style") {
      patchStyle(el, prevValue, nextValue);
    } else if (/^[o][n][^a-z]/.test(key)) {
      patchEvent(el, key, nextValue);
    } else {
      patchAttr(el, key, nextValue);
    }
  }

  // packages/runtime-dom/src/index.ts
  var renderOptions = Object.assign(nodeOps, { patchProp });
  function render(vnode, container) {
    createRenderer(renderOptions).render(vnode, container);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=runtime-dom.global.js.map
