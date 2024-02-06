---
authors: MoyuScript
tags: 
  - 技术
  - 计算机科学
  - 前端
  - React
---

# 实现一个 React 可拖拽排序列表（全动画）

可拖拽（也叫可排序）列表是一个比较常见的组件，但是实际实现起来还是有一定复杂程度的，涉及到光标跟踪、元素交换动画，因此我自己研究了一下使用 React 的实现方法，现在分享给大家。

表达能力可能不太好，加上这个组件确实比较复杂，如果大家有不明白的地方欢迎在评论区里提问。

<!--truncate-->

顺便给大家推荐一个现有的第三方库：[sortablejs - npm (npmjs.com)](https://www.npmjs.com/package/sortablejs)。

## 效果图

![v2-4904e683788de10ed5247389bcf796dd_b](https://pic1.imgdb.cn/item/6471c429f024cca1730dba78.gif)

样式有点丑，其实是可以调整的，这里主要是展示功能，忽略即可（划掉）

## 在线代码

[https://codesandbox.io/s/react-sortable-3874us?file=/src/Sortable.jscodesandbox.io/s/react-sortable-3874us?file=/src/Sortable.js](https://codesandbox.io/s/react-sortable-3874us?file=/src/Sortable.js)

## API 设计

只需要暴露一个组件即可，这里命名为 Sortable，使用时需要传入两个参数：

- list：列表内容状态，类型看下面的例子。
- setList：更新列表内容状态函数，列表顺序发生变更时会调用并传入新的列表内容。

以上两个属性可以使用 useState Hook，如果列表是全局状态（比如 Redux），也是可以的。

这里使用 useState 作为演示，使用方法如下：

```jsx
const [list, setList] = React.useState(() =>
  [1, 2, 3, 4, 5].map((v) => ({
    // ID，每个项目必须有唯一的 key。
    key: v,
    // 列表项目内容
    children: `Item ${v}`
  }))
);

return <Sortable list={list} setList={setList}></Sortable>;
```

sortable.js 里面，需要编写一个不对外暴露的列表元素子组件，主要的逻辑将在里面进行编写：

```jsx
// sortable.js
function Item({ children, index, onMove, listLength }) {
  // 待实现...
}

export default function Sortable({ list, setList }) {
  return (
    <div>
      {list.map((child, i) => (
        <Item
          key={child.key}
          // 元素索引
          index={i}
          // 列表长度
          listLength={list.length}
          // 更新列表，其实也可以把 setList 给透传给子组件。
          onMove={(prevIndex, nextIndex) => {
            // 更新列表
            const newList = [...list];
            // 将对应元素插入到列表中新的位置
            newList.splice(nextIndex, 0, newList.splice(prevIndex, 1)[0]);
            // 更新列表状态
            setList(newList);
          }}
        >
          {child.children}
        </Item>
      ))}
    </div>
  );
}
```

## 实现

### 让列表元素可拖动

我们先让列表元素可以上下拖动，需要监听 mousedown、mousemove、mouseup 事件，具体为鼠标按下后开始拖动，鼠标移动时计算移动差值并设置元素的 top 样式。这个实现起来比较简单：

```jsx
function Item({ children, index, onMove, listLength }) {
  const [top, setTop] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [zIndex, setZIndex] = React.useState(0);

  const ref = React.useRef();

  React.useEffect(() => {
    const el = ref.current;

    // 存储起始鼠标位置
    let startY = 0;

    const mouseMove = (ev) => {
      ev.preventDefault();

      // 计算最新 Top 位置
      let latestTop = ev.clientY - startY;
      setTop(latestTop);
    };

    const mouseUp = (ev) => {
      ev.preventDefault();
      document.removeEventListener("mousemove", mouseMove);
      // 重置 Top
      setTop(0);
      // 结束拖拽
      setIsDragging(false);
      setZIndex(0);
    };

    const mouseDown = (ev) => {
      ev.preventDefault();
      // 注册事件
      document.addEventListener("mousemove", mouseMove);
      document.addEventListener("mouseup", mouseUp, { once: true });
      // 开始拖拽
      setIsDragging(true);
      setZIndex(999);
      // 记录开始位置
      startY = ev.clientY;
    };
    el.addEventListener("mousedown", mouseDown);
  }, []);

  return (
    <>
      <div
        ref={ref}
        style={{
          border: "1px solid black",
          padding: "10px",
          background: "white",
          transform: isDragging ? `scale(1.01)` : `scale(1)`,
          top: `${top}px`,
          transition: "transform .2s, box-shadow .2s",
          position: "relative",
          width: "100%",
          boxShadow: isDragging
            ? "0 0 10px 2px rgba(0, 0, 0, 0.5)"
            : "0 0 0 0px rgba(0, 0, 0, 0.5)",
          zIndex: zIndex.toString()
        }}
      >
        {children}
      </div>
    </>
  );
}
```

![v2-9bfffedf31a41069fa02cb014aa7afd5_b](https://pic1.imgdb.cn/item/6471c429f024cca1730dbb52.gif)

现在，列表元素应该可以上下拖动了，拖动后松开鼠标元素会瞬间回到原来的位置。

不给 top 设置 transition 的原因是，首先拖动时设置了 transition 的话会比鼠标移动慢一拍，然后是后面我们实现列表元素交换动画时需要另外控制。

### 拖动修改元素位置

现在我们需要通过计算，在达到元素交换条件时交换对应元素，主要是在 mousemove 监听器回调中实现：

```jsx
const mouseMove = (ev) => {
  ev.preventDefault();

  // 获取元素 Rect 并更新 Ref
  const rect = el.getBoundingClientRect();
  prevRectRef.current = rect;

  // 计算最新 Top 位置
  let latestTop = ev.clientY - startY;

  // 检查是否需要更新元素位置
  if (
    // 拖动正距离大于自身高度，此时应该与下一个元素交换位置
    latestTop > rect.height &&
    // 防止越界（如果是最后一个元素就不要交换位置了）
    // useEffect 依赖项为空数组的缘故，前面使用了 ref 来存储最新的 index 值，这里省略了定义过程
    // 理解为是 index 最新值就可以了
    indexRef.current < listLengthRef.current - 1
  ) {
    // move down
    // 通知父组件修改列表（更新当前拖动元素的索引）
    onMoveRef.current(indexRef.current, indexRef.current + 1);
    // 因为 DOM 位置被改变了，需要同步计算最新位置
    // 可以理解为计算出来的值就是元素发生交换后，松开鼠标再按住鼠标时相关变量的值。
    // 可以试着注释掉这行看看会发生什么，就能理解了（会闪一下）
    latestTop -= rect.height;
    // 开始位置也要更新
    startY += rect.height;
  } else if (
    // 拖动负距离大于自身高度，此时应该与上一个元素交换位置
    latestTop < -rect.height &&
    // 防止越界（如果是第一个元素就不要交换位置了）
    indexRef.current > 0
  ) {
    // move up
    onMoveRef.current(indexRef.current, indexRef.current - 1);
    latestTop += rect.height;
    startY -= rect.height;
  }
  setTop(latestTop);
};
```

现在这个组件的核心功能其实就已经实现了，效果如下：

![out](https://pic1.imgdb.cn/item/6471c42bf024cca1730dbd90.gif)

### 动画

现在我们想要元素位置发生变化时有相应的动画，拖动元素松开鼠标后也要有元素回去的动画。

这里使用了 [FLIP 动画技术](https://aerotwist.com/blog/flip-your-animations/)，这个技术非常巧妙，通过记录元素上一次的位置（也可以是任何能动画化的 CSS 属性）和当前位置的差值，来让元素从上一次的位置平滑移动到新的位置，这里不深入探讨这个技术，可以参考这篇文章：

[前端动画之FLIP技术 - 掘金](https://juejin.cn/post/6844903967613255693)

React 中使用，具体操作为通过 useRef 来保存上一次更新时元素的 Rect（[Element.getBoundingClientRect](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/getBoundingClientRect)），然后使用 [useLayoutEffect](https://reactjs.org/docs/hooks-reference.html#uselayouteffect) 来获取本次更新时新的 Rect，这样就实现了 FLIP 中的 “FL”，后面的就和平常一样了。

使用 useLayoutEffect 的原因是这个 Hook 会在元素更新后渲染到屏幕前调用，而 useEffect 是渲染到屏幕后才调用，正如其名，LayoutEffect 就是专门操作元素的布局样式的。

此外，我们还需要在元素拖拽时禁用掉 FLIP 动画，因此代码编写如下：

```jsx
React.useLayoutEffect(() => {
  // FLIP animation
  // https://aerotwist.com/blog/flip-your-animations/
  const el = ref.current;
  if (isDragging) {
    // 拖拽中的元素不计算
    return;
  }

  if (prevRectRef.current === null) {
    // 元素第一次渲染
    prevRectRef.current = el.getBoundingClientRect();
    return;
  }

  // 需要保存上一次动画实例
  // 如果有动画正在运行则取消，防止拖动速度过快有鬼畜效果
  // 可以试试注释掉下面的代码然后快速拖动元素看看是什么鬼畜效果
  if (animationRef.current) {
    const animation = animationRef.current;
    if (animation.playState === "running") {
      // Cancel previous animation
      animation.cancel();
    }
  }

  // FLIP: First
  const prevRect = prevRectRef.current;

  // FLIP: Last
  const latestRect = el.getBoundingClientRect();
  const deltaY = latestRect.y - prevRect.y;

  prevRectRef.current = latestRect;

  if (deltaY === 0) {
    return;
  }

  // FLIP: Invert and Play
  animationRef.current = el.animate(
    [
      {
        top: `${-deltaY}px`
      },
      {
        top: `0px`
      }
    ],
    200
  );
}, [index, isDragging]);
```

至此，一个全动画的可拖拽列表就实现了。

