---
authors: MoyuScript
tags: 
  - 技术
  - 计算机科学
  - 前端
  - 工程化
---

# 一些有助于管理前端项目目录的抽象概念

看过许多前端项目，可以说各种各样的目录结构都有。虽然这玩意没有一个标准答案，但是一个合理的目录结构确实会对项目开发和维护有很大帮助。

最近学习到了 [bulletproof-react](https://github.com/alan2207/bulletproof-react)，发现还不错，但是感觉有一些地方不太合理，不能完全抄下来，需要结合实际情况使用。

因此我研究了下这个项目，提取出了一些抽象的概念，应该能帮助大家设计出合理的项目目录。

<!--truncate-->

## 根目录

根目录主要是放项目配置文件，比如 eslint 配置、package.json 等，这个没啥好说的。

## 源码

项目主要源码放在 /src/ 目录下，这是通常的做法，里面的目录管理方法是重点，这里我给大家分享几个抽象的概念和例子。

### 目录命名

目录命名在业界通常都是有一些固定名字的，直接使用即可，非必要最好不要自创一套方法，徒增成本。

需要注意的是，目录单词需要为复数形式（比如 components）。

具体命名可以参考：[bulletproof-react/project-structure.md](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)。

### 按功能划分目录

这个比较好理解，比如公共组件应该放在 /src/components/ 目录下（注意单词复数），公共类型定义放在 /src/types/ 下。

### 公共 & 私有

这个是本文的重点。通常我们会有一些**任何组件都可以引入的公共组件**，还有**特定模块中使用的私有组件**。私有组件只能被特定目录下的代码使用，而其他目录下的代码不能使用这个私有组件。

举个例子，现在有如下目录结构：

```text
src/
├─ components/
│  ├─ Form/
│  │  ├─ components/
│  │  │  ├─ FormItem.jsx
│  │  ├─ index.jsx
├─ features/
│  ├─ comments/
│  │  ├─ components/
│  │  │  ├─ ButtonSubmit.jsx
│  │  │  ├─ CommentItem.jsx
│  │  ├─ index.jsx
│  ├─ post/
│  │  ├─ index.jsx
```

/src/components/ 为公共组件库，可以被项目中的任何地方使用。

比如，/src/components/Form/index.jsx 导出的所有组件都可以被项目的任意地方使用。需要注意的是，如果它导出了 /src/components/Form/components/FormItem.jsx，FormItem 组件就可以被任意地方使用（公共），否则就不能（为 Form 组件私有）。

而 /src/features/ 下的为特定业务代码（如果是多页应用，可以理解为不同页面的根组件），可以引用 /src/components/ 下导出的组件，也可以引用特定业务相关的私有组件（比如 /src/features/comments/components/），但是不同业务代码之间不能相互引入（比如 /src/features/post/index.jsx 不能引入 /src/features/comments/components/ 下的组件）。如果有需要，请将特定业务的私有组件提取到公共组件目录下（/src/components/）。

上面看着可能感觉有点绕，其实只要记住公共组件和私有组件这个概念就可以了。