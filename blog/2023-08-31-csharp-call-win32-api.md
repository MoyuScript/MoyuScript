---
authors: MoyuScript
tags: 
  - 技术
  - 计算机科学
  - C#
  - .NET

---

# C#（.NET）调用 Win32 API 方法

最近学习 C# 学到了本机互操作性，之前一直有需求需要调用 [Win32 API](https://learn.microsoft.com/zh-cn/windows/win32/apiindex/windows-api-list)，查阅了许多资料踩了不少坑（如类型映射、封送结构等），现在整理出一套调用 Win32 API 的方法，因此记录一下顺便分享给大家参考。

<!--truncate-->

## 概念

*.NET 采用 **P/Invoke** 技术来从托管代码访问访问非托管库中的结构、回调和函数的一种技术，大多数 P/Invoke API 包含在以下两个命名空间中：`System` 和 `System.Runtime.InteropServices`。 使用这两个命名空间可提供用于描述如何与本机组件通信的工具（引用来源：[平台调用 (P/Invoke) | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/standard/native-interop/pinvoke)）。*

可以简单理解为 .NET 可以调用使用 C/C++ 开发的库中的函数，通常用于调用 [Win32 API](https://learn.microsoft.com/zh-cn/windows/win32/apiindex/windows-api-list)。

## 最小示例

以下是最小示例，下面示例中调用了 Win32 API 中的 [MessageBox](https://learn.microsoft.com/zh-cn/windows/win32/api/winuser/nf-winuser-messagebox) 函数，*该函数显示一个模式对话框，其中包含一个系统图标、一组按钮和一条简短的应用程序特定消息，例如状态或错误信息。 消息框返回一个整数值，指示用户单击的按钮（引用来源：[MessageBox 函数 (winuser.h) - Win32 apps | Microsoft Learn](https://learn.microsoft.com/zh-cn/windows/win32/api/winuser/nf-winuser-messagebox)）。*

示例来源：[平台调用 (P/Invoke) | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/standard/native-interop/pinvoke)。

```csharp
using System;
using System.Runtime.InteropServices;

public class Program
{
    // Import user32.dll (containing the function we need) and define
    // the method corresponding to the native function.
    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern int MessageBox(IntPtr hWnd, string lpText, string lpCaption, uint uType);

    public static void Main(string[] args)
    {
        // Invoke the function as a regular managed method.
        MessageBox(IntPtr.Zero, "Command-line message box", "Attention!", 0);
    }
}
```

> 上述示例非常简单，但确实演示了从托管代码调用非托管函数所需执行的操作。 让我们逐步分析该示例：
>
> - 第 2 行显示 `System.Runtime.InteropServices` 命名空间（用于保存全部所需项）的 using 语句。
> - 第 8 行引入 `DllImport` 属性。 此属性将告诉运行时应该加载非托管 DLL。 传入的字符串是目标函数所在的 DLL。 此外，它还指定哪些[字符集](https://learn.microsoft.com/zh-cn/dotnet/standard/native-interop/charset)用于封送字符串。 最后，它指定此函数调用 [SetLastError](https://learn.microsoft.com/zh-cn/windows/desktop/api/errhandlingapi/nf-errhandlingapi-setlasterror)，且运行时应捕获相应错误代码，以便用户能够通过 [Marshal.GetLastWin32Error()](https://learn.microsoft.com/zh-cn/dotnet/api/system.runtime.interopservices.marshal.getlastwin32error#system-runtime-interopservices-marshal-getlastwin32error) 检索它。
> - 第 9 行显示了 P/Invoke 的关键作用。 它定义了一个托管方法，该方法的签名与非托管方法**完全相同**。 可以看到，声明中包含一个新关键字 `extern`，告诉运行时这是一个外部方法。调用该方法时，运行时应在 `DllImport` 特性中指定的 DLL 内查找该方法。
>
> （引用来源：[平台调用 (P/Invoke) | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/standard/native-interop/pinvoke)）

示例代码运行后结果如下图：

![image-20230831105440580](https://pic.imgdb.cn/item/64f01b69661c6c8e54eb369e.png)

上面的解释中仍然存在一些疑惑，比如*“该方法的签名与非托管方法完全相同”*，但 C# 中的类型和 C/C++ 中的类型并不完全一样，那么应当是存在一套类型的转换方法，官网示例中并未提到该方法，下面我会为大家说明类型映射方法。

## 类型封送

C# 和 C/C++ 的类型并不完全一致，因此需要一套类型映射表来进行转换后再发送给 C/C++ 程序，这种技术叫做**类型封送（Type Marshalling）**，*封送是当类型需要在托管代码和本机代码之间切换时转换类型的过程。（引用来源：[类型封送 - .NET | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/standard/native-interop/type-marshalling)）*。

### 基本类型映射

对于 C/C++ 基本类型，官方给出了对应的 C# 类型映射表：

| C# 关键字 | .NET 类型                                                    | 本机类型                                                     |
| :-------- | :----------------------------------------------------------- | :----------------------------------------------------------- |
| `byte`    | `System.Byte`                                                | `uint8_t`                                                    |
| `sbyte`   | `System.SByte`                                               | `int8_t`                                                     |
| `short`   | `System.Int16`                                               | `int16_t`                                                    |
| `ushort`  | `System.UInt16`                                              | `uint16_t`                                                   |
| `int`     | `System.Int32`                                               | `int32_t`                                                    |
| `uint`    | `System.UInt32`                                              | `uint32_t`                                                   |
| `long`    | `System.Int64`                                               | `int64_t`                                                    |
| `ulong`   | `System.UInt64`                                              | `uint64_t`                                                   |
| `char`    | `System.Char`                                                | `char` 或 `char16_t` 依赖于 P/Invoke 或结构的 `CharSet`。 请参阅[字符集文档](https://learn.microsoft.com/zh-cn/dotnet/standard/native-interop/charset)。 |
|           | `System.Char`                                                | `char*` 或 `char16_t*` 依赖于 P/Invoke 或结构的 `CharSet`。 请参阅[字符集文档](https://learn.microsoft.com/zh-cn/dotnet/standard/native-interop/charset)。 |
| `nint`    | `System.IntPtr`                                              | `intptr_t`                                                   |
| `nuint`   | `System.UIntPtr`                                             | `uintptr_t`                                                  |
|           | .NET 指针类型（例如，`void*`）                               | `void*`                                                      |
|           | 从 `System.Runtime.InteropServices.SafeHandle` 派生的类型    | `void*`                                                      |
|           | 从 `System.Runtime.InteropServices.CriticalHandle` 派生的类型 | `void*`                                                      |
| `bool`    | `System.Boolean`                                             | Win32 `BOOL` 类型                                            |
| `decimal` | `System.Decimal`                                             | COM `DECIMAL` 结构                                           |
|           | .NET 委托                                                    | 本机函数指针                                                 |
|           | `System.DateTime`                                            | Win32 `DATE` 类型                                            |
|           | `System.Guid`                                                | Win32 `GUID` 类型                                            |

*（引用来源：[类型封送 - .NET | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/standard/native-interop/type-marshalling#default-rules-for-marshalling-common-types)）*

但 Win32 API 大部分类型并没有直接使用 C/C++ 基本类型，而是使用了 Windows 数据类型，对此官方也给出了封送常见 Windows 数据类型对应的 C# 类型表：

| Windows          | C#       |
| :--------------- | :------- |
| `BOOL`           | `int`    |
| `BOOLEAN`        | `byte`   |
| `BYTE`           | `byte`   |
| `UCHAR`          | `byte`   |
| `UINT8`          | `byte`   |
| `CCHAR`          | `byte`   |
| `CHAR`           | `sbyte`  |
| `CHAR`           | `sbyte`  |
| `INT8`           | `sbyte`  |
| `CSHORT`         | `short`  |
| `INT16`          | `short`  |
| `SHORT`          | `short`  |
| `ATOM`           | `ushort` |
| `UINT16`         | `ushort` |
| `USHORT`         | `ushort` |
| `WORD`           | `ushort` |
| `INT`            | `int`    |
| `INT32`          | `int`    |
| `LONG`           | `int`    |
| `LONG32`         | `int`    |
| `CLONG`          | `uint`   |
| `DWORD`          | `uint`   |
| `DWORD32`        | `uint`   |
| `UINT`           | `uint`   |
| `UINT32`         | `uint`   |
| `ULONG`          | `uint`   |
| `ULONG32`        | `uint`   |
| `INT64`          | `long`   |
| `LARGE_INTEGER`  | `long`   |
| `LONG64`         | `long`   |
| `LONGLONG`       | `long`   |
| `QWORD`          | `long`   |
| `DWORD64`        | `ulong`  |
| `UINT64`         | `ulong`  |
| `ULONG64`        | `ulong`  |
| `ULONGLONG`      | `ulong`  |
| `ULARGE_INTEGER` | `ulong`  |
| `HRESULT`        | `int`    |
| `NTSTATUS`       | `int`    |

*（表格来源：[本机互操作性最佳做法 - .NET | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/standard/native-interop/best-practices#common-windows-data-types)，内容略作调整修改）*

此外，Win32 API 中还有一些常见的指针类型，转换表如下：

| 已签名的指针类型（C# 中使用 `System.IntPtr` 或 `nint`） | 未签名的指针类型（C# 中使用 `System.UIntPtr` 或 `nuint`） |
| :------------------------------------------------------ | :-------------------------------------------------------- |
| `HANDLE`                                                | `WPARAM`                                                  |
| `HWND`                                                  | `UINT_PTR`                                                |
| `HINSTANCE`                                             | `ULONG_PTR`                                               |
| `LPARAM`                                                | `SIZE_T`                                                  |
| `LRESULT`                                               |                                                           |
| `LONG_PTR`                                              |                                                           |
| `INT_PTR`                                               |                                                           |

*（表格来源：[本机互操作性最佳做法 - .NET | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/standard/native-interop/best-practices#common-windows-data-types)，内容略作调整修改）*

#### 基本类型映射示例

以上面[最小示例](#最小示例)提到的 [MessageBox](https://learn.microsoft.com/zh-cn/windows/win32/api/winuser/nf-winuser-messagebox) 函数为例，它在 C++ 的签名如下：

```cpp
int MessageBox(
  [in, optional] HWND    hWnd,
  [in, optional] LPCTSTR lpText,
  [in, optional] LPCTSTR lpCaption,
  [in]           UINT    uType
);
```

经过查表得知，入参中的 `HWND` 对应 `System.IntPtr` 或 `nint`，`LPCTSTR` 貌似没有在表中找到，这里看上去应该用 `string`（对于找不到映射的类型，后面会介绍更方便的类型转换方法），`UINT` 对应 `int`，返回类型的 `int` 对应 `int`。

此外从 [MessageBox 函数 (winuser.h) - Win32 apps | Microsoft Learn](https://learn.microsoft.com/zh-cn/windows/win32/api/winuser/nf-winuser-messagebox#requirements) 要求部分可以得知，该函数存在于 `User32.dll` 文件中，因此使用 `DllImport` 特性第一个参数应当为 `user32.dll`（大小写不敏感）。

因此该签名转换为 C# 签名如下：

```csharp
[DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
private static extern int MessageBox(IntPtr hWnd, string lpText, string lpCaption, uint uType);
```

### 结构类型封送

有的时候，我们需要封送结构（struct）类型，此时会用到 [StructLayout](https://learn.microsoft.com/zh-cn/dotnet/api/system.runtime.interopservices.structlayoutattribute?view=net-7.0) 特性，使用方法如下：

```cpp
[DllImport("kernel32.dll")]
static extern void GetSystemTime(SystemTime systemTime);

[StructLayout(LayoutKind.Sequential)]
class SystemTime {
    public ushort Year;
    public ushort Month;
    public ushort DayOfWeek;
    public ushort Day;
    public ushort Hour;
    public ushort Minute;
    public ushort Second;
    public ushort Millisecond;
}

public static void Main(string[] args) {
    SystemTime st = new SystemTime();
    GetSystemTime(st);
    Console.WriteLine(st.Year);
}
```

*（代码来源：[类型封送 - .NET | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/standard/native-interop/type-marshalling#marshalling-classes-and-structs)）*

当然，官方示例代码中使用的 `class` 也是可以的，具体使用 `class` 还是 `struct` 可以根据实际需求决定。

### 指针类型处理

有的 Win32 API 会用到指针类型（通常以 `LP` 开头，具体以官方文档为准），C/C++ 中指针可以用于入参和出参，这两个需要在 C# 中特别处理。

#### 入参指针

入参指针对应 C# 中的 [in 关键字](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/keywords/in-parameter-modifier) 或 [ref 关键字](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/keywords/ref)，这两者均能正常工作，具体区别请查看官方文档，这里不作具体解释。

以 [TranslateMessage](https://learn.microsoft.com/zh-cn/windows/win32/api/winuser/nf-winuser-translatemessage) API 为例，它在 C/C++ 中的签名如下：

```cpp
BOOL TranslateMessage(
  [in] const MSG *lpMsg
);
```

这里的 `*lpMsg` 前有个指针符号 `*`，加上最前面的 `[in]`，说明它是入参指针，因此转换为 C# 签名如下：

```cpp
[DllImport("user32.dll", SetLastError = true)]
private static extern int TranslateMessage(in MSG lpMsg);
```

可以看到，`const MSG *lpMsg` 被转换为了 C# 中的 `in MSG lpMsg`。

#### 出参指针

出参（返回值）指针对应 C# 中的 [out](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/keywords/out-parameter-modifier) 关键字，以 [GetMessage](https://learn.microsoft.com/zh-cn/windows/win32/api/winuser/nf-winuser-getmessage) API 为例，它在 C/C++ 中的签名如下：

```cpp
BOOL GetMessage(
  [out]          LPMSG lpMsg,
  [in, optional] HWND  hWnd,
  [in]           UINT  wMsgFilterMin,
  [in]           UINT  wMsgFilterMax
);
```

这里的 `lpMsg` 入参前面有个 `[out]` 字样，说明它是出参指针，转换为 C# 签名如下：

```cpp
[DllImport("user32.dll", SetLastError = true)]
private static extern int GetMessage(out MSG lpMsg, nint hWnd, uint wMsgFilterMin, uint wMsgFilterMax);
```

可以看到，`LPMSG lpMsg` 参数在 C# 中被转换为了 `out MSG lpMsg`。

### 更简便方法

如果项目中要用到大量 Win32 API，每个签名都要自己写一遍确实是很麻烦，而且有的 C++ Windows 类型官方并没有给出 C# 中对应的类型映射（比如 `LPCTSTR`），这里有一个更简便的方法来编写签名：[pinvoke.net: the interop wiki!](http://pinvoke.net/index.aspx)。

该网站记录了大量的 Win32 API 在 C# 或 VB 中的签名，因此你可以直接复制过来使用，还是以 `MessageBox` 函数为例，我们在该网站左上角搜索该函数，然后在搜索结果中找到 `MessageBox` 函数并打开结果页：[pinvoke.net: MessageBox (user32)](http://pinvoke.net/default.aspx/user32/MessageBox.html)：

![image-20230831112024027](https://pic.imgdb.cn/item/64f01b69661c6c8e54eb36b2.png)

![image-20230831112036434](https://pic.imgdb.cn/item/64f01b69661c6c8e54eb36c2.png)

![image-20230831112103268](https://pic.imgdb.cn/item/64f01b69661c6c8e54eb36dc.png)

可以看到，在“C# Signature”中，已经帮我们写好了该 Win32 API 在 C# 中对应的签名，我们直接复制使用就可以了。

## 回调（委托）

有的 API 需要传入回调函数，这里应当使用 [delegate 关键字](https://learn.microsoft.com/zh-cn/dotnet/csharp/delegate-class) 来创建委托函数，如 [SetWindowsHookEx](https://learn.microsoft.com/zh-cn/windows/win32/api/winuser/nf-winuser-setwindowshookexa) 函数的参数 2 使用到了回调函数，类型为 [HookProc](https://learn.microsoft.com/zh-cn/windows/win32/api/winuser/nc-winuser-hookproc)，该函数 C++ 签名如下：

```cpp
LRESULT Hookproc(
       int code,
  [in] WPARAM wParam,
  [in] LPARAM lParam
)
```

转换为 C# 签名如下：

```cpp
delegate IntPtr HookProc(int code, IntPtr wParam, IntPtr lParam);
```

使用方法如下：

```cpp
// 签名定义
[DllImport("User32.dll", SetLastError = true)]
static extern nint SetWindowsHookEx(int hookType, HookProc lpfn, nint hMod, int dwThreadId);
delegate IntPtr HookProc(int code, IntPtr wParam, IntPtr lParam);

// 使用
HookProc callback = new((int code, nint wParam, nint lParam) =>
{
    // 具体代码实现省略
    return CallNextHookEx(0, code, wParam, lParam);
});
SetWindowsHookEx(14, callback, 0, 0);
```

当然，这个签名转换也能在 [pinvoke.net: HookProc (Delegates)](http://pinvoke.net/default.aspx/Delegates/HookProc.html) 中找到。

## 非托管内存管理

有的 API 需要操作内存，.NET 提供了 API 来操作非托管内存：[Marshal 类 (System.Runtime.InteropServices) | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/api/system.runtime.interopservices.marshal?view=net-7.0)。以[复制纯文本到剪贴板](https://learn.microsoft.com/zh-cn/windows/win32/dataxchg/using-the-clipboard#copying-information-to-the-clipboard)为例，示例代码请查看：[复制文本到剪贴板](#复制文本到剪贴板)。

## 示例

为方便大家理解，这里提供一些个人写的一些示例。

### 监控并打印光标位置

```cpp
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.Json.Serialization;

public class Program
{
    [StructLayout(LayoutKind.Sequential)]
    public record struct POINT(int X, int Y);
    [StructLayout(LayoutKind.Sequential)]
    public struct MSG
    {
        public nint hwnd;
        public int message;
        public int wParam;
        public int lParam;
        public int time;
        public POINT pt;
        public int lPrivate;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern int GetMessage(out MSG lpMsg, nint hWnd, uint wMsgFilterMin, uint wMsgFilterMax);
    [DllImport("user32.dll", SetLastError = true)]
    private static extern int TranslateMessage(in MSG lpMsg);
    [DllImport("user32.dll", SetLastError = true)]
    private static extern int DispatchMessage(in MSG lpMsg);

    delegate nint HookProc(int code, nint wParam, nint lParam);

    [DllImport("User32.dll", SetLastError = true)]
    static extern nint SetWindowsHookEx(int hookType, HookProc lpfn, nint hMod, int dwThreadId);

    [DllImport("user32.dll", SetLastError = true)]
    static extern bool UnhookWindowsHookEx(nint hhk);

    [DllImport("user32.dll")]
    static extern nint CallNextHookEx(nint hhk, int nCode, nint wParam, nint lParam);
    [StructLayout(LayoutKind.Sequential)]
    public struct MSLLHOOKSTRUCT
    {
        [JsonInclude]
        public POINT pt;
        [JsonInclude]
        public int mouseData;
        [JsonInclude]
        public int flags;
        [JsonInclude]
        public int time;
        public nuint dwExtraInfo;
    }

    public static void Main(string[] args)
    {
        HookProc callback = new((int code, nint wParam, nint lParam) =>
        {
            MSLLHOOKSTRUCT data = Marshal.PtrToStructure<MSLLHOOKSTRUCT>(lParam);
            Console.WriteLine(JsonSerializer.Serialize(data));
            return CallNextHookEx(0, code, wParam, lParam);
        });
        SetWindowsHookEx(14, callback, 0, 0);

        MSG msg;
        while (GetMessage(out msg, 0, 0, 0) > 0)
        {
            TranslateMessage(in msg);
            DispatchMessage(in msg);
        }
    }
}
```

### 复制文本到剪贴板

```cpp
using System.Runtime.InteropServices;
using System.Text;

public class Program
{
    [DllImport("user32.dll", SetLastError = true)]
    static extern bool OpenClipboard(IntPtr hWndNewOwner);
    [DllImport("user32.dll")]
    static extern bool EmptyClipboard();
    [DllImport("user32.dll", SetLastError = true)]
    static extern int SetClipboardData(int uFormat, IntPtr hMem);
    [DllImport("kernel32.dll")]
    static extern IntPtr GlobalLock(IntPtr hMem);
    [DllImport("kernel32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    static extern bool GlobalUnlock(IntPtr hMem);

    public static void Main()
    {
        // 复制当前时间到剪贴板，"\0"指示字符串结束
        string text = $"现在是北京时间 {DateTime.Now}\0";

        // 打开剪贴板
        if (!OpenClipboard(IntPtr.Zero))
        {
            Console.WriteLine("打开剪贴板失败。");
            return;
        }

        // 清空剪贴板
        EmptyClipboard();

        // 文本编码为 Unicode 字节数组
        var encoder = new UnicodeEncoding();
        byte[] buffer = encoder.GetBytes(text);

        // 分配内存
        var hglbCopy = Marshal.AllocHGlobal(buffer.Length);
        // 锁定内存
        var lptstrCopy = GlobalLock(hglbCopy);
        // 写入内存
        int offset = 0;
        foreach (var b in buffer)
        {
            Marshal.WriteByte(lptstrCopy, offset, b);
            offset++;
        }
        // 解锁内存
        GlobalUnlock(hglbCopy);
        // 设置剪贴板数据，13 指示格式为 Unicode 文本，枚举参考：https://learn.microsoft.com/zh-cn/windows/win32/dataxchg/standard-clipboard-formats#constants
        SetClipboardData(13, hglbCopy);
        // 释放内存
        Marshal.FreeHGlobal(hglbCopy);
    }
}
```

## 参考资料

- [平台调用 (P/Invoke) | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/standard/native-interop/pinvoke)
- [类型封送 - .NET | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/standard/native-interop/type-marshalling)
- [本机互操作性最佳做法 - .NET | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/standard/native-interop/best-practices)
- [pinvoke.net: the interop wiki!](http://pinvoke.net/index.aspx)
- [C# 参考 | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/)
- [Windows API 索引 - Win32 apps | Microsoft Learn](https://learn.microsoft.com/zh-cn/windows/win32/apiindex/windows-api-list)
- [.NET API 浏览器 | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/api/?view=net-7.0)