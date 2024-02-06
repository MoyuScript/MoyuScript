---
authors: MoyuScript
tags: 
  - 技术
  - 计算机科学
  - 前端
  - React

---

# 拒绝屎山！React 代码整洁之道

React 由于太过灵活，10 个人写能写出 10 种甚至 9 种写法（绝望）。俗话说乱写一时爽，维护火葬场（自己说的），因此这篇文章总结了我日常开发见到的各种不合理写法，和自己写出整洁代码的一些经验。

<!--truncate-->

## 组件结构

组件结构建议分为四大块（有顺序）：状态 Hook 调用（useState）、副作用 Hook 调用（useEffect）、方法定义、渲染逻辑。

**示例：**

```jsx
function Component({ children }) {
  // 状态 Hook 调用
  const [state, setState] = useState(false);

  // 也可以在这里定义 Effect 要用到的纯函数，记住不能使用任何函数外的变量
  // 纯函数也可以考虑单独拆出来，可能将来在别的组件也会用到

  // 副作用 Hook 调用
  useEffect(() => {}, []);

  // 方法定义，尽量使用箭头函数
  const fn = () => {};

  // 渲染逻辑

  // 如果后面渲染表达式过于复杂，可以单独抽出来放着，命名为 renderXXX
  // 更好的做法还是单独抽出一个组件
  const renderXXX = () => <p></p>;

  return <p>{children}</p>;
} 
```

这是个人习惯的做法。好处就是可以很清晰分清楚不同逻辑块。

## 常用 Hook 逻辑抽离

就是把常用到的 Hook 逻辑单独抽离出来，方便维护。

如果不知道该怎么拆，可以记住一个方法：如果实现一个逻辑需要用到多个 Hook、多个变量，而且这个逻辑还可能在别的组件中使用，拆它就完事了。

**示例：**

```jsx
function Component() {
  // 错误，维护起来非常不方便
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetchInfo()
        .then((resp) => setInfo(resp));
  }, []);

  // 正确，可能这个 info 还会在其他组件用到，这样可以复用代码也方便维护
  const info = useInfo();
}
```

推荐使用 [ahooks - React Hooks Library - ahooks 3.0](https://ahooks.js.org/zh-CN/)，里面封装了很多非常常用的逻辑，很方便使用。

## 组件能拆尽拆

组件高度拆分能极大提升代码可维护性。特别是如果你用了 CSS-in-JS，如果不拆的话代码会非常多的。

当然，也没必要搞极端把组件拆的太多，这样反而还会增加工作量。

**示例：**

```jsx
// 错误
function App() {
  const list = [1, 2, 3, 4];

  return (
    <div>
        <h1>标题</h1>
        <ul>
          {list.map(item => <li key={item}>{item}</li>)}
        </ul>
        <p>还有其他一堆东西</p>
    </div>
  );
}

// 正确
function ListItem({ children }) {
  return (
    <li>{children}</li>
  );
}
function List({ list }) {
  return (
    <ul>{list.map(item => <ListItem key={item}>{item}</ListItem>)}</ul>
  );
}
function App() {
  const list = [1, 2, 3, 4];

  return (
    <div>
        <h1>标题</h1>
        <List list={list} />
        <p>还有其他一堆东西</p>
    </div>
  );
}
```

一个文件应当只有一个组件，上面只是为了方便演示就都放一个文件里面了，目录结构可以阅读我之前写的一篇文章：

[一些有助于管理前端项目目录的抽象概念](/2022/08/28/good-project-structure-for-front-end-project)

## 避免使用无意义 useCallback

和他人合作开发时经常见到乱用 useCallback，估计是没理解 useCallback 的正确用法，可以看我往期的文章：

[React useCallback & useMemo 实用技巧（性能优化）](/2022/08/17/react-usecallback-and-usememo-usage-tips)

## 函数式编程

函数式编程能使代码更容易理解和维护，善用 [lodash](https://lodash.com/)。复杂逻辑善用 lodash.chain。

**示例：**

```jsx
const list = [1, 2, 3, 4];

// 错误
const children = [];

for (const item of list) {
  children.push(<p key={item}>{item}</p>);
}

// 正确
const children = list.map(item => <p key={item}>{item}</p>);
```

## 尝试使用 CSS Utility Library

现有的不论是 CSS-in-JS，还是 CSS Modules，写起来都还是感觉比较繁琐。

CSS-in-JS 很容易把代码写的太长，而且现阶段也很难支持媒体查询和伪元素 & 伪类。

CSS Modules 还要想怎么去命名，使用 CSS 预处理器的话嵌套也会很容易乱。

所以可以尝试试试 CSS Utility Library，比如 [Tailwind CSS](https://tailwindcss.com/)。我已经在项目中使用了，真的是用了后就再也回不去了。