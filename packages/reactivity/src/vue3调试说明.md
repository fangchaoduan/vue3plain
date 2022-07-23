# vue3 源码调试说明

## 步骤

1. 下载`vue3源码`
   1. [个人目录](https://github.com/fangchaoduan/core/tree/main);
   2. [官方目录](https://github.com/vuejs/core);
2. 锁定一个版本来比对,个人使用`3.2.31`;

   ```cmd
   git reset --hard d56dec6b4a26eb9aa4063fc38659898626bb8181
   git checkout -b dev-fang
   ```

3. 在`/package.json`可以看到:
   `version`中看到`版本号`;
   `scripts`中可以看到脚本,一般看`dev`脚本的运行;
4. `/pnpm-workspace.yaml`可以看到是在`pnpm`的配置;
5. `/tsconfig.json`看到`TypeScript`的配置;
6. `/packages/`目录放置`vue`中用到的包;
7. 新建一个`/examples/`目录,在该目录下新建文件如`/examples/reactive.html`进行调试;
8. `/scripts`中放置一些打包脚本;
9. `/.eslintrc.js`是一些规范检测配置;
10. `/.prettierrc`是一些`prettier`配置;
11. 在`/package.json`中多加一行脚本,用于自己的测试;

    ```json
    {
      "scripts": {
        //表示只打包`reactivity`这个模块,而不是全部;
        //表示用`node.js`打开并运行`scripts/dev.js`,并传入值为`reactivity`的第一个参数;
        "fangtextdev": "node scripts/dev.js reactivity"
      }
    }
    ```

    运行`npm run fangtextdev`就是执行`node scripts/dev.js reactivity`这个脚本;

12. 看到`/scripts/dev.js`,里面主要就是前期拿到用到`esbuild配置对象`的变量参数;
    其实后面都是转向到`/packages/`目录;
    而`/packages/包名/package.json`则是打包的又一个`package.json配置`;
    而`/packages/包名/src/index.ts`则是当前模块中输出的`方法`或`TypeScript类型`,在这里可以看到;
13. 在根目录执行`pnpm install`安装依赖;
14. 安装好依赖之后,执行自定义命令`npm run fangtextdev`,就是执行`node scripts/dev.js reactivity`这个脚本;
    一般会看到新增了一个`/packages/reactivity/dist/reactivity.global.js`文件;
15. 在`/examples/`目录,在该目录下新建文件如`/examples/1.reactive.html`进行调试;
    其中`/examples/1.reactive.html`要引入已经打包好的文件;
    可用如`<script src="../packages/reactivity/dist/reactivity.global.js"></script>`引入打包好的文件,并运行这些命令;
    在`/examples/1.reactive.html`使用`debugger`打断点;
    借助:
    `F8键`或`Ctrl键 + \键` 跳到下个断点;
    `F10键`或`Ctrl键 + '键` 跳过当前函数到下一步;
    `F11键`或`Ctrl键 + ;键` 进入当前函数并到下一步;
    `Shift键 + F11键`或`Ctrl键 + Shift键 + ;键` 跳出当前函数并到下一步;
    `F9键` 进行单步调试;
    `Ctrl键 + F8键` 在当前行`停用断点`或`启用断点`;
16. 可以在源码上写一些注释,在`/examples/1.reactive.html`上使用时,浏览器会`debugger`到源码上;
17. 如果有些地方不懂,可以在`/packages/包名/__tests__/具体要测试功能名.spec.ts`里找到单元测试,如`/packages/reactivity/__tests__/reactive.spec.ts`里找代码,并仿单元测试的代码去写案例;
    如:

    ```ts
    import { reactive, isReactive, toRaw, markRaw } from "../src/reactive";
    test("proto", () => {
      const obj = {};
      const reactiveObj = reactive(obj);
      expect(isReactive(reactiveObj)).toBe(true);
      // read prop of reactiveObject will cause reactiveObj[prop] to be reactive
      // @ts-ignore
      const prototype = reactiveObj["__proto__"];
      const otherObj = { data: ["a"] };
      expect(isReactive(otherObj)).toBe(false);
      const reactiveOther = reactive(otherObj);
      expect(isReactive(reactiveOther)).toBe(true);
      expect(reactiveOther.data[0]).toBe("a");
    });
    ```

    改成:(把测试写成ts,使用一些输出)

    ```ts
    import { reactive, isReactive, toRaw, markRaw } from "../src/reactive";
    const obj = {};
    const reactiveObj = reactive(obj);
    console.log(
      "isReactive(reactiveObj)===true--->",
      isReactive(reactiveObj) === true
    );
    //expect(isReactive(reactiveObj)).toBe(true);
    const prototype = reactiveObj["__proto__"];
    const otherObj = { data: ["a"] };
    console.log(
      "isReactive(otherObj)===false--->",
      isReactive(otherObj) === false
    );
    //expect(isReactive(otherObj)).toBe(false);
    const reactiveOther = reactive(otherObj);
    console.log(
      "isReactive(reactiveOther)===true--->",
      isReactive(reactiveOther) === true
    );
    //expect(isReactive(reactiveOther)).toBe(true);
    console.log(
      'reactiveOther.data[0]==="a"--->',
      reactiveOther.data[0] === "a"
    );
    //expect(reactiveOther.data[0]).toBe("a");
    ```

    又改成:(改依赖路径);

    ```html
    <!DOCTYPE html>
    <html lang="en">
      <script src="../packages/reactivity/dist/reactivity.global.js"></script>
      <script>
        import { reactive, isReactive, toRaw, markRaw } from  = VueReactivity;
        const obj = {};
        const reactiveObj = reactive(obj);
        console.log('isReactive(reactiveObj)===true--->',isReactive(reactiveObj)===true)
        const prototype = reactiveObj["__proto__"];
        const otherObj = { data: ["a"] };
        console.log('isReactive(otherObj)===false--->',isReactive(otherObj)===false)
        const reactiveOther = reactive(otherObj);
        console.log('isReactive(reactiveOther)===true--->',isReactive(reactiveOther)===true)
        console.log('reactiveOther.data[0]==="a"--->',reactiveOther.data[0]==="a")
      </script>
    </html>
    ```
