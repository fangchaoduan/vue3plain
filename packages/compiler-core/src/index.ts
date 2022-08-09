//主要是把template中的代码编译成render()函数-render()函数中VNode的是用模版来写的,而不是h()函数生成的;

import { NodeTypes } from "./ast";

type TemplateContext = {
  line: number;//第几行;
  column: number;//第几列;
  offset: number;//偏移量;
  source: string;//当前要被解析模版,此字段会被不停地进行解析,会slice()一直被截短;
  originalSource: string;//原模版,此字段是原模版,不会被解析;
}
function createParserContext(template: string): TemplateContext {
  const theContext: TemplateContext = {
    line: 1,
    column: 1,
    offset: 0,
    source: template,
    originalSource: template,
  };
  return theContext
}


function isEnd(context: TemplateContext) {
  const source = context.source
  return !source;
}

//行列游标信息,用来报错之类的用到;
type CursorObject = {
  line: number;
  column: number;
  offset: number;
}
//得到当前上下文的游标信息,用于报错提示之类的;
function getCursor(context: TemplateContext): CursorObject {
  const { line, column, offset } = context
  return { line, column, offset }
}

//更新最新的行列和偏移量信息;
function advancePositionWithMutation(context: TemplateContext, source: string, endIndex: number) {
  let linesCount = 0;
  let linePos = -1;
  for (let i = 0; i < endIndex; i++) {
    if (source.charCodeAt(i) === 10) {
      //console.log('i--->', i)
      linesCount++

      linePos = i;
    }
  }
  context.line = context.line + linesCount

  //偏移量,删掉多少加多少;
  context.offset = context.offset + endIndex

  //等于-1,说明没有换行过;而这些文本前,可能就是个标签,所以要加之前的;
  //如果换行过,那么linePos必定是上一行中换行符的角标;
  context.column = linePos === -1 ? context.column + endIndex : endIndex - linePos
  //console.log('linePos--->', linePos)
  // debugger
}

//把当前上下文的当前模版在结束角标前的文本截去;
function advanceBy(context: TemplateContext, endIndex: number) {
  //每次删掉内容的时候,都要更新最新的行列和偏移量信息;
  const source = context.source
  advancePositionWithMutation(context, source, endIndex)
  context.source = source.slice(endIndex)
}

//截取当前上下文的文本内容;
function parseTextData(context: TemplateContext, endIndex: number) {
  const rawText = context.source.slice(0, endIndex)
  advanceBy(context, endIndex)
  // debugger
  return rawText
}

type SelectionObject = {
  start: CursorObject;
  end: CursorObject;
  source: string;
}
function getSelection(context: TemplateContext, start: CursorObject, end?: CursorObject) {
  end = end || getCursor(context)
  //console.log(start.offset, end.offset)
  const theReturn: SelectionObject = {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset)
  }
  return theReturn
}
function parseText(context: TemplateContext): any {
  //在解析文本的;
  const endTokens = [`<`, `{{`]//结束标识列表;
  //asafs{{d<jfhlaksdjhalkjfhd;sjfh;
  let endIndex = context.source.length//默认为到最后结束;
  for (let i = 0; i < endTokens.length; i++) {
    //看结束标识第一次出现的地方;
    //因为进入parseText的第一个角标0,必定不是结束标识;
    const index = context.source.indexOf(endTokens[i], 1)
    //找到了,并且第一次比整个字符串小;
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }

  //创建 行列信息;
  const start = getCursor(context)//开始;

  //取内容;
  const content = parseTextData(context, endIndex)
  //debugger
  return {
    type: NodeTypes.TEXT,//类型;
    content: content,//内容;
    loc: getSelection(context, start),//位置信息;
  }

  //再获取结束的位置;

  //debugger
}


//将html语法转换成js语法;
function parse(template: string) {
  //创建一个解析的上下文来进行处理;
  const context = createParserContext(template)
  //debugger

  //< 元素;
  //{{}} 说明表达式;
  //其它就是文本;
  //目前不考虑其它;
  const nodes = []

  for (; !isEnd(context);) {
    const source = context.source
    let node
    if (source.startsWith('{{')) {
      //说明表达式;
      node = 'xxx'
    } else if (source[0] === '<') {
      //元素-标签;
      node = 'qqq'
    }
    //文本;
    //暂时不考虑其它,如注释之类的;
    if (!node) {
      node = parseText(context)
      //break
    }
    nodes.push(node)
    console.log(nodes)
    break
  }
  //console.log(nodes)

  return
}

export function compile(template: string) {
  //将模板转成抽象语法树;
  const ast = parse(template);//这里需要将html语法转换成js语法;--编译原理;

  console.log('ast--->', ast)
  return ast
  //对ast语法树进行一些预先处理;
  // transform(ast);//会生成一些信息;

  //代码生成;
  // return generate(ast);//最终生成代码;和vue2的过程一样;
}


