# Photo Text Editor

A browser-based meme and image editor. It helps you to put text over any image and download the result as a JPG. Everything runs locally right in  browser without uploading your files. 

**Live demo:** https://paulmoskow.github.io/meme-editor/

## Features

- Load an image from your device, or paste it from the clipboard (Ctrl+V, or long-press and "Paste" on a mobile)
- Add text layers, resize and edit them 
- Change text, size and color 
- Text outline adapts for the color automatically: dark text gets a white outline, light text gets a black one
- Export to JPG with adjustable quality, in the original image resolution
- Responsive layout: side panel on desktop, icon toolbar on mobile

## Tech stack

React · TypeScript · Vite · Fabric.js

## Getting started

```bash
git clone https://github.com/paulmoskow/meme-editor.git
cd meme-editor
npm install
npm run dev
```

Other scripts:

```bash
npm run build     # type-check and build for production
npm run preview   # preview the production build locally
```

## Project structure

```
src/
  App.tsx            # assembles the editor
  components/        # Header, CanvasStage, EmptyState, DesktopTools, MobileBar
  hooks/             # useFabricCanvas, useImageInput, useTextLayer, useExport, useIsMobile
  utils/             # canvas size, clipboard parsing, color, download helpers
  constants.ts
  icons.tsx
```

<details>
<summary>Описание на русском</summary>

**Photo Text Editor** — веб-редактор для добавления подписей к изображениям прямо в браузере. Сделай собственный мем быстро и просто! Загрузи или вставь картинку, добавь текст и скачай результат в JPG. Всё работает в браузере, изображения никуда не надо отправлять.

**Возможности**

- Загрузка файла или вставка из буфера обмена (Ctrl+V; на телефоне долгое нажатие и «Вставить»)
- Текстовые слои: перетаскивание, изменение размера и правка прямо на холсте
- Размер и цвет текста; обводка подбирается автоматически
- Удаление текста по одному слою, затем самой картинки
- Экспорт в JPG с настройкой качества и в исходном разрешении
- Адаптивный интерфейс: боковая панель на десктопе и панель с иконками на телефоне

**Запуск:** `npm install`, затем `npm run dev`.

</details>