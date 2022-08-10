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
    return parseChildren(context);
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
    return nodes;
  }
  function compile(template) {
    const ast = parse(template);
    return ast;
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=compiler-core.global.js.map
