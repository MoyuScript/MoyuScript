---
authors: MoyuScript
tags: 
  - 技术
  - 计算机科学
  - 前端
  - JavaScript
---

# JavaScript Promise 的可“取消”技术

众所周知，在 JavaScript 中，Promise 一旦开始后就无法取消了，有时候我们确实需要一种可取消的 Promise。经过对几个比较知名的开源库研究，我学习到了一些 Promise 的“取消”（打上引号表示并不是真的取消了）技术，并分享给大家。

<!--truncate-->

参考到的两个开源库：

- [sindresorhus/p-cancelable: Create a promise that can be canceled (github.com)](https://github.com/sindresorhus/p-cancelable)
- [useAsyncEffect - ahooks 3.0](https://ahooks.js.org/zh-CN/hooks/use-async-effect)

文中的代码效果可以在 CodeSandbox 中体验：

[cancellable-promise - CodeSandboxcodesandbox.io/s/cancellable-promise-ghpi50?file=/index.html:5600-6317](https://codesandbox.io/s/cancellable-promise-ghpi50?file=/index.html:5600-6317)

## 实现要点

因为实际上 Promise 一旦开始后就不能取消了，所以我们无法实现真正意义上的“取消”（像 Python 那样可取消的协程）。因此主要的实现要点在于**需要有一种方法通知到 Promise 内部它已经被取消了，从而中断操作。**

### AsyncGenerator

提到函数中断，我们可以想到 Generator（生成器）是可以中断函数执行的（即 yield 关键字），那么我们就可以在生成器内部的一些关键操作（可以是 await 前，也可以是比较耗时的同步调用前）前设置“检查点”，用于中断函数去检查自己有没有被“取消”。

这个思路我是从 [useAsyncEffect - ahooks 3.0](https://ahooks.js.org/zh-CN/hooks/use-async-effect) 的源码里面看到的，不得不说这种利用生成器的方法妙啊。具体代码如下：

```js
function cancellablePromiseWithAsyncGenerator(asyncGenerator) {
  // 取消标记
  let isCancelled = false;
  async function f() {
    while (true) {
      const result = await asyncGenerator.next();
      // 每次 yield 的时候就会暂时中断函数执行，然后在这里检查是否被取消，决定是否继续执行函数

      if (result.done) {
        // 函数执行结束，返回 return 的值。
        return result.value;
      }

      if (isCancelled) {
        // 被取消
        throw new Error("Promise cancelled");
      }
    }
  }

  const promise = f();

  // 定义取消函数
  promise.cancel = () => {
    isCancelled = true;
  };
  return promise;
}
```

使用方法如下：

```js
async function promise1() {
  const el = document.getElementById("status-1");

  async function* wrapper() {
    el.textContent = "Loading...";
    const data = await fetchKleeProfile();

    // yield 检查点，如果 Promise 被取消就不会往下执行了
    yield;

    el.textContent = data;

    return data;
  }

  const promise = cancellablePromiseWithAsyncGenerator(wrapper());
  window.cancelPromise1 = promise.cancel;

  try {
    const data = await promise;
    console.log("[Promise1]", data);
  } catch (err) {
    // 可能需要等比较久的时间才会抛出异常
    console.error("[Promise1]", err);
    el.textContent = "Cancelled";
  }
}

promise1();
```

**优点：**

- 方便在异步函数中设置检查点（只要写 yield 就可以了）。

**缺点：**

- 如果异步函数中某个 await 等待时间过长，函数调用者会等很久才知道 Promise 被取消了。
- 侵入性较强，可以取消的 Promise 必须按照特定写法才能有用。
- 异步函数内没有办法知道自己被取消了，无法进行取消后动作（比如释放资源）。

这个方法个人不太推荐使用，后面有更好的方法。

### setTimeout 检查

这种方法使用 setTimeout 去不断检查 Promise 是否被取消和 Promise 是否有结果（resolved 或 rejected）：

```js
function cancellablePromisePlus(asyncFn, ...args) {
  // 保存 Promise 状态和值
  let promiseStatus = "pending";
  let promiseValue = null;
  const cancelledCallbacks = new Set();

  // 执行 promise，最后一个参数为取消回调
  asyncFn(...args, (cb) => {
    cancelledCallbacks.add(cb);
  })
    .then((data) => {
      if (promiseStatus !== "pending") return;
      promiseStatus = "fulfilled";
      promiseValue = data;
    })
    .catch((err) => {
      if (promiseStatus !== "pending") return;
      promiseStatus = "rejected";
      promiseValue = err;
    });

  async function check() {
    return new Promise((resolve, reject) => {
      function checkInner() {
        if (promiseStatus === "fulfilled") {
          resolve(promiseValue);
        } else if (promiseStatus === "rejected") {
          reject(promiseValue);
        } else if (promiseStatus === "cancelled") {
          // 被取消
          reject(new CancelledError());
          cancelledCallbacks.forEach((cb) => cb());
        } else {
          // 反复检查 Promise 状态，setTimeout 防止页面被阻塞
          setTimeout(checkInner, 0);
        }
      }

      checkInner();
    });
  }

  const checkPromise = check();

  // 定义取消函数
  checkPromise.cancel = () => {
    promiseStatus = "cancelled";
  };
  return checkPromise;
}
```

使用方法：

```js
async function promise2() {
  const el = document.getElementById("status-2");

  el.textContent = "Loading...";

  const promise = cancellablePromisePlus(async (onCancel) => {
    onCancel(() => {
      console.log("promise 接收到取消信号");
    });
    const data = await fetchKleeProfile();
    return data;
  });
  window.cancelPromise2 = promise.cancel;

  try {
    // 可取消 Promise 创建完毕后这里和正常逻辑一样，没有特殊写法
    const data = await promise;
    console.log("[Promise2]", data);

    el.textContent = data;
  } catch (err) {
    console.error("[Promise2]", err);
    el.textContent =
      err instanceof CancelledError ? "Cancelled" : "Error";
  }
}

promise2();
```

**优点：**

- 当 Promise 被取消后能立即抛出异常，调用者能立即捕获到这个异常。
- 对 Promise 侵入性较弱。
- Promise 内部可接收到取消信号（可选），方便清理资源等操作。

**缺点：**

- 控制粒度不够小，也就是说就算取消了 Promise，如果 Promise 里头有很多异步操作，仍然不会暂停。虽然可以通过给每个最小的 Promise 都用上这个方法，但是很多 try...catch 太麻烦了。

**注意事项：**

可取消的 Promise 里面不要有太多异步操作，取消 Promise 本质上只是让调用者知道已经取消了从而停止后续动作，Promise 内部其实还是会一直往后执行的。

### 终极方案

这个方案基于上一个方法进行了改造，个人感觉非常不错，解决了控制粒度不够小的问题，而且是可选的：

```js
class CancellablePromiseHelper {
  constructor() {
    this.isCancelled = false;
    this._cancelCallbacks = new Set();
    this._currentCancelFn = null;
  }

  async callPromise(asyncFn, ...args) {
    if (this.isCancelled) {
      throw new CancelledError();
    }

    const p = cancellablePromisePlus(asyncFn, ...args);
    this._currentCancelFn = p.cancel;

    try {
      const res = await p;
      return res;
    } catch {
      throw new CancelledError();
    }
  }

  throwIfCancelled() {
    if (this.isCancelled) {
      throw new CancelledError();
    }
  }

  cancel() {
    if (this.isCancelled) {
      return;
    }
    this.isCancelled = true;
    this._cancelCallbacks.forEach((cb) => cb());
    this._currentCancelFn && this._currentCancelFn();
  }

  onCancel(callback) {
    this._cancelCallbacks.add(callback);
  }
}
```

使用方法：

```js
async function promise3() {
  const el = document.getElementById("status-3");
  el.textContent = "Loading...";

  const helper = new CancellablePromiseHelper();
  window.cancelPromise3 = helper.cancel.bind(helper);

  try {
    const data = await helper.callPromise(fetchKleeProfile);
    el.textContent = "Data fetch end";
    // 五秒后如果没取消就更新 DOM 内容
    await helper.callPromise(sleep, 5000);
    el.textContent = data;
  } catch (err) {
    console.error("[Promise3]", err);
    el.textContent =
      err instanceof CancelledError ? "Cancelled" : "Error";
  }
}

promise3();
```

如果想在 catch 块里面知道目前 Promise 是在哪里被取消的，稍微改造一下也很容易实现。