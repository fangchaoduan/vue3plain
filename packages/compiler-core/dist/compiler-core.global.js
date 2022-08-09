var VueCompilerCore = (() => {
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
    return {
      type: 2 /* TEXT */,
      content,
      loc: getSelection(context, start)
    };
  }
  function parse(template) {
    const context = createParserContext(template);
    const nodes = [];
    for (; !isEnd(context); ) {
      const source = context.source;
      let node;
      if (source.startsWith("{{")) {
        node = "xxx";
      } else if (source[0] === "<") {
        node = "qqq";
      }
      if (!node) {
        node = parseText(context);
      }
      nodes.push(node);
      console.log(nodes);
      break;
    }
    return;
  }
  function compile(template) {
    const ast = parse(template);
    console.log("ast--->", ast);
    return ast;
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=compiler-core.global.js.map
