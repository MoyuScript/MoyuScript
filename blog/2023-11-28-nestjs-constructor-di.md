---
authors: MoyuScript
tags: 
  - 技术
  - 前端
  - NestJS
  - Typescript
---

# NestJS 中根据 Controller 的构造函数参数自动注入 Provider 的方法研究（Typescript）

最近在学习 [NestJS](https://nestjs.com/) 时发现他能通过检测 Controller 构造函数参数自动注入正确的 Provider，这和我之前对 TS 的认知不符（之前认为 TS 不支持通过反射去获取类型），经过研究发现它其实是利用到了一个 TS 实验特性来实现的，本文将记录一下相关方法。

<!-- truncate -->

## NestJS 的自动注入表现

[![Edit nice-glitter-rf6hyj](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/p/devbox/nice-glitter-rf6hyj?embed=1&file=%2Fsrc%2Fapp.controller.ts)

我们在官方例子的基础上新增一个 Service，我这里命名为 `gacha.service.ts`，并在 `app.module.ts` 中的 `providers` 进行注册，然后在 `app.controller.ts` 中的构造函数第二个参数进行定义：

```typescript
// gacha.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class GachaService {
  gacha() {
    return Math.random();
  }
}
```

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GachaService } from './gacha.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, GachaService],
})
export class AppModule {}
```

```typescript
// app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { GachaService } from './gacha.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly gachaService: GachaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('gacha')
  gacha() {
    return this.gachaService.gacha();
  }
}
```

运行后访问 <http://localhost:3000/gacha>，能正常输出随机数。

然后我们将 `app.controller.ts` 中构造函数的参数 1 和参数 2 交换位置：

```typescript
// app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { GachaService } from './gacha.service';

@Controller()
export class AppController {
  constructor(
    private readonly gachaService: GachaService,
    private readonly appService: AppService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('gacha')
  gacha() {
    return this.gachaService.gacha();
  }
}
```

重启应用，发现即使我们交换了参数的位置，路由仍然生效，这说明 NestJS 并不是按照 Provider 注册顺序进行传递参数的。然后我们试着把其中一个参数的类型改为 `any`：

```typescript
// app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { GachaService } from './gacha.service';

@Controller()
export class AppController {
  constructor(
    private readonly gachaService: any,
    private readonly appService: AppService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('gacha')
  gacha() {
    return this.gachaService.gacha();
  }
}
```

再次运行却发现报错了，这说明 NestJS 肯定是通过了某种方法来获取构造函数参数的类型定义。按照以往的认知，TS 应该是不支持运行时去获取 TS 的类型定义的（类似 Java、C# 的反射），但这里却可以这么做。

## 实现原理

经过一番研究，发现其实 NestJS 是用到了 TS 的一个实验特性：[emitDecoratorMetadata](https://www.typescriptlang.org/tsconfig#emitDecoratorMetadata)，可以在工程的 `tsconfig.json` 中找到。开启这个选项后，TS 在生成使用了装饰器的代码的时候会一并生成相关类型的元数据（类型、参数类型、返回值类型），配合 [reflect-metadata](https://www.npmjs.com/package/reflect-metadata) NPM 库可以获取到这些类型。

我们新建一个 TS 工程进行测试（新建过程省略），安装依赖 [reflect-metadata](https://www.npmjs.com/package/reflect-metadata)，并在 `tsconfig.json` 中打开 `experimentalDecorators` 和 `emitDecoratorMetadata`：

```json
// tsconfig.json
{
    "compilerOptions": {
        "experimentalDecorators": true,
    	"emitDecoratorMetadata": true
    }
}
```

然后新建 `index.ts` 文件，粘贴以下代码并使用 [ts-node](https://www.npmjs.com/package/ts-node) 直接运行：

```typescript
// index.ts
// 需要引入这个库才能使用 Reflect.getMetadata
import 'reflect-metadata'

function TestClassDecorator(target: Function) {
    console.log('类', target.name, '构造函数参数列表', Reflect.getMetadata('design:paramtypes', target))
}

function TestMethodDecorator(target: any, propertyKey: string) {
    console.log('方法', propertyKey, '返回值类型：', Reflect.getMetadata('design:returntype', target, propertyKey))
}

@TestClassDecorator
class TestClass {
    
    constructor(public a: string) {}

    @TestMethodDecorator
    method(b: number): number { return 1; }
}
```

得到以下输出：

```
方法 method 返回值类型： [Function: Number]
类 TestClass 构造函数参数列表 [ [Function: String] ]
```

然后可以使用命令 `tsc` 输出 js 文件，查看输入的 `index.js` 文件内容：

```javascript
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
function TestClassDecorator(target) {
    console.log('类', target.name, '构造函数参数列表', Reflect.getMetadata('design:paramtypes', target));
}
function TestMethodDecorator(target, key) {
    console.log('方法', key, '类型：', Reflect.getMetadata('design:type', target[key]));
}
let TestClass = class TestClass {
    constructor(a) {
        this.a = a;
    }
    method() { return 1; }
};
__decorate([
    TestMethodDecorator,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Number)
], TestClass.prototype, "method", null);
TestClass = __decorate([
    TestClassDecorator,
    __metadata("design:paramtypes", [String])
], TestClass);
```

可以发现输出的文件中通过 `__metadata` 方法将 TS 类型元数据关联到了对应类/方法，因此我们便可以在运行时获取到他们的类型。

## 参考资料

+ [TypeScript 装饰器和依赖注入实现 - 掘金 (juejin.cn)](https://juejin.cn/post/7182514433233518629)
+ [NestJS Metadata Deep Dive - Trilon Consulting](https://trilon.io/blog/nestjs-metadata-deep-dive)