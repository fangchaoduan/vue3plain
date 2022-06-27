//minimist是用来解析命令行参数的;
const args = require("minimist")(process.argv.slice(2)); //node scripts/dev.js -f global;
//console.log("process.argv--->", process.argv);//['C:\\Program Files\\nodejs\\node.exe','C:\\Users\\fangc\\Desktop\\vue3plain\\script\\dev.js','reactivity','-f','global']
//console.log("args--->", args);//{ _: [ 'reactivity' ], f: 'global' }

const { resolve } = require("path");

const { build } = require("esbuild");

const target = args._[0] || reactivity;
const format = args.f || "global";
//开发环境只打包某一个;
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`));
//console.log("pkg--->", pkg);
//iife 立即执行函数 (function(){})();
//cjs 为node中的模块 module.exports;
//esm 为浏览器中的esModule模块 import;
const outputFormat = format.startsWith("global")
  ? "iife"
  : format === "cjs"
  ? "cjs"
  : "esm";

const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`
);


//天生就支持ts;
build({
  entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)], //打包的目录文件;
  outfile: outfile, //输出的文件;
  bundle: true, //把所有的包全部打包到一起;
  sourcemap: true, //打包以后需要有sourcemap;
  format: outputFormat, //输出的格式;
  globalName: pkg.buildOptions?.name, //打包的全局的名字;
  platform: format === "cjs" ? "node" : "browser", //平台为node还是浏览器;
  watch: {
    //监控文件变化--文件一变化,就重新打印,说明已经重新构建好了;
    onRebuild(error) {
      if (!error) {
        console.log(`rebuilt~~~`);
      }
    },
  },
}).then(() => {
  console.log(`watching~~~`);
});
