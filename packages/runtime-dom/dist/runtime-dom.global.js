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
    Text: () => Text,
    createRenderer: () => createRenderer,
    createVnode: () => createVnode,
    h: () => h,
    isSameVnode: () => isSameVnode,
    isVnode: () => isVnode,
    render: () => render
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
  var isArray = Array.isArray;

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

  // packages/runtime-core/src/vnode.ts
  var Text = Symbol("Text");
  var Fragment = Symbol("Fragment");
  function isVnode(value) {
    return !!(value == null ? void 0 : value.__v_isVnode);
  }
  function isSameVnode(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }
  function createVnode(type, props, children = null) {
    let shapeFlag = isString(type) ? 1 /* ELEMENT */ : 0;
    const vnode = {
      type,
      props,
      children,
      el: null,
      key: props == null ? void 0 : props["key"],
      __v_isVnode: true,
      shapeFlag
    };
    if (children) {
      let type2 = 0;
      if (isArray(children)) {
        type2 = 16 /* ARRAY_CHILDREN */;
      } else {
        children = String(children);
        type2 = 8 /* TEXT_CHILDREN */;
      }
      vnode.shapeFlag = vnode.shapeFlag | type2;
    }
    return vnode;
  }

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
      if (isString(child[index])) {
        const vnode = createVnode(Text, null, child[index]);
        child[index] = vnode;
      }
      if (isNumber(child[index])) {
        const vnode = createVnode(Text, null, String(child[index]));
        child[index] = vnode;
      }
      return child[index];
    };
    const mountChildren = (children, container) => {
      for (let index = 0; index < (children == null ? void 0 : children.length); index++) {
        const child = normalize(children, index);
        patch(null, child, container);
      }
    };
    const mountElement = (vnode, container, anchor = null) => {
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
        mountChildren(children, el);
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
    const unmountChildren = (children) => {
      for (let index = 0; index < children.length; index++) {
        unmount(children[index]);
      }
    };
    const patchKeyedChildren = (c1, c2, el) => {
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
            unmount(c1[i]);
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
          unmount(oldChild);
        } else {
          newIndexToOldIndexMap[newIndex - s2] = index + 1;
          patch(oldChild, c2[newIndex], el);
        }
      }
      console.log("newIndexToOldIndexMap--->", JSON.parse(JSON.stringify(newIndexToOldIndexMap)));
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
    const patchChildren = (n1, n2, el) => {
      const c1 = (n1 == null ? void 0 : n1.children) || null;
      const c2 = (n2 == null ? void 0 : n2.children) || null;
      const prevShapeFlag = n1.shapeFlag;
      const shapeFlag = n2.shapeFlag;
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          unmountChildren(c1);
        }
        if (c1 !== c2) {
          hostSetElementText(el, c2);
        }
      } else {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            patchKeyedChildren(c1, c2, el);
          } else {
            unmountChildren(c1);
          }
        } else {
          if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
            hostSetElementText(el, "");
          }
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(c2, el);
          }
        }
      }
    };
    const patchElement = (n1, n2) => {
      const el = n2.el = n1.el;
      const oldProps = n1.props || {};
      const newProps = n2.props || {};
      patchProps(oldProps, newProps, el);
      patchChildren(n1, n2, el);
    };
    const processElement = (n1, n2, container, anchor = null) => {
      if (n1 === null) {
        mountElement(n2, container, anchor);
      } else {
        patchElement(n1, n2);
      }
    };
    const processFragment = (n1, n2, container) => {
      if (n1 === null || n1 === void 0) {
        if (!isArray(n2.children)) {
          console.log("\u4E0D\u662F\u6570\u7EC4,\u76F4\u63A5\u9000\u51FA\u6302\u8F7D");
          return;
        }
        mountChildren(n2.children, container);
      } else {
        patchChildren(n1, n2, container);
      }
    };
    const patch = (n1, n2, container, anchor = null) => {
      if (n1 === n2) {
        return;
      }
      if (n1 && !isSameVnode(n1, n2)) {
        unmount(n1);
        n1 = null;
      }
      const { type, shapeFlag } = n2;
      switch (type) {
        case Text:
          processText(n1, n2, container);
          break;
        case Fragment:
          processFragment(n1, n2, container);
          break;
        default:
          if (shapeFlag & 1 /* ELEMENT */) {
            processElement(n1, n2, container, anchor);
          }
          break;
      }
    };
    const unmount = (vnode) => {
      hostRemove(vnode.el);
    };
    const render2 = (vnode, container) => {
      if (vnode === null || vnode === void 0) {
        if (container._vnode) {
          unmount(container._vnode);
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

  // packages/runtime-dom/src/nodeOps.ts
  var nodeOps = {
    insert(child, parent, anchor = null) {
      parent.insertBefore(child, anchor);
    },
    remove(child) {
      const parentNode = child.parentNode;
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
