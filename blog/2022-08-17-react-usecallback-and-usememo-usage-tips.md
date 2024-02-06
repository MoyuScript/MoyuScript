---
authors: MoyuScript
tags: 
  - 技术
  - 计算机科学
  - 前端
  - React
---

# React useCallback & useMemo 实用技巧（性能优化）

这两个 API 概念比较简单，但是经常被误用（特别是 useCallback，经常能看到有人动不动就 useCallback），因此这里给大家分享一下这两个 API 的正确使用场景。

<!--truncate-->

## 概念

先简单了解一下概念。

### useCallback

```js
const memorizedCallback = useCallback(() => {}, /* 依赖项 */[])
```

当依赖项变化时，会重新“生成一个函数”，否则使用之前被缓存的函数。

可以理解为如果依赖项没有变化时，每次组件被执行时 useCallback 返回的函数都是同一个（即地址（类似 C 语言的指针）相同，如果想办法得到上一次渲染时的 callback 值，使用等号比较会为 true）。

可以尝试以下代码：

[https://codesandbox.io/s/react-usecallback-deps-7o7f95?file=/src/App.js:284-315codesandbox.io/s/react-usecallback-deps-7o7f95?file=/src/App.js:284-315](https://codesandbox.io/s/react-usecallback-deps-7o7f95?file=/src/App.js:284-315)

```js
import { useCallback, useRef, useState } from "react";

export default function App() {
  const lastCallbackRef = useRef(null);
  const [c1, setC1] = useState(0);
  const [c2, setC2] = useState(0);

  const callback = useCallback(() => {}, [c1]);

  const didCallbackUpdated = lastCallbackRef.current !== callback;

  lastCallbackRef.current = callback;
  return (
    <div className="App">
      <p>
        <button onClick={() => setC1((c) => c + 1)}>C1</button> {c1}
      </p>
      <p>
        <button onClick={() => setC2((c) => c + 1)}>C2</button> {c2}
      </p>
      <p>Did callback updated: {didCallbackUpdated.toString()}</p>
    </div>
  );
}
```

预期：点击 C1 按钮时 didCallbackUpdated 为 true，点击 C2 按钮时 didCallbackUpdated 为 false。

### useMemo

```js
const memorizedValue = useMemo(() => {return Date.now()}, /* 依赖项 */[])
```

当依赖项变化时，会调用传入的函数以重新计算，一般用于优化开销比较大的计算。

可以尝试以下代码：

[https://codesandbox.io/s/react-usememo-deps-fpw30o?file=/src/App.jscodesandbox.io/s/react-usememo-deps-fpw30o?file=/src/App.js](https://codesandbox.io/s/react-usememo-deps-fpw30o?file=/src/App.js)

```js
import { useMemo, useState } from "react";

export default function App() {
  const [c1, setC1] = useState(0);
  const [c2, setC2] = useState(0);

  const memorizedValue = useMemo(() => Date.now(), [c1]);

  return (
    <div className="App">
      <p>
        <button onClick={() => setC1((c) => c + 1)}>C1</button> {c1}
      </p>
      <p>
        <button onClick={() => setC2((c) => c + 1)}>C2</button> {c2}
      </p>
      <p>Value: {memorizedValue}</p>
    </div>
  );
}
```

预期：点击 C1 时 memorizedValue 改变，点击 C2 时不改变。

## 使用技巧

可以一边看下面这个例子一边看文章：

[https://codesandbox.io/s/react-usecallback-and-usememo-o3m2m4codesandbox.io/s/react-usecallback-and-usememo-o3m2m4](https://codesandbox.io/s/react-usecallback-and-usememo-o3m2m4)

### useMemo

useMemo 用于缓存开销比较大的计算结果，也就是说仅当必要时才重新计算，这个用法比较简单。

有一点需要注意的是，如果 useMemo 返回的是引用值（即 object），使用技巧参考下面的 useCallback（因为 Function 也是引用值）。

例子中可以看 `<ReactMemoRenderCount obj={obj} />` 和 `<ReactMemoRenderCount obj={immutableObj} />` 的部分。

### useCallback

`useCallback` 是需要重点注意的，经常被误用。

只需要记住一句话即可：**useCallback 只用于减少子组件不必要调用，子组件必须配合 React.memo 使用。**

被 `React.memo` 包裹后的组件，只有在传入的 props 变化时才会重新调用，否则不会调用，这点很重要（例子中可以看 `<ReactMemoRenderCount />` 和 `<ReactMemoRenderCount count={count} />` 的部分）。

使用 `useCallback` 的意义在于，如果依赖项未变化，它能保持返回的函数地址相同，如果这个函数传给了被 `React.memo` 包裹的子组件，则**不会**引起子组件的重新调用。

`useCallback` 配合 `React.memo`，例子中可以看 <`ReactMemoRenderCount callback={commonCallback} />` 和 `<ReactMemoRenderCount callback={immutableCallback} />` 的部分。

**被误用的 useCallback**

日常开发中发现经常有人乱用 `useCallback`（不配合 `React.memo` 使用），因为多调用了一个函数（`useCallback`），性能反而还下降了。可能是以为使用了 `useCallback`，就能阻止新函数的生成，然而并不能阻止。

可以参考例子中的 `<RenderCount callback={immutableCallback} />`，因为没有配合 `React.memo` 使用，组件不管怎么样还是被重新渲染了，根本没有起到优化的作用，还产生了一个新的缺点：容易引起闭包问题。