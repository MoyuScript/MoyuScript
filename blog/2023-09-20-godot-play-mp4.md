---
authors: MoyuScript
tags: 
  - 技术
  - Godot
  - 游戏开发
  - FFmpeg
  - 视频
  - 编码

---

# [Godot & C#] Godot 4 播放 MP4 文件的一种方法

众所周知，Godot 4 目前对于视频播放支持程度十分有限，从官网得知目前只能播放 Ogg Theora 格式（.ogv）的视频，因此我想到了一种方法来播放 MP4 视频，目前已经试验成功，这篇文章将会给大家分享一下我的解决办法。

<!-- truncate -->

## 起因

官方文档提到目前只能播放 ogv 格式的视频，我尝试将一个普通视频使用 FFmpeg 编码为 ogv 格式视频，发现该格式不仅编码速度极慢，编码出来的视频体积还非常大，而且解码起来还比较有压力。

此外，我把他导入 Godot 中，发现产生了严重的花屏现象（如下），不知道是不是我编码方式有问题，反正这个格式确实不太好用，还是有必要想办法支持一下 MP4。

![1](https://pic.imgdb.cn/item/650aa24ec458853aef5e2813.jpg)

## 解决思路

整体的解决思路如下：

1. 使用 FFmpeg API 循环读取视频每一帧的位图数据（bitmap）。
2. 使用 [ImageTexture](https://docs.godotengine.org/en/stable/classes/class_imagetexture.html)，将位图数据写入贴图。
3. 将贴图应用在 Node 上（对于 2D，可以使用 [TextureRect](https://docs.godotengine.org/en/stable/classes/class_texturerect.html)，只要能放贴图的 Node 都行）。

## 具体步骤

首先，新建工程并创建以下节点：

![image-20230920152031381](https://pic.imgdb.cn/item/650aa24ec458853aef5e283e.png)

然后给 Video 节点新建脚本（Attach Script），并通过 Visual Studio 打开项目的 sln 文件：

![image-20230920152148087](https://pic.imgdb.cn/item/650aa24fc458853aef5e285e.png)

打开 **Tools -> NuGet Package Manager -> Manage NuGet Packages for Solution**，搜索并添加依赖 **FFMediaToolkit**：

![image-20230920152332436](https://pic.imgdb.cn/item/650aa24fc458853aef5e286b.png)

Video 脚本代码如下：

```csharp
using FFMediaToolkit;
using FFMediaToolkit.Decoding;
using Godot;
using System;
using System.Linq;

public partial class Video : TextureRect
{
	[Export] public bool Playing = true;
	
	private float _fps;
	private float _timeCounter = 0;
	private int _frame = 0;
	private MediaFile _mediaFile;

	public override void _Ready()
	{
		// Load the media file
        // Usage of FFMediaToolkit please see: https://github.com/radek-k/FFMediaToolkit
        // Paths are defined at another script
		FFmpegLoader.FFmpegPath = Main.FFmpegPath;
		_mediaFile = MediaFile.Open(Main.VideoFilePath);

		_fps = (float)_mediaFile.Video.Info.AvgFrameRate;
	}

	void DrawImage(Image image)
	{
		// Update the texture
		if (Texture == null)
		{
			Texture = ImageTexture.CreateFromImage(image);
		}
		var texture = (ImageTexture)Texture;

		texture.Update(image);
	}

	bool DrawFrame(int frame)
	{
		// Get frame
		var hasMore = _mediaFile.Video.TryGetFrame(TimeSpan.FromSeconds(frame / _fps), out var videoFrame);
		if (!hasMore)
		{
			return false;
		}

		// Trim frame data buffer
		var buffer = videoFrame.Data.ToArray().Take(videoFrame.ImageSize.Width * videoFrame.ImageSize.Height * 3).ToArray();

		// Swap channel R and channel B, because frame uses Bgr
		for (int i = 0; i < buffer.Length; i += 3)
		{
			var r = buffer[i];
			var b = buffer[i + 2];

			buffer[i] = b;
			buffer[i + 2] = r;
		}

		var image = Image.CreateFromData(videoFrame.ImageSize.Width, videoFrame.ImageSize.Height, false, Image.Format.Rgb8, buffer);
		DrawImage(image);
		return true;
	}

	public override void _Process(double delta)
	{
		if (!Playing) return;

		// Ensure framerate same to video
		float secondPerFrame = 1.0f / _fps;
		_timeCounter += (float)delta;

		if (_timeCounter < secondPerFrame)
		{
			return;
		}

		// Draw frame
		bool hasMore = DrawFrame(_frame);

		if (!hasMore)
		{
			Playing = false;
			return;
		}
		_frame++;
		_timeCounter %= secondPerFrame;
	}
}

```

然后运行游戏，就可以正常播放视频了：

![image-20230920152928515](https://pic.imgdb.cn/item/650aa250c458853aef5e2882.png)

但会发现有轻微掉帧，因为我这个视频是 1080P 60FPS 的，实际使用时建议不要使用过高帧率的视频，对性能影响很大。

由于处理视频数据比较消耗性能，可以将处理代码新开一个线程运行（我使用的 Task）。

## 播放音轨

播放音轨目前我还没解决产生卡顿的问题，不过可以分享一下思路：

1. 添加一个 AudioStreamPlayer2D 节点。
2. Stream 属性使用 AudioStreamGenerator。
3. 脚本读取音频数据并持续写入 AudioStreamGenerator。

由于没有解决卡顿问题，因此这里不贴具体代码了。

## 结论

使用以上方法就可以播放 MP4（H.264/AVC1）编码的视频了，经过测试，貌似也能播放 WebM（视频编码 VP9）的视频了，这样就基本解决了视频播放问题，经过更好的封装可以封装成一个插件来使用，不过目前打算鸽了 23333。