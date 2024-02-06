---
authors: MoyuScript
tags: 
  - 技术
  - 计算机科学
  - Unity
  - C#
image: https://pic.imgdb.cn/item/649266e61ddac507cc5bc824.jpg
---

# Unity 2048 小游戏制作技术细节

最近开始学习使用 Unity 了，之前看过一些 Unity 和 C# 相关的教程，已经有一定知识储备了，因此想找个游戏 DEMO 作为练手。

最开始本来想着直接上 3D 的，后面发现难度曲线太高，于是我选择了 2D 游戏作为熟悉 Unity 游戏基本开发流程，看了一圈后选择了使用 Unity 来制作比较久之前爆火的 2048 小游戏。本文主要是记录了下制作这个小游戏的一些学习心得和技术细节。

<!--truncate-->

项目地址：

<GitHubRepo repo="MoyuScript/unity-2048" />

## 核心玩法

该游戏通过 WASD 或者四个方向键进行操控，使所有方块向指定方向移动，遇到相同数字方块则进行合并操作，直到棋盘无法移动即游戏结束。

<video src={require('@site/static/assets/unity-2048-tech-detail/game-demo.mp4').default} muted controls />

## 开发细节

### 术语

为方便后续理解，这里定义一些术语：

- 棋盘：指容纳方块的棋盘，通常标准 2048 棋盘是 4*4 的大小。
- 方块：含有数字（2 的倍数）的方块。
- 虚拟棋盘：类似 MVVM 思想~~（学前端学的）~~，是一个项目为方块的二维数组，使用虚拟棋盘的目的是为了能判断游戏结束（只移动不提交）。

### 移动 & 合并算法

逻辑代码：[TileMapController.cs#L41-L113](https://github.com/MoyuScript/unity-2048/blob/88ccd7f9638ee310947775ea09e6c014d7b314da/Assets/Scripts/Commons/TileMapController.cs#L41-L113)

1. 使用虚拟棋盘（二维数组），在需要进行移动前复制一份虚拟棋盘。
2. 按需旋转二维数组，将向上、向右和向下转换为等效的向左移动，可简化代码逻辑。
3. 从上到下，从左到右遍历每个方块，将其不断向左移动，直到遇到墙壁、遇到不同数字的其他方块、遇到已合并过的其他方块时，停止移动，如果遇到相同数字的方块且未被标记为合并过时，进行合并操作（删除相邻方块、将自身数字翻倍、移动到相邻方块所在位置），然后将自身标记为已合并过，避免重复合并。
4. 删除后的相邻方块需要记录一下是被哪个方块删除的（使用一个 Dictionary），后续动画需要。
5. 遍历完成后，将棋盘旋转回原样。
6. 提交虚拟棋盘。

<video src={require('@site/static/assets/unity-2048-tech-detail/2048-algorithm.mp4').default} muted controls />

### 判断是否游戏结束

只需在上下左右四个方向进行虚拟棋盘的移动，如果移动后的虚拟棋盘均与移动前的虚拟棋盘相同，说明游戏结束。

### UI

UI 使用的是 UI Toolkit，这个貌似是 Unity 新出的一套 UI 工具，用起来和 HTML 很像，因此布局上对我来说没有太多困难。字体可以使用常用的 ttf、otf 字体，无需生成字体材质文件。

数据绑定的话我采用的是在单独一个 C# 脚本里写一个全局状态的类，然后重写属性的 get 和 set。当属性被修改时会发布一个 UnityEvent 事件，然后由 UI 去订阅这个事件再去更新状态。

这里是一个示例：[GlobalState.cs#L26-L37](https://github.com/MoyuScript/unity-2048/blob/88ccd7f9638ee310947775ea09e6c014d7b314da/Assets/Scripts/Commons/GlobalState.cs#L26-L37)。

### 方块文字

方块文字我使用的是 TextMeshPro（TMP），刚开始还不太会用，后面参考了这篇文章：[Unity游戏开发——TextMeshPro的使用 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/84700094)。

### 动画

方块移动和合并时都需要有动画，动画我使用的是 iTween 插件，这里不再赘述。
