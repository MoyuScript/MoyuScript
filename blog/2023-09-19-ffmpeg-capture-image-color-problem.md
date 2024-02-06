---
authors: MoyuScript
tags: 
  - 技术
  - FFmpeg
  - 视频
  - 编码
---

# FFmpeg 视频截取图片出现色差解决办法和过程

最近从群友（[@-星の忆-](https://space.bilibili.com/228292951)）那得到一个问题，他从 Adobe Premiere（下称 PR）中从视频导出的图片和使用 FFmpeg 截取的图片有轻微色差，我对这个问题十分甚至九分感兴趣啊，因此花了 114 分钟排查了下这个问题最终并找到解决方案。

<!-- truncate -->

## 问题描述

PR 中导出的图，人物头发阴影处 RGB 值中的 R 基本在 251 左右，如下图所示（可以直接使用屏幕取色器查看色值）：

![image-20230919193952094](https://pic.imgdb.cn/item/65098d9bc458853aef2c06ed.png)

但使用命令 `ffmpeg -i source.mp4 -frames:v 1 out.png` 导出的图片，R 却在 245 左右，整体显得偏暗：

![image-20230919194110544](https://pic.imgdb.cn/item/65098d9bc458853aef2c0798.png)

## 问题原因

推测原因是视频的元数据（使用 `ffprobe -show_streams source.mp4` 查看）没有定义 `color_space`（色彩空间），而输出的是图片，FFmpeg 可能使用了输出文件（图片）默认的色彩空间（即 rgb）作为输入文件（视频）的色彩空间。由于输入色彩空间有误，因此导致了色差的产生。

![image-20230919195109795](https://pic.imgdb.cn/item/65098d9bc458853aef2c07f4.png)

## 问题解决

解决方案有两种：

1. 【最简单】手动定义输入视频的色彩空间，命令如下：`ffmpeg -colorspace bt709 -i source.mp4 -frames:v 1 out.png`。
2. 输入视频元数据需要带上色彩空间信息，使用 FFmpeg 编码命令如下：`ffmpeg -i .\source.mp4 -colorspace bt709 out.mp4`

对视频编码后元数据中就带上了色彩空间信息：

![image-20230919195201158](https://pic.imgdb.cn/item/65098d9bc458853aef2c080b.png)

## 排查过程

因为最终显示效果是有色差，因此直接考虑可能是色彩空间出了问题，中途进行的尝试：

1. 输出 JPG、BMP 图片测试（排除图片格式问题）。
2. 使用其他软件截图测试（如 PotPlayer，排除软件问题）。
3. 将 `-colorspace bt709` 参数定义在输出图片前测试（被静默失败误导了，貌似没有作用）。