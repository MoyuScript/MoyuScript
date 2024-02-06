---
authors: MoyuScript
tags: 
  - 技术
  - 计算机科学
  - 前端
  - react-redux
---

# 实现一个简单的 react-redux（原理学习）

最近对 [react-redux](https://www.npmjs.com/package/react-redux) 的实现原理感兴趣，翻看了下源码，发现原理比预想中的要简单，因此自己手动实现了一个简单的 react-redux，现在分享心得给大家作参考。

<!--truncate-->

代码可以在这里看到：

[https://codesandbox.io/s/jian-yi-react-redux-1heujo?file=/src/App.jscodesandbox.io/s/jian-yi-react-redux-1heujo?file=/src/App.js](https://codesandbox.io/s/jian-yi-react-redux-1heujo?file=/src/App.js)

## Context

react-redux 使用了 [Context API](https://react.docschina.org/docs/context.html)，主要是将 store 和一些其他东西存在了里面，用于在之后的 hooks 里面使用。

```jsx
// store 存在 context 里面
const context = createContext();
```

## Provider

Provider 将包裹整个应用，通常作为根组件，除了传入 children，Provider 还会传入一个 store 属性，这个是使用 Redux.createStore 创建的 store。

里面主要作的是 Context 的初始化，简易实现代码如下：

```jsx
function MyProvider({ children, store }) {
  // 将 store 存在 context 里面给 hook 用
  const ctx = {
    store
  };
  return <context.Provider value={ctx}>{children}</context.Provider>;
}
```

## Hooks

react-redux 最常用到的两个 hooks 为 useSelector 和 useDispatch。

### useDispatch

这个 hooks 实现起来最简单，其实就只是返回 store.dispatch 而已：

```jsx
function useMyDispatch() {
  // 这个比较简单，只是返回 store.dispatch
  const { store } = useContext(context);
  return store.dispatch;
}
```

### useSelector

这个略复杂，入参为一个选择函数，用于选择组件需要的状态。函数实现如下：

1. 首先需要使用 useState 定义一个计数器（也可以是 true、false 的 switch），主要用于强制组件更新。
2. 然后在函数体内使用 store.getState 来获取状态快照。
3. 在 useEffect 里面使用 store.subscribe 订阅状态变化事件，然后对比前后状态的变化，如果状态发生了变化就强制组件更新。
4. 返回值为在第 2 步中获取到的状态快照。

```jsx
function useMySelector(fn) {
  // 这个计数器是为了强制更新组件
  const [, setCount] = useState(0);
  const { store } = useContext(context);

  // 调用 fn 来获取状态
  const prevState = fn(store.getState());
  useEffect(() => {
    // 订阅状态变化事件
    return store.subscribe(() => {
      // 获取最新状态
      const newState = fn(store.getState());

      /**
       * 重点代码
       *
       * 比较新旧状态，如果有变化才强制更新
       *
       * 使用 lodash.isEqual 来对对象进行深比较
       */
      if (!isEqual(prevState, newState)) {
        setCount((c) => c + 1);
      }
    });
  }, [store, fn, prevState]);
  return prevState;
}
```

## 性能优化

从实现原理可以看出一个性能优化的方法，就是 useSelector 只选择最小需要的状态，可以避免没有用到的状态更新导致组件被重新渲染。