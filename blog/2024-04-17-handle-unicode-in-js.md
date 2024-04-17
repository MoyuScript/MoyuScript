---
authors: MoyuScript
tags: 
  - 技术
  - 前端
  - Unicode
  - JavaScript
---

# JS 处理 Unicode 字符串时遇到的一些问题

在使用 JS 处理 Unicode 字符串时（如 Emoji），如果使用 `String.prototype.slice` 等自带的字符串方法，有可能会出现把 Unicode 字符截断一半导致编码出错的问题，因此需要深入了解 JS 字符串的存储方式和处理方式。

<!-- truncate -->

## 理论知识

首先，我们需要先了解一些关于 Unicode 的理论知识，

### 什么是 Unicode

[What is Unicode?](https://unicode.org/standard/WhatIsUnicode.html)

在早期，计算机中对于字符存储有不同的编码方式，不同计算机支持不同的编码方式，可能 A 计算机编码的字符，发给 B 计算机后就无法解读了，这就造成了一种混乱，因此，Unicode 应运而生（熟悉早期中文互联网的小伙伴可能会知道”锟斤拷“这个词的来源，其实一定程度上就是因为编码不统一造成的）。

**Unicode 是一种编码标准（而非实现）**，该标准包含了现今世界上几乎所有人类语言的字符，是目前使用最广泛的编码标准。你可以在[Unicode 15.1 Character Code Charts](https://www.unicode.org/charts/) 或 [List of Unicode Symbols](https://symbl.cc/en/unicode-table/) 中找到所有的 Unicode 字符。

### Unicode 编码方式

Unicode 采用**字符平面**对字符进行编码，每个字符占用 16~21 位。简单来说，就是不同字符在不同的编码空间，以下是几个常见的编码空间：

- 基本多文种平面（`0x0000` ~ `0xFFFF`），如基本拉丁文（比如英文字母、阿拉伯数字和一些基本符号）、中文汉字、日文平片假名等。
- 多文种补充平面（`0x10000` ~ `0x1FFFF`），如 Emoji 就在这个平面。

每个 Unicode 字符对应一个**码位（code point）**，通常用 `U+XXXX` （X 为十六进制）来表示。

更多信息可参考：[Unicode字符平面映射 - 维基百科](https://zh.wikipedia.org/wiki/Unicode%E5%AD%97%E7%AC%A6%E5%B9%B3%E9%9D%A2%E6%98%A0%E5%B0%84)。

### Unicode 实现方式

前面提到 Unicode 只是一个标准，而非实现，目前比较流行的几种编码实现方式主要有 UTF-8、UTF-16、UTF-32、GBK 等，其中，最常用的还是 UTF-8 和 UTF-16。

在 JS 中，字符串是以 UTF-16 进行存储的，可参考  [String - JavaScript | MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String#utf-16_%E5%AD%97%E7%AC%A6%E3%80%81unicode_%E7%A0%81%E4%BD%8D%E5%92%8C%E5%AD%97%E7%B4%A0%E7%B0%87)。因此，下面重点介绍一下 UTF-16 编码。

### UTF-16 编码

UTF-16 将 Unicode 字符编码成 2 个或 4 个 8 位字节，通常，我们以**码元（16 位字节）** 来定义，即 UTF-16 将 Unicode 的码位编码成 1 个或 2 个码元。下面是两种编码情况：

#### 一个码元

对于从 `U+0000` 至 `U+D7FF` 以及从 `U+E000` 至 `U+FFFF` 的码位（即基本多文种平面），直接用 Unicode 码点进行表示，无需任何转换。例如字符 `$ (U+0024)`，编码后的十六进制为 `0x0024`。

为什么 `U+D800` 至 `U+DFFF` 没被使用？因为这个范围的码位是为 UTF-16 保留的，用于识别 UTF-16 编码是不是两个码元的情况。

#### 两个码元

对于从 `U+10000` 到 `U+10FFFF` 的码位，UTF-16 使用两个码元来编码，编码方法如下：

> 1. 码位减去 `0x10000`，得到的值的范围为 20 比特长的 `0...0xFFFFF`。
> 2. 高位的 10 比特的值（值的范围为 `0...0x3FF`）被加上 `0xD800` 得到第一个码元或称作高位代理（high surrogate），值的范围是 `0xD800...0xDBFF`。
> 由于高位代理比低位代理的值要小，所以为了避免混淆使用，Unicode标准现在称高位代理为前导代理（lead surrogates）。
> 3. 低位的 10 比特的值（值的范围也是 `0...0x3FF`）被加上 `0xDC00` 得到第二个码元或称作低位代理（low surrogate），现在值的范围是 `0xDC00...0xDFFF`。
> 由于低位代理比高位代理的值要大，所以为了避免混淆使用，Unicode标准现在称低位代理为后尾代理（trail surrogates）。
>
> 来源：[UTF-16 - 维基百科](https://zh.wikipedia.org/wiki/UTF-16)

例如对于字符 `𐐷 (U+10437)` 的编码过程如下：

> 1. `0x10437` 减去 `0x10000`，结果为 `0x00437`，二进制为 `0000 0000 0100 0011 0111`。
> 2. 分割它的上 10 位值和下 10 位值（使用二进制）：`0000 0000 01` 和 `00 0011 0111`。
> 3. 添加 `0xD800` 到上值，以形成高位：`0xD800 + 0x0001 = 0xD801`。
> 4. 添加 `0xDC00` 到下值，以形成低位：`0xDC00 + 0x0037 = 0xDC37`。
>
> 来源：[UTF-16 - 维基百科](https://zh.wikipedia.org/wiki/UTF-16)

因此，最终编码结果为 `0xD801 0xDC37`。

#### 大小端

UTF-16 存在两种字节顺序：大端（UTF-16BE）和小端（UTF-16LE），需要在文件或文字符串流最开始的地方使用特殊字节标记，这个特殊字节标记被称为 **byte-order mark，BOM**。对于大端，使用 `0xFEFF`，对于小端，使用 `0xFFFE`。

例如字符 `$ (U+0024)`，编码后的十六进制为 `0x0024`，使用 UTF-16BE 时，文件十六进制是 `0xFEFF 0x0024`。使用 UTF-16LE 时，文件十六进制为 `0xFFFE 0x0024`。

## JS 中处理 Unicode

JS 中字符串是以 UTF-16BE 编码存储的，可以参考：[MDN - UTF-16 字符、Unicode 码位和字素簇](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String#utf-16_%E5%AD%97%E7%AC%A6%E3%80%81unicode_%E7%A0%81%E4%BD%8D%E5%92%8C%E5%AD%97%E7%B4%A0%E7%B0%87)。

一些常用的字符串方法（如 `split`、`slice`，以及获取字符串长度的 `length` 属性），都是基于码元进行处理的，通常对于基本多文种平面（`U+0000` ~ `U+FFFF`，占用一个码元）的字符来说，是没有问题的，但对于其他平面（`U+10000` ~ `U+10FFFF`，占用两个码元）的字符，使用这些方法进行处理就会出现错误（比如使用 `slice` 截取字符串，可能会把两个码元的字符截了一半）。

因此如果要优雅处理 Unicode 字符串，需要自行对每个 Unicode 码位进行处理，接下来先介绍一下四个方法。

### charCode 和 codePoint

下面例子均以字符串 `str = "klee嘟🍀嘟🍀可🍀"` 为例，UTF16-BE 十六进制为：

```plaintext
k   0x006b
l   0x006c
e   0x0065
e   0x0065
嘟  0x561f
🍀  0xd83c 0xdf40
嘟  0x561f
🍀  0xd83c 0xdf40
可  0x53ef
🍀  0xd83c 0xdf40
```

#### charCodeAt 和 fromCharCode

charCode 的两个方法处理的单位是 **UTF-16 码元**，即两个 8 位字节，共有两个方法：[charCodeAt](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt) 和 [fromCharCode](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/fromCharCode)。

- `str.charCodeAt(index: number)`：获取字符串指定索引处的 **UTF-16 码元值**，如 `str.charCodeAt(0)` 的值是 `0x6b`，
`str.charCodeAt(5)` 的值是 `0xd83c`，`str.charCodeAt(6)` 的值是 `0xdf40`。
- `String.fromCharCode(charCode: number)`：从指定 **UTF-16 码元值** 生成字符，如 `String.fromCharCode(0x6b)` 的值是 `"k"`，
`String.fromCharCode(0x561f)` 的值是 `"嘟"`，`String.fromCharCode(0xd83c)` 的值是 `"\ud83c"`，
`String.fromCharCode(0xd83cdf40)` 的值是 `"\udf40"`。因为处理单位是码元，所以无法处理超过 `0xFFFF` 的码位（非基本多文种平面）。

#### codePointAt 和 fromCodePoint

charCode 的两个方法处理的单位是 **Unicode 码位值**，共有两个方法：[codePointAt](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt) 和 [fromCodePoint](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint)。

- `str.codePointAt(index: number)`：获取字符串指定索引处的 **Unicode 码位值**，如 `str.codePointAt(0)` 的值是 `0x6b`，
`str.codePointAt(5)` 的值是 `0x1f340`（UTF-16BE 编码下的 `0xd83c 0xdf40` 转换为 Unicode 码位值就是 `0x1f340`），`str.codePointAt(6)` 的值是 `0xdf40` （因为[如果 index 处的元素是一个 UTF-16 后尾代理（trailing surrogate），则只返回后尾代理的码元。](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt)）
- `String.fromCodePoint(codePoint: number)`：从指定 **Unicode 码位值** 生成字符，如 `String.fromCodePoint(0x6b)` 的值是 `"k"`，
`String.fromCodePoint(0x561f)` 的值是 `"嘟"`，`String.fromCodePoint(0x1f340)` 的值是 `"🍀"`。

### 实战代码

这里会以几个例子来处理 Unicode。

#### 按 Unicode 码位分割字符

```javascript
// 普通分割，会以码元为单位分割
function stringSplit(str) {
  return str.split('');
}

// 按 Unicode 码位分割
function unicodeSplit(str) {
  const arr = [];
  let index = 0;

  while (index < str.length) {
    const codePoint = str.codePointAt(index);
    let char = str[index];

    // 如果 codePoint >= 0x10000，说明是两个码元的字符
    if (codePoint >= 0x10000) {
      char += str[index + 1];
    }

    index += char.length;
    arr.push(char);
  }

  return arr;
}

const text = 'klee嘟🍀嘟🍀可🍀';

console.log(stringSplit(text)); // ["k","l","e","e","嘟","\ud83c","\udf40","嘟","\ud83c","\udf40","可","\ud83c","\udf40"]
console.log(unicodeSplit(text)); // ["k","l","e","e","嘟","🍀","嘟","🍀","可","🍀"]
```

#### 计算 Unicode 字符串长度

```javascript
const text = 'klee嘟🍀嘟🍀可🍀'; // 视觉上长度应该是 10
console.log(text.length); // 13（因为字符“🍀”占了两个码元，length 是按码元数计算的）
console.log(unicodeSplit(str).length); // 10
```

#### 截断 Unicode 字符串

```javascript
const text = 'klee嘟🍀嘟🍀可🍀';
console.log(text.slice(0, 6)); // klee嘟�（截断错误，把“🍀”截了一半）
console.log(unicodeSplit(text).slice(0, 6).join('')); // klee嘟🍀
```

## 参考资料

- [What is Unicode? - unicode.org](https://unicode.org/standard/WhatIsUnicode.html)
- [Unicode - 维基百科](https://zh.wikipedia.org/wiki/Unicode)
- [Unicode字符平面映射 - 维基百科](https://zh.wikipedia.org/wiki/Unicode%E5%AD%97%E7%AC%A6%E5%B9%B3%E9%9D%A2%E6%98%A0%E5%B0%84)
- [UTF-16 - 维基百科](https://zh.wikipedia.org/wiki/UTF-16)
- [String - JavaScript | MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String#utf-16_%E5%AD%97%E7%AC%A6%E3%80%81unicode_%E7%A0%81%E4%BD%8D%E5%92%8C%E5%AD%97%E7%B4%A0%E7%B0%87)
