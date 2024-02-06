---
authors: MoyuScript
tags: 
  - 技术
  - 计算机科学
  - 前端
  - Ant Design
---

# Ant Design 源码学习——Message（全局提示）篇

Ant Design 是一个很棒的 UI 库，里面有些组件确实值得学习一下。本篇为 Messge（全局提示）篇。

<!--truncate-->

## 概览

Message 通常用于展示反馈信息（操作失败、操作成功等），是一种不会打断用户操作的轻量级提示方式。[[1\]](https://zhuanlan.zhihu.com/p/551548383#ref_1)

![img](https://pic1.imgdb.cn/item/6471c3d7f024cca1730d29d9.webp)

## 在线代码

[CodeSandboxcodesandbox.io/s/ant-design-message-8yq6xk?file=/src/message.js](https://codesandbox.io/s/ant-design-message-8yq6xk?file=/src/message.js)

## 技术要点

- [React.useImperativeHandle](https://reactjs.org/docs/hooks-reference.html#useimperativehandle)
- 列表动画（[React Transition Group](http://reactcommunity.org/react-transition-group/)）
- Ref 技术

## 实现

### API 设计

Ant Design 的 Message 不像其他组件，是使用一些静态方法来显示全局提示，比如 message.success()。这种设计方式比较符合日常使用场景，因为通常通知弹出后一段时间后就会自动消失，且很少需要去管理。

因此我计划暴露一个函数，只需要调用这个函数就可以显示全局提示，设计如下：

```jsx
export default function showMessage(content) {
  // 显示通知，content 为 ReactNode
}
```

### 组件挂载

因为通知需要显示在页面最上面，所以需要创建一个 ReactDOM.root 并挂载到 document.body 下面，代码如下：

```jsx
import ReactDOM from "react-dom/client";

// 创建容器
const el = document.createElement("div");
document.body.append(el);
el.style.position = "fixed";
el.style.top = "10px";
el.style.zIndex = "999";

// React 18 写法
const root = ReactDOM.createRoot(el);

// ... 定义组件

// 渲染组件，之后还需要传入些参数，这里暂时不写了
root.render(<Component />);
```

### 组件设计

这里需要设计两个组件，一个是通知列表组件（Notifications），一个是单个通知组件（NotificationItem）。通知列表组件主要是管理通知列表和动画管理，而单个通知组件主要是渲染通知和移除控制，两个组件设计如下：

```jsx
import React, { useRef, useState } from "react";
import { TransitionGroup, CSSTransition } from "react-transition-group";

const NotificationItem = ({ content, onRemove }) => {
  // 如果鼠标在上面就不要关闭通知
  const [isHover, setIsHover] = useState(false);

  React.useEffect(() => {
    let timeout;
    if (!isHover) {
      timeout = setTimeout(() => {
        // 通知父组件移除自身
        onRemove();
      }, 3000);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [isHover, onRemove]);

  return (
    <div
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{
        background: "white",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
        padding: "10px",
        marginBottom: "10px"
      }}
    >
      {content}
    </div>
  );
};

const Notifications = React.forwardRef((props, ref) => {
  // 通知列表
  const [list, setList] = useState([]);

  // 通知自增 key
  const incrementKeyRef = useRef(0);

  // 这个 Hook 可以设置 Ref 的值，参考：https://reactjs.org/docs/hooks-reference.html#useimperativehandle
  React.useImperativeHandle(ref, () => ({
    notify(content) {
      // 自增 key
      const key = incrementKeyRef.current++;
      setList((list) => {
        // 动画使用的是 React Transition Group
        const noti = (
          <CSSTransition
            key={key}
            timeout={300}
            classNames="message"
            className="message"
          >
            <NotificationItem
              onRemove={() => {
                // 移除通知
                setList((list) => {
                  return list.filter((item) => item.key !== key.toString());
                });
              }}
              content={content}
            />
          </CSSTransition>
        );
        const newList = [...list, noti];
        return newList;
      });
    }
  }));

  return <TransitionGroup>{list}</TransitionGroup>;
});
```

### 列表动画

列表动画使用的是 [React Transition Group](http://reactcommunity.org/react-transition-group/)，使用 [TransitionGroup](http://reactcommunity.org/react-transition-group/transition-group) 和 [CSSTransition](http://reactcommunity.org/react-transition-group/css-transition) 来管理列表动画，我这里动画模仿 Ant Design Message 的动画，CSS 定义如下：

```css
.message {
  position: relative;
  opacity: 0;
  margin-top: -10px;
}

.message-enter {
  opacity: 0;
  margin-top: -10px;
}

.message-enter-active {
  transition: all 0.3s;
  opacity: 1;
  margin-top: 0;
}

.message-enter-done {
  opacity: 1;
  margin-top: 0;
}

.message-exit {
  opacity: 1;
  margin-top: 0;
}

.message-exit-active {
  transition: all 0.3s;
  opacity: 0;
  margin-top: -10px;
}
```

其中有个要点，就是 margin-top 设置为负值，这个操作是允许的。设置为负值可以把 DOM 元素往上面拉，会影响到其他 DOM 元素的位置，这个动画视觉上看上去就是上面的通知向上移动并消失，而下面的通知就向上补位了，而如果使用 top 属性则无法实现这种效果。

### [React.useImperativeHandle](https://reactjs.org/docs/hooks-reference.html#useimperativehandle) 和 Ref 技术

我们需要在 showMessage 中可以调用组件内部的方法（修改组件内部状态），这里就需要用到 Ref 技术和 [React.useImperativeHandle](https://reactjs.org/docs/hooks-reference.html#useimperativehandle) Hook。

这个 Hook 可以理解为给 Ref 设置特定的值，虽然确实可以直接使用赋值的方式来给 Ref 设置值，但是这个 Hook 和 useEffect 一样，提供了一个参数 deps（依赖项），仅当依赖项变化时才给 Ref 重新赋值，在一些特定的场景可以优化一些性能。

此外，这个 Hook 需要搭配 [React.forwardRef](https://reactjs.org/docs/react-api.html#reactforwardref) 使用，使用方法如下：

```jsx
import ReactDOM from "react-dom/client";
import React, { useRef } from "react";

// 创建容器
const el = document.createElement("div");
document.body.append(el);
el.style.position = "fixed";
el.style.top = "10px";
el.style.zIndex = "999";

const root = ReactDOM.createRoot(el);

// 创建一个 Ref
const notificationRef = React.createRef();

// 组件需要使用 React.forwardRef 包裹，包裹后组件除了传入 props（第一个参数），还会传入 ref（第二个参数）
const Notifications = React.forwardRef((props, ref) => {
  // 这个 Hook 可以设置 Ref 的值，参考：https://reactjs.org/docs/hooks-reference.html#useimperativehandle
  React.useImperativeHandle(
    // 传入的 Ref
    ref,
    // 构造 Ref 的函数
    () => ({
      notify(content) {
        // 定义通知函数
      }
    }),
    // 依赖项定义，因为这里是个空数组，所以上面构造 Ref 的函数应该只会在组件挂载的时候调用一次
    []
  );

  return <TransitionGroup>{list}</TransitionGroup>;
});

// 渲染容器，注意这里传入了 Ref
root.render(<Notifications ref={notificationRef} />);

/**
 * 显示通知
 * @param {React.ReactNode} content 通知内容
 */
export default function showMessage(content) {
  // 这里就可以调用组件内暴露出来的方法了
  notificationRef.current.notify(content);
}
```

至此，一个简单的全局通知就实现了，顺带一提，Ant Design 的 [Notification](https://ant.design/components/notification-cn/) 其实就是这个的一个变体。

## 参考

1. <https://ant.design/components/message-cn/#何时使用>