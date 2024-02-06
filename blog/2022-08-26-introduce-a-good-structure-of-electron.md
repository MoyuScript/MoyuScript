---
authors: MoyuScript
tags: 
  - 技术
  - 计算机科学
  - 前端
  - Electron
---

# Electron 工程一个比较好的架构介绍

[Electron](https://www.electronjs.org/) 是一个跨平台桌面应用程序构建工具，你可以使用前端技术和 [NodeJS](https://nodejs.org/en/) 来构建桌面应用程序（MacOS、Windows、Linux），我们熟悉的 [VSCode](https://code.visualstudio.com/) 就是使用它来构建的。

我在前段时间写了个[跨平台哔哩哔哩视频下载工具](https://github.com/MoyuScript/double-mouse-downloader)，发现网上关于 Electron 的相关信息还是挺少的，因此我在这给大家分享一些我开发这个工具的一些经验。

当然，一篇文章肯定讲不完所有细节，所以这里只是简单介绍一下，以后有机会可能还会详细介绍各个细节。

一些 Electron 基本的概念在本文不再赘述，如果你还不清楚的话，可以到 [Electron 官网](https://www.electronjs.org/)进行学习

<!--truncate-->

## 项目架构

整体使用了 [Typescript](https://www.typescriptlang.org/)。

### 总架构

这里只列一下关键目录和文件：

```text
app/
├─ assets/   -- 项目资源，比如给 README 引用的图片，还有 LOGO 设计源文件等
├─ bin/      -- 可执行文件，文件夹名为 {平台名}/{架构}，比如有一个 64 位 exe 的文件应该放在 bin/win32/x64/xxx.exe
├─ build-resources/   -- 构建资源，比如程序图标
├─ docs/     -- 文档，也可以是 GitHub Pages 主页
├─ src/      -- 源文件
│  ├─ common/  -- 通用，主进程和渲染进程都会用到的东西
│  ├─ main/    -- 主进程
│  │  ├─ services/   -- 服务
│  │  ├─ bridge.ts   -- RPC 注册
│  │  ├─ main.ts     -- 程序入口
│  │  ├─ preload.ts  -- Preload
│  ├─ renderer/    -- 渲染进程
│  │  ├─ components/  -- 通用组件
│  │  ├─ public/  -- 静态资源文件
│  │  ├─ redux/   -- 状态管理 Redux
│  │  ├─ windows/  -- 窗口
│  │  │  ├─ main/  -- 主窗口
│  │  │  │  ├─ components/  -- 只会在主窗口用到的组件
│  │  │  ├─ other/  -- 其他窗口
│  │  ├─ env.d.ts  -- 环境变量类型声明
│  │  ├─ global.d.ts  -- 全局类型声明（比如定义 window.jsBridge）
│  │  ├─ vite.config.js  -- Vite 配置
│  ├─ types/  -- 公共类型
```



### 页面（渲染进程）

**构建工具：**[Vite](https://cn.vitejs.dev/)。不得不说 Vite 确实很好用，极大提高了开发效率。

**框架：**[React](https://reactjs.org/)。其实用 [Vue](https://v3.cn.vuejs.org/) 也是一个很好的选择，不过我更熟悉 React 就用了，只是个人习惯问题。

**组件库：**[Ant Design](https://ant.design/)。部分页面使用 antd 开发会非常节约时间，如果有什么特殊的样式要求，也可以只使用其中部分功能。

**Hook 库：**[ahooks](https://ahooks.js.org/zh-CN/)。封装了一些常用的 React Hook，非常好用。

**状态管理：**[Redux](https://redux.js.org/)。使用了官方的 [@reduxjs/toolkit](https://redux-toolkit.js.org/) 和 [react-redux](https://react-redux.js.org/)。

**目录结构：**参考了业界的一些比较好的实践（如[目录结构 (umijs.org)](https://v3.umijs.org/zh-CN/docs/directory-structure)），结合了自身习惯和具体需求，但是后面发现结构其实还不太完美，后面学习中发现了一个更好的实践：[bulletproof-react](https://github.com/alan2207/bulletproof-react)。

**风格规范：**[ESLint](https://eslint.org/)、[Husky](https://typicode.github.io/husky/)、[Prettier](https://prettier.io/)、[Editorconfig](https://editorconfig.org/) 等。

### 主进程

**构建：**其实只是 tsc 了一下。

**RPC：**主要是将服务分离出来，然后在 preload 脚本里面进行注册。

## RPC

RPC 服务使用到了 [IPC 通信](https://www.electronjs.org/zh/docs/latest/tutorial/ipc)，但是 Electron 接口只是给了最基本的通信实现，还需要自己设计一个良好的架构，否则随着项目越大，维护起来就会越困难。

我采用了定义和注册服务的方式，可以简单举个例。

**定义一个服务：**

```js
// ./services/example-service
const exampleService = {
  name: 'example',
  fns: {
    async hello() {
      return 'hello';
    }
  }
};

export default exampleService;
```

**导出所有服务：**

```js
// ./services.js
import exampleService from './services/example-service';

export const services = [
  exampleService,
];

export function makeChannelName(name, fnName) {
  return `${name}.${fnName}`;
}
```

**主进程注册服务：**

```js
// ./main.js
import { services, makeChannelName } from './services.js';

services.forEach((service) => {
  Object.entries(service.fns).forEach(([apiName, apiFn]) => {
    ipcMain.handle(makeChannelName(service.name, apiName), (ev, ...args) =>
      apiFn(...args)
    );
  });
});
```

**preload 脚本：**

```js
// ./preload.js
import { services, makeChannelName } from './services.js';

function createJsBridge(): any {
  const bridge = {};

  services.forEach((service) => {
    bridge[service.name] = {};

    Object.keys(service.fns).forEach((fnName) => {
      bridge[service.name][fnName] = (...args) =>
        ipcRenderer.invoke(makeChannelName(service.name, fnName), ...args);
    });
  });
  return bridge;
}

contextBridge.exposeInMainWorld('jsBridge', createJsBridge());
```

**调用：**

```js
// Html 页面
await window.jsBridge.example.hello(); // 返回 hello
```

这样，我们如果需要新增服务或者修改服务，它就会被自动注入到渲染进程中，维护起来非常方便。

## 调试

调试可以分为两种，一种是主进程调试，另外一种是页面调试。

### 主进程调试

主进程调试可以参考：[使用 VsCode调试 | Electron (electronjs.org)](https://www.electronjs.org/zh/docs/latest/tutorial/debugging-vscode)。

此外，如果需要代码修改后就自动重启，需要用到 [nodemon](https://nodemon.io/) 来监控文件变更，检测到变更就重启应用。

如果你的项目用到了 TS，需要将 TS 编译后才能进行调试，记得打开 [sourceMap](https://www.typescriptlang.org/tsconfig/#sourceMap) 开关，这样你就可以直接在 TS 文件中打断点了。

### 页面调试

页面调试和普通的浏览器页面调试基本是一样的。

首先需要启动调试服务器，我这里用的是 Vite，因此很容易就可以启动开发服务器，然后记下服务器链接。

然后我们需要窗口加载的是上面获取到的 URL 而不是文件，因此我们可以判断当前环境来确定是加载文件还是 URL，代码如下：

```js
if (process.env.NODE_ENV === 'development') {
    await installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS]);
    mainWindow.once('show', () => mainWindow.webContents.openDevTools());
    // 开发环境加载开发服务器 URL
    await mainWindow.loadURL('http://localhost:3000/');
  } else {
    await mainWindow.loadFile('./build/renderer/index.html';
  }
```

这样就可以开始愉快地调试了。

## 构建

构建我使用的是 [electron-builder](https://www.electron.build/)，相关配置可以参考官方文档。

需要注意的是，在构建前需要进行一些操作，比如打包页面代码、主进程 TS 代码编译为普通 JS 代码。

我的 package.json 部分配置如下：

```json
"scripts": {
  "clear": "rimraf ./build",
  "build:main": "tsc -p ./src/main/tsconfig.json",
  "build:renderer": "vite build -c ./src/renderer/vite.config.js",
  "build": "npm-run-all clear build:main build:renderer",
  "dist": "npm run build && electron-builder"
}
```

这样就可以使用 npm run dist 一键自动打包并构建应用了。

构建我目前是手动在 Win 和 Mac 上构建的，如果你有构建服务器的话也可以配置自动化流程，或者用 [GitHub Actions](https://github.com/features/actions) 也可以（可能会比较慢）。

主要是我需要手动测试一下两端的功能是否正常，就选择手动构建了。