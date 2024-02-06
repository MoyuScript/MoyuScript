---
authors: MoyuScript
tags: 
  - 技术
  - 计算机科学
  - 前端
  - RxJS
image: https://pic1.imgdb.cn/item/6471b620f024cca173fb0e06.png
---

# RxJS 理念速通理解——一个整流器

偶然看到一个很热门的开源库：[RxJS](https://rxjs.dev/)

我看了下它官方文档和网上各种教程，费了老大劲才勉强理解了它是干什么的，其实它的设计理念一句话就可以概括了，这篇文章我会给大家分享一下我的理解。

<!--truncate-->

## 设计理念

一句话概括：**RxJS 是一个整流器。**如果你了解过一些电路知识就应该知道整流器是给来干嘛的，个人感觉用这个词很形象就概括了 RxJS 的作用，下面是更具体的解释。

## 什么是流（Stream）

如果你用过 NodeJS，就能直接理解什么是流了，如果还没用过，简单概括就是**流会有源源不断的数据产生。**

比如如果你监听了按钮点击事件，就相当于是监听了一个**事件流**，每次用户点击就会产生一个事件送过来。

## 为什么要整流

各种事件流推送过来的事件有不确定性，具体体现在：

- 时间可能不确定——你不知道他什么时候过来（比如用户输入文本）。
- 内容可能不确定——内容可能不一样（还是用户输入文本）。

有一个很经典的应用场景，就是**搜索候选框**，通常我们需要防抖（用户停止输入后才去发送请求搜索），可能还有其他各种过滤（比如过滤掉前导或尾随的空格），这时候就需要我们去对事件流进行整流操作。

通常我们采用的解决方式可能不够优雅，可能会引入一些外部作用域变量（比如防抖需要记录 timeoutId），容易造成冲突。这时候使用 RxJS 就挺合适的。

## RxJS 怎么整流

它通过 Pipe（可以理解为流与流之间传递数据）操作对一切输入的数据进行处理，它的作用类似于以下伪代码：

```js
// 输入
input = 1
// 中间数据 A
tempA = input * 2
// 中间数据 B
tempB = tempA + 1
// 输出
output = tempB
```

以上代码完全是同步过程，对于流，它有一个**异步过程**，也就是任意一个流他可以把数据卡着不给下一个流，等到时机成熟再推给下一个流，比如如果要实现防抖的流就是这样的。

我们把上面的伪代码改造成流的伪代码，但是我们**延迟 3 秒再输出**：

```js
stream = new Stream()
stream.pipe(
  // input * 2
  (prevStream) => {
    currentstream = new Stream()
    prevStream.onData = (data) => {
      currentStream.push(data * 2)
    }
    return currentStream
  },
  // prevData + 1
  (prevStream) => {
    currentstream = new Stream()
    prevStream.onData = (data) => {
      currentStream.push(data + 1)
    }
    return currentStream
  },
  // 延迟 3 秒再输出
  (prevStream) => {
    currentstream = new Stream()
    prevStream.onData = (data) => {
      // 关键代码
      sleep(3000)
      currentStream.push(data)
    }
    return currentStream
  }
)

// 输入
stream.push(1)
// 输出
stream.onData = (data) => {
  console.log(data)
}
```

可以看到，改造成以上代码后，pipe 里面的每一个函数都会新增一个流，然后传递给下一个函数，类似 reduce 的过程。

## 真实案例——用户输入防抖

在这里我们实现一个用户输入防抖，并将用户输入的数字翻倍后展示到页面上的功能，这是不使用 RxJS 的通常写法：

```js
const $input = document.getElementById("input");
const $output = document.getElementById("output");

let timerId
$input.oninput = (ev) => {
  const value = Number(ev.target.value)
  if (timerId) clearTimeout(timerId)
  timerId = setTimeout(() => {
    const output = value * 2
    $output.innerText = output
  }, 1000)
};
```

上面代码看着没毛病，但是有以下缺点：

- 防抖逻辑和翻倍逻辑过于耦合，如果这时候我不要防抖或者不要翻倍，或者是我想加一个数字加一的逻辑，改动起来是不是就会比较复杂？
- timerId 变成了顶层作用域的变量，如果后面还有其他逻辑，是不是可能一不小心就冲突了？

接下来我们使用 RxJS 来重构：

```js
import { fromEvent, map, debounceTime } from "rxjs";

const $input = document.getElementById("input");
const $output = document.getElementById("output");

fromEvent($input, "input")
  .pipe(
    debounceTime(1000),
    map((ev) => Number(ev.target.value) * 2)
  )
  .subscribe((out) => {
    $output.innerText = out;
  });
```

完了，是不是非常优雅？接下来我们自己实现 map 和 debounceTime 以便更好地理解 RxJS 的工作原理：

```js
import { Observable } from "rxjs";

const $input = document.getElementById("input");
const $output = document.getElementById("output");

function map(fn) {
  return (prevObservable) =>
    new Observable((subscriber) => {
      prevObservable.subscribe((value) => {
        subscriber.next(fn(value));
      });
    });
}

function debounceTime(delay) {
  let timerId;
  return (prevObservable) =>
    new Observable((subscriber) => {
      prevObservable.subscribe((value) => {
        if (timerId) clearTimeout(timerId);
        timerId = setTimeout(() => {
          subscriber.next(value);
        }, delay);
      });
    });
}

fromEvent($input, "input")
  .pipe(
    debounceTime(1000),
    map((ev) => Number(ev.target.value) * 2)
  )
  .subscribe((out) => {
    $output.innerText = out;
  });
```

以上代码可以在线尝试：

[rxjs-test - CodeSandboxcodesandbox.io/s/rxjs-test-yqihuw](https://codesandbox.io/s/rxjs-test-yqihuw)

有关 RxJS 中的更多概念请到官网去查看，这里就不赘述了。
