var VueCompilerCore = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
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

  // packages/compiler-core/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    compile: () => compile
  });

  // packages/compiler-core/src/runtimeHelpers.ts
  var TO_DISPLAY_STRING = Symbol(`toDisplayString`);
  var CREATE_TEXT = Symbol("createTextVNode");
  var CREATE_ELEMENT_VNODE = Symbol("createElementVnode");
  var OPEN_BLOCK = Symbol("openBlock");
  var CREATE_ELEMENT_BLOCK = Symbol("createElementBlock");
  var FRAGMENT = Symbol("fragment");
  var helperMap = {
    [TO_DISPLAY_STRING]: `toDisplayString`,
    [CREATE_TEXT]: "createTextVNode",
    [CREATE_ELEMENT_VNODE]: "createElementVnode",
    [OPEN_BLOCK]: "openBlock",
    [CREATE_ELEMENT_BLOCK]: "createElementBlock",
    [FRAGMENT]: "fragment"
  };

  // packages/compiler-core/src/ast.ts
  function createCallExpression(context, args) {
    const callee = context.helper(CREATE_TEXT);
    return {
      callee,
      type: 14 /* JS_CALL_EXPRESSION */,
      arguments: args
    };
  }
  function createObjectExpression(properties) {
    return {
      type: 15 /* JS_OBJECT_EXPRESSION */,
      properties
    };
  }
  function createVnodeCall(context, vnodeTag, propsExpressio, childrenNode) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
      type: 13 /* VNODE_CALL */,
      tag: vnodeTag,
      props: propsExpressio,
      children: childrenNode
    };
  }

  // packages/compiler-core/src/generate.ts
  function createCodegenContext(ast) {
    const context = {
      code: "",
      helper(name) {
        return `${helperMap[name]}`;
      },
      push(code) {
        context.code = context.code + code;
      },
      indentLevel: 0,
      indent() {
        ++context.indentLevel;
        context.newline();
      },
      deindent(whithoutNewLine = false) {
        if (whithoutNewLine) {
          --context.indentLevel;
        } else {
          --context.indentLevel;
          context.newline();
        }
      },
      newline() {
        newline(context.indentLevel);
      }
    };
    function newline(n) {
      context.push("\n" + "  ".repeat(n));
    }
    return context;
  }
  function genFunctionPreable(ast, context) {
    if (ast.helpers.length > 0) {
      context.push(`import { ${ast.helpers.map((h) => `${context.helper(h)} as _${context.helper(h)}`).join(",")} } from "vue" `);
      context.newline();
    }
    context.push(`export `);
  }
  function genText(node, context) {
    context.push(JSON.stringify(node.content));
  }
  function genInterpolation(node, context) {
    context.push(`${helperMap[TO_DISPLAY_STRING]}(`);
    genNode(node.content, context);
    context.push(`)`);
  }
  function genExpression(node, context) {
    context.push(node.content);
  }
  function genNode(node, context) {
    switch (node.type) {
      case 2 /* TEXT */:
        genText(node, context);
        break;
      case 5 /* INTERPOLATION */:
        genInterpolation(node, context);
        break;
      case 4 /* SIMPLE_EXPRESSION */:
        genExpression(node, context);
        break;
    }
  }
  function generate(ast) {
    const context = createCodegenContext(ast);
    const { push, indent, deindent } = context;
    genFunctionPreable(ast, context);
    const functionName = "render";
    const args = ["_ctx", "_cache", "$props"];
    push(`function ${functionName}(${args.join(",")}){`);
    indent();
    push(`return `);
    if (ast.codegenNode) {
      genNode(ast.codegenNode, context);
    } else {
      push(`null`);
    }
    deindent();
    push("}");
    console.log(context.code);
  }

  // packages/compiler-core/src/parse.ts
  function createParserContext(template) {
    const theContext = {
      line: 1,
      column: 1,
      offset: 0,
      source: template,
      originalSource: template
    };
    return theContext;
  }
  function isEnd(context) {
    const source = context.source;
    if (context.source.startsWith(`</`)) {
      return true;
    }
    return !source;
  }
  function getCursor(context) {
    const { line, column, offset } = context;
    return { line, column, offset };
  }
  function advancePositionWithMutation(context, source, endIndex) {
    let linesCount = 0;
    let linePos = -1;
    for (let i = 0; i < endIndex; i++) {
      if (source.charCodeAt(i) === 10) {
        linesCount++;
        linePos = i;
      }
    }
    context.line = context.line + linesCount;
    context.offset = context.offset + endIndex;
    context.column = linePos === -1 ? context.column + endIndex : endIndex - linePos;
  }
  function advanceBy(context, endIndex) {
    const source = context.source;
    advancePositionWithMutation(context, source, endIndex);
    context.source = source.slice(endIndex);
  }
  function parseTextData(context, endIndex) {
    const rawText = context.source.slice(0, endIndex);
    advanceBy(context, endIndex);
    return rawText;
  }
  function getSelection(context, start, end) {
    end = end || getCursor(context);
    const theReturn = {
      start,
      end,
      source: context.originalSource.slice(start.offset, end.offset)
    };
    return theReturn;
  }
  function parseText(context) {
    const endTokens = [`<`, `{{`];
    let endIndex = context.source.length;
    for (let i = 0; i < endTokens.length; i++) {
      const index = context.source.indexOf(endTokens[i], 1);
      if (index !== -1 && endIndex > index) {
        endIndex = index;
      }
    }
    const start = getCursor(context);
    const content = parseTextData(context, endIndex);
    const theParseNode = {
      type: 2 /* TEXT */,
      content,
      loc: getSelection(context, start)
    };
    return theParseNode;
  }
  function parseInterpolation(context) {
    const start = getCursor(context);
    const closeIndex = context.source.indexOf("}}", 2);
    advanceBy(context, 2);
    const innerStart = getCursor(context);
    const innerEnd = getCursor(context);
    const rawContentLength = closeIndex - 2;
    const preContent = parseTextData(context, rawContentLength);
    const content = preContent.trim();
    const startOffset = preContent.indexOf(content);
    if (startOffset > 0) {
      advancePositionWithMutation(innerStart, preContent, startOffset);
    }
    const endOffset = startOffset + content.length;
    advancePositionWithMutation(innerEnd, preContent, endOffset);
    advanceBy(context, 2);
    const theParseNode = {
      type: 5 /* INTERPOLATION */,
      content: {
        type: 4 /* SIMPLE_EXPRESSION */,
        content,
        loc: getSelection(context, innerStart, innerEnd)
      },
      loc: getSelection(context, start)
    };
    return theParseNode;
  }
  function advanceBySpaces(context) {
    const theRegExp = /^[ \t\r\n]+/;
    const match = theRegExp.exec(context.source);
    if (match) {
      advanceBy(context, match[0].length);
    }
  }
  function parseAttributeValue(context) {
    const start = getCursor(context);
    const quote = context.source[0];
    let content;
    if (quote === `"` || quote === `'`) {
      advanceBy(context, 1);
      const endIndex = context.source.indexOf(quote);
      content = parseTextData(context, endIndex);
      advanceBy(context, 1);
    }
    return {
      content,
      loc: getSelection(context, start)
    };
  }
  function parseAttribute(context) {
    const start = getCursor(context);
    const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
    const name = match[0];
    advanceBy(context, name.length);
    advanceBySpaces(context);
    advanceBy(context, 1);
    const value = parseAttributeValue(context);
    const theReturn = {
      type: 6 /* ATTRIBUTE */,
      name,
      value: __spreadValues({
        type: 2 /* TEXT */
      }, value),
      loc: getSelection(context, start)
    };
    return theReturn;
  }
  function parseAttributes(context) {
    const props = [];
    while (context.source.length > 0 && !context.source.startsWith(`>`) && !context.source.startsWith(`/>`)) {
      const prop = parseAttribute(context);
      props.push(prop);
      advanceBySpaces(context);
    }
    return props;
  }
  function parseTag(context) {
    const start = getCursor(context);
    const theRegExp = /^[<][/]{0,1}([a-z][^ \t\r\n/>]*)/;
    const match = theRegExp.exec(context.source);
    const tag = match[1];
    advanceBy(context, match[0].length);
    advanceBySpaces(context);
    const props = parseAttributes(context);
    const isSelfClosing = context.source.startsWith(`/>`);
    advanceBy(context, isSelfClosing ? 2 : 1);
    const theReturn = {
      type: 1 /* ELEMENT */,
      tag,
      isSelfClosing,
      children: [],
      props,
      loc: getSelection(context, start)
    };
    return theReturn;
  }
  function parseElement(context) {
    const ele = parseTag(context);
    const children = parseChildren(context);
    if (context.source.startsWith(`</`)) {
      parseTag(context);
    }
    ele.loc = getSelection(context, ele.loc.start);
    ele.children = children;
    const theParseNode = ele;
    return theParseNode;
  }
  function parse(template) {
    const context = createParserContext(template);
    const start = getCursor(context);
    const children = parseChildren(context);
    const theLoc = getSelection(context, start);
    const node = createRoot(children, theLoc);
    return node;
  }
  function createRoot(children, loc) {
    const theParseNode = {
      type: 0 /* ROOT */,
      children,
      loc
    };
    return theParseNode;
  }
  function parseChildren(context) {
    const nodes = [];
    while (!isEnd(context)) {
      const source = context.source;
      let node;
      if (source.startsWith("{{")) {
        node = parseInterpolation(context);
      } else if (source[0] === "<") {
        node = parseElement(context);
      }
      if (!node) {
        node = parseText(context);
      }
      nodes.push(node);
    }
    nodes.forEach((item, index) => {
      if (item.type === 2 /* TEXT */) {
        const theRegExp = /^[\t\r\n\f ]{1,}$/;
        if (theRegExp.test(item.content)) {
          nodes[index] = null;
        }
      }
    });
    const theReturn = nodes.filter(Boolean);
    return theReturn;
  }

  // packages/compiler-core/src/transforms/transformElement.ts
  function transformElement(node, context) {
    if (node.type === 1 /* ELEMENT */) {
      return () => {
        const vnodeTag = `"${node.tag}"`;
        const properties = [];
        const props = node.props;
        for (let i = 0; i < props.length; i++) {
          const theProperty = {
            key: props[i].name,
            value: props[i].value.content
          };
          properties.push(theProperty);
        }
        const propsExpression = properties.length > 0 ? createObjectExpression(properties) : null;
        if (node.children.length === 1) {
          const child = node.children[0];
        }
        let childrenNode = null;
        if (node.children.length === 1) {
          childrenNode = node.children[0];
        } else if (node.children.length > 1) {
          childrenNode = node.children;
        }
        node.codegenNode = createVnodeCall(context, vnodeTag, propsExpression, childrenNode);
      };
    }
  }

  // packages/compiler-core/src/transforms/transformExpression.ts
  function transformExpression(node, context) {
    if (node.type === 5 /* INTERPOLATION */) {
      const content = node.content.content;
      node.content.content = `_ctx.${content}`;
    }
  }

  // packages/shared/src/index.ts
  var isArray = Array.isArray;

  // packages/compiler-core/src/transforms/transformText.ts
  function isText(node) {
    return (node == null ? void 0 : node.type) === 5 /* INTERPOLATION */ || (node == null ? void 0 : node.type) === 2 /* TEXT */;
  }
  function transformText(node, context) {
    if (node.type === 1 /* ELEMENT */ || node.type === 0 /* ROOT */) {
      return () => {
        let currentContainer = null;
        const children = node.children;
        let hasText = false;
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          if (isText(child)) {
            hasText = true;
            for (let j = i + 1; j < children.length; j++) {
              const next = children[j];
              if (isText(next)) {
                if (!currentContainer) {
                  currentContainer = children[i] = {
                    type: 8 /* COMPOUND_EXPRESSION */,
                    children: [child]
                  };
                }
                currentContainer.children.push(`+`, next);
                children.splice(j, 1);
                j--;
              } else {
                currentContainer = null;
                break;
              }
            }
          }
        }
        if (!hasText || children.length === 1) {
          return;
        }
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const callArgs = [];
          if (isText(child) || child.type === 8 /* COMPOUND_EXPRESSION */) {
            callArgs.push(child);
            if (node.type !== 2 /* TEXT */) {
              callArgs.push(1 /* TEXT */);
            }
            children[i] = {
              type: 12 /* TEXT_CALL */,
              content: child,
              codegenNode: createCallExpression(context, callArgs)
            };
          }
        }
      };
    }
  }

  // packages/compiler-core/src/transform.ts
  function createTransformContext(root) {
    const context = {
      currentnode: root,
      parent: null,
      helpers: /* @__PURE__ */ new Map(),
      helper(name) {
        const count = context.helpers.get(name) || 0;
        context.helpers.set(name, count + 1);
        return name;
      },
      removeHelper(name) {
        const count = context.helpers.get(name);
        if (count) {
          const currentCount = count - 1;
          if (!currentCount) {
            context.helpers.delete(name);
          } else {
            context.helpers.set(name, currentCount);
          }
        }
      },
      nodeTransforms: [
        transformElement,
        transformText,
        transformExpression
      ]
    };
    return context;
  }
  function traverse(node, context) {
    context.currentnode = node;
    const transforms = context.nodeTransforms;
    const exitsFns = [];
    for (let i2 = 0; i2 < transforms.length; i2++) {
      const onExit = transforms[i2](node, context);
      if (onExit) {
        exitsFns.push(onExit);
      }
      if (!context.currentnode) {
        return;
      }
    }
    switch (node.type) {
      case 5 /* INTERPOLATION */:
        context.helper(TO_DISPLAY_STRING);
        break;
      case 1 /* ELEMENT */:
      case 0 /* ROOT */:
        for (let i2 = 0; i2 < node.children.length; i2++) {
          context.parent = node;
          traverse(node.children[i2], context);
        }
    }
    context.currentnode = node;
    let i = exitsFns.length;
    while (i--) {
      exitsFns[i]();
    }
  }
  function createRootCodegen(ast, context) {
    const { children } = ast;
    if (children.length === 1) {
      const child = children[0];
      if (child.type === 1 /* ELEMENT */ && child.codegenNode) {
        ast.codegenNode = child.codegenNode;
        context.removeHelper(CREATE_ELEMENT_VNODE);
        context.helper(OPEN_BLOCK);
        context.helper(CREATE_ELEMENT_BLOCK);
        ;
        ast.codegenNode.isBlock = true;
      } else {
        ast.codegenNode = child;
      }
    } else {
      if (children.length === 0) {
        return;
      }
      ast.codegenNode = createVnodeCall(context, context.helper(FRAGMENT), null, children);
      context.helper(OPEN_BLOCK);
      context.helper(CREATE_ELEMENT_BLOCK);
      ast.codegenNode.isBlock = true;
    }
  }
  function transform(ast) {
    const context = createTransformContext(ast);
    traverse(ast, context);
    createRootCodegen(ast, context);
    ast.helpers = [...context.helpers.keys()];
  }

  // packages/compiler-core/src/index.ts
  function compile(template) {
    const ast = parse(template);
    transform(ast);
    return generate(ast);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=compiler-core.global.js.map
