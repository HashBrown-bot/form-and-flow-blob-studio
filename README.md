# Blob Studio / 造型实验室

一款受 [Blobmixer](https://blobmixer.14islands.com/) 启发的交互式 3D 造型编辑器，使用 React、Three.js 和 React Three Fiber 构建。项目中的造型、材质和动态效果是独立实现的视觉近似，与参考网站并不完全一致。

## 功能

- 14 个参考案例和一个原创透明果冻案例。
- 编辑形态、运动、表面、材质、透明度和灯光参数。
- 中英文切换、纯色背景和本地图片背景。
- 参数和自选图片保存在当前浏览器；切换案例会载入该案例的默认参数。

## 本地运行

需要 Node.js 20 或更新版本，以及 pnpm。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

在浏览器打开终端显示的地址。生成生产构建：

```sh
pnpm build
pnpm preview
```

构建产物位于 `dist/`。本项目默认部署在域名根路径；若部署到子路径，需相应调整 Vite 的 `base` 和 HDR 资源路径。

## 使用说明

使用画廊箭头、键盘方向键、滚轮或横向拖拽切换造型。点击“编辑这个造型”进入编辑模式，拖动模型可改变观察角度。“重置参数”恢复当前案例的默认值。自选背景图仅存储在当前浏览器，不会上传到服务器。

高细分可能影响部分设备的流畅度。透射材质会折射三维场景背景，HTML 界面文字不参与折射。

## 资源来源

环境光 HDRI 为 [Studio Small 08](https://polyhaven.com/a/studio_small_08)，作者 Sergej Majboroda，来自 Poly Haven，采用 [CC0](https://polyhaven.com/license) 许可；加载失败时使用程序化环境光。
