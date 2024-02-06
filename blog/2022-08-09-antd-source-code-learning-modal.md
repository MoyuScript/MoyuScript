---
authors: MoyuScript
tags: 
  - 技术
  - 计算机科学
  - 前端
  - Ant Design
---

# Ant Design 源码学习——Modal（对话框）篇

平常开发中经常使用到 [Ant Design](https://ant.design/)，确实是一个非常好用的 React UI 库，但是只会用不知道实现原理的话就很难有进步，因此我想翻翻源码学习一下部分组件的具体实现原理，顺便分享一下自己的心得给大家。

这个系列的文章不会写到所有的细节，只会写一些我认为比较关键和实现起来比较困难的点。

<!--truncate-->

## 概览

Modal 组件需要通过一个 visible 属性来控制开启和关闭。

![img](https://pic1.imgdb.cn/item/6471c408f024cca1730d7974.webp)

## 在线代码

[ant-design-modal - CodeSandboxcodesandbox.io/s/ant-design-modal-kf82p0?file=/src/App.js](https://codesandbox.io/s/ant-design-modal-kf82p0?file=/src/App.js)

## 技术要点

- ReactDOM.createPortal
- 动画管理
- 缩放原点
- 阻止页面滚动

## 实现

### ReactDOM.createPortal

模态框需要占用整个屏幕，而组件可能被使用任何位置，因此需要使用到 [ReactDOM.createPortal API](https://reactjs.org/docs/react-dom.html#createportal)，来将组件渲染到 document.body 下而不是默认的位置。

使用方法很简单，只需要在组件 return ReactDOM.createPortal(children, element) 就可以了，这里的 element 一般为 document.body。

这个 API 一般用于模态框、全局通知框等需要盖在整个页面上的组件使用，其他情况最好不要滥用，否则容易导致 DOM 混乱。

### 动画管理

Ant Design Modal 组件动画实现使用的是自研的 [rc-motion](https://github.com/react-component/motion) 组件，当然，这里也可以使用 [React Transition Group](https://reactcommunity.org/react-transition-group/)。出于学习目的，我写的代码不打算引用除了 React 和 ReactDOM 之外的任何第三方库。

组件内部需要额外管理两个状态，一个用于控制外层容器的 display，另一个用于控制 transition 动画。

```jsx
// 控制外层 div 的 display 是否为 none
const [modalHidden, setModalHidden] = useState(!visible);
// 控制模态框缩放和不透明度动画和背景蒙版动画
const [animatedVisible, setAnimatedVisible] = useState(visible);
```

### 进场动画

进场时需要先把外层容器的 display: none 去掉，然后使用 setTimeout 先让 React 渲染出来，最后再执行模态框缩放和不透明度动画、背景蒙版淡入动画。

### 离场动画

离场时顺序刚好相反，先执行模态框缩放和不透明度动画、背景蒙版淡出动画，待动画结束后再设置外层容器的 display 为 none（使用 setTimeout，延迟为动画时长）

```jsx
useEffect(() => {
  if (visible) {
    // 弹出模态框
    // 先把模态框的 display 取消 none
    setModalHidden(false);
    // 使用 setTimeout 先让 React 渲染已经修改的状态
    // 如果不使用 setTimeout，模态框动画会无效
    setTimeout(() => {
      // 然后再开始动画
      setAnimatedVisible(true);
    }, 0);
  } else {
    // 关闭模态框
    // 先进行动画
    setAnimatedVisible(false);
    setTimeout(() => {
      // 动画结束后把模态框设置为 display: none
      setModalHidden(true);
    }, 300);
  }
}, [visible]);
```

### 缩放原点

注意观察 Ant Design Modal 打开和关闭时缩放起点位置，可以发现是鼠标点击的位置，因此我们需要监听鼠标在页面上的点击事件，然后经过计算设置合适的 transform-origin。

```jsx
// 设置 transformOrigin
const [transformOrigin, setTransformOrigin] = useState("center");
// 模态框 DOM Ref 引用
const modalRef = useRef(null);

useEffect(() => {
  /**
   *
   * @param {MouseEvent} ev
   */
  const onClick = (ev) => {
    // 防止模态框在展示时修改 transformOrigin，不然离场动画缩放原点会变成点击关闭模态框操作时鼠标位置
    if (!modalHidden) return

    // 获取模态框 BoundingRect，然后计算正确的的 transformOrigin
    /**@type {DOMRect} */
    const rect = modalRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    setTransformOrigin(`${x}px ${y}px`);
  };

  document.documentElement.addEventListener("click", onClick);

  return () => {
    document.documentElement.removeEventListener("click", onClick);
  };
}, [modalHidden]);
```

### 阻止页面滚动

如果页面不止一屏时，弹出模态框后页面是可以滚动的，需要设置 `<body>` 标签的 style 为 overflow: hidden。

```jsx
useEffect(() => {
  document.body.style.overflow = visible ? "hidden" : "";
}, [visible]);
```

组件完整代码如下：

```jsx
unction Modal({ visible, content }) {
  // 控制外层 div 的 display 是否为 none
  const [modalHidden, setModalHidden] = useState(!visible);
  // 设置 transformOrigin
  const [transformOrigin, setTransformOrigin] = useState("center");
  // 控制模态框缩放和不透明度动画和背景蒙版动画
  const [animatedVisible, setAnimatedVisible] = useState(visible);
  // 模态框 DOM Ref 引用
  const modalRef = useRef(null);

  // body 需要设置为 overflow: hidden 避免模态框展示时页面可以滚动
  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
  }, [visible]);

  // 绑定 document 的点击事件，设置 transformOrigin
  useEffect(() => {
    /**
     *
     * @param {MouseEvent} ev
     */
    const onClick = (ev) => {
      // 防止模态框在展示时修改 transformOrigin，不然离场动画缩放原点会变成点击关闭模态框操作时鼠标位置
      if (!modalHidden) return;

      // 获取模态框 BoundingRect，然后计算正确的的 transformOrigin
      /**@type {DOMRect} */
      const rect = modalRef.current.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      setTransformOrigin(`${x}px ${y}px`);
    };

    document.documentElement.addEventListener("click", onClick);

    return () => {
      document.documentElement.removeEventListener("click", onClick);
    };
  }, [modalHidden]);

  // 真正控制动画的地方
  useEffect(() => {
    if (visible) {
      // 弹出模态框
      // 先把模态框的 display 取消 none
      setModalHidden(false);
      // 使用 setTimeout 先让 React 渲染已经修改的状态
      // 如果不使用 setTimeout，模态框动画会无效
      setTimeout(() => {
        // 然后再开始动画
        setAnimatedVisible(true);
      }, 0);
    } else {
      // 关闭模态框
      // 先进行动画
      setAnimatedVisible(false);
      setTimeout(() => {
        // 动画结束后把模态框设置为 display: none
        setModalHidden(true);
      }, 300);
    }
  }, [visible]);

  const modal = (
    <div
      style={{
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        zIndex: "999",
        display: modalHidden ? "none" : "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: "background .3s",
        background: animatedVisible ? "rgba(0, 0, 0, 0.7)" : ""
      }}
    >
      <div
        ref={modalRef}
        style={{
          background: "white",
          width: "70vw",
          padding: "10px",
          transform: animatedVisible ? "scale(1)" : "scale(0.6)",
          opacity: animatedVisible ? "1" : "0",
          transition: "transform .3s, opacity .3s",
          transformOrigin
        }}
      >
        {content}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
```

至此，一个简单的模态框就实现了。