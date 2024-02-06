---
authors: MoyuScript
tags: 
  - 技术
  - 计算机科学
  - 前端
  - React
---

# 前端 React 不用第三方全局状态管理库，只用 Context API 的一种比较好的全局状态管理架构

前端 [React](https://reactjs.org/) 常见的状态管理库主要有大家耳熟能详的 [Redux](https://redux.js.org/)，还有 Meta（原 Facebook）新秀 [Recoil](https://recoiljs.org/)。

但是有的时候，由于各种原因（团队不让、项目比较简单不想用、引入新包体积变大等），当我们不能使用任何第三方全局状态管理库时，仍然需要进行全局状态管理，这时候我们就可以考虑一下使用自带的 [Context API](https://reactjs.org/docs/context.html) 进行简单的全局状态管理。

这篇文章我主要是想给大家分享一下我在日常开发中使用的一种自认为比较优雅的 Context 架构，实现起来比较简单，但是个人认为非常实用。本文主要是使用 [Hooks](https://reactjs.org/docs/hooks-intro.html) 写法来实现 Context 架构。

<!--truncate-->

代码可以在这里看到：

[React Context 架构 - CodeSandboxcodesandbox.io/s/react-context-jia-gou-qkcjdu](https://codesandbox.io/s/react-context-jia-gou-qkcjdu)

## 基本架构

我们预期的使用方式为在任何子组件内使用一个 hook 函数（如 useAppContext），就可以拿到所有的全局状态。

首先我们新建一个文件 context.jsx，在里面编写如下代码：

```jsx
// ./context.jsx
import React from "react";

const context = React.createContext({});

export function ContextProvider({ children }) {
  const [count, setCount] = React.useState(0);
  const values = {
    count,
    setCount
  };
  return <context.Provider value={values}>{children}</context.Provider>;
}

export function useAppContext() {
  return React.useContext(context);
}
```



然后，我们在应用根组件使用 ContextProvider 来包裹子组件：

```jsx
// ./index.jsx
import { createRoot } from "react-dom/client";

import App from "./App";
import { ContextProvider } from "./context";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <ContextProvider>
    <App />
  </ContextProvider>
);
```



现在，所有子组件都能获取到全局状态了，然后我们可以在 App 组件里面使用 Context：

```jsx
// ./App.jsx
import { useAppContext } from "./context";

export default function App() {
  const { count, setCount } = useAppContext();
  return (
    <div>
      <p>
        <button onClick={() => setCount(c => c + 1)}>Increase</button>
      </p>
      <p>{count}</p>
    </div>
  );
}
```



现在，应用应该能正常工作了，这就是基本架构。

## 分离状态

随着 Context 内容越来越多，如果仍然把全部状态都写在 context.js 文件中，不仅会导致单文件非常臃肿，而且还容易产生命名冲突，这时候，也许我们会想到该换 Redux 这种第三方比较健全的状态管理库了。其实，只需要调整一下架构，就可以解决这个问题。

现在，我们需要分离不同状态，工程结构如下：

```text
app/
├─ context/
│  ├─ features/  -- 这里分开存放状态
│  │  ├─ counter.js  -- 计数器状态
│  ├─ index.js  -- 原 context.js 文件
├─ App.jsx
├─ index.js
```



现在，我们把 context.js 移动到 context/index.js，还新增了 context/features/ 文件夹，用于存放不同状态，不同文件内容如下：

```jsx
// ./context/index.js
import React from "react";
import useCounter from "./features/counter";

const context = React.createContext({});

export function ContextProvider({ children }) {
  const values = {
    // 这里将不同特性放到不同的属性里，防止冲突
    counter: useCounter()
  };
  return <context.Provider value={values}>{children}</context.Provider>;
}

export function useAppContext() {
  return React.useContext(context);
}
```



```jsx
// ./context/features/counter.js
import React from "react";

export default function useCounter() {
  const [count, setCount] = React.useState(0);
  return {
    count,
    increase() {
      setCount((c) => c + 1);
    }
  };
}
```



现在，我们成功分离不同状态，即使之后加入非常多的全局状态，也不容易产生冲突了。

### 类型提示

现在产生了一个新的问题：组件使用 Context 时，没有类型提示。这个非常影响开发体验，现在我们来解决这个问题。

当前的项目使用的是 JS，没有使用 TS，但这并不代表我们不能使用类型提示，我们使用 [JSDoc](https://jsdoc.app/) 即可让获得类型提示能力，编写如下代码：

```jsx
// ./context/index.js
import React from "react";
import useCounter from "./features/counter";

/**
 * @typedef IContext
 * @prop {ReturnType<typeof useCounter>} IContext.counter
 */

const context = React.createContext({});

export function ContextProvider({ children }) {
  /**
   * @type {IContext}
   */
  const values = {
    counter: useCounter()
  };
  return <context.Provider value={values}>{children}</context.Provider>;
}

/**
 * @returns {IContext}
 */
export function useAppContext() {
  return React.useContext(context);
}
```



通过添加一些注释，现在我们获得了 Context 的类型提示。

@typedef 定义一个类型，@prop 定义该类型的属性类型，`ReturnType<typeof useCounter>` 表示 useCounter 的返回值类型，最后，我们中 useAppContext 注释 @returns 返回值的类型即可。

这里不详细赘述具体原理，想了解更多可阅读 [Typescript](https://www.typescriptlang.org/) 和 [JSDoc](https://jsdoc.app/) 文档。

## 那 Redux 还有用吗

当然有用。

> 在 Context 的适用范围上的确只是建议你[放一些类似 theme 的全局数据](https://zh-hans.reactjs.org/docs/context.html#when-to-use-context)，而没有让开发者把它当 redux store 来使用。很重要的一个原因可能就是： Context 没有提供一个重要的能力，只订阅 Context 中局部的 value，而不是只要 context valve 一变，所有依赖了此 Context 的组件就全部 render。[1]

## 参考

1. https://zhuanlan.zhihu.com/p/346616580