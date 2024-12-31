# Vue3 Pdf Viewer Plugin

Vue3 PDF Viewer is a lightweight Vue 3 plugin that allows embedding a PDF viewer in a Vue 3 project.

## Installation

Install via npm or yarn or pnpm:
```bash
npm install @vue3pdfcomponent/vue3-pdf-viewer@1.0.0
# or
yarn add @vue3pdfcomponent/vue3-pdf-viewer@1.0.0
# or
pnpm add @vue3pdfcomponent/vue3-pdf-viewer@1.0.0
```

## Usage
Import and register the plugin in main.js or main.ts:
```javascript
import { createApp } from 'vue'
import App from './App.vue'
import Vue3PdfViewer from "@vue3pdfcomponent/vue3-pdf-viewer";
import '@vue3pdfcomponent/vue3-pdf-viewer/dist/vue3-pdf-viewer.css'

const app = createApp(App)
app.use(Vue3PdfViewer)
app.mount('#app')
    

```
Then, you can use the <Vue3PdfViewer /&gt; component in your template:
```vue
<template>
  <div>
    <Vue3PdfViewer :pdfUrl="pdfUrl" />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const pdfUrl = ref('https://example.com/sample.pdf')
</script>
```
You can import { Vue3PdfViewer } from 'vue3-pdf-viewer' components in your component code.
```vue
import {Vue3PdfViewer} from "@vue3pdfcomponent/vue3-pdf-viewer";
import '@vue3pdfcomponent/vue3-pdf-viewer/dist/vue3-pdf-viewer.css'
```

# API

## Props

- `pdfUrl`(String Or Blob) : The URL or path to the PDF file.
- `search`(String) : The `search` property allows highlighting the selected content and scrolling the PDF to the page where the content is found.

## Event

- `loaded`: Emitted when the PDF file has been loaded successfully.
- `initLoad`: Emitted when the PDF file has been start loaded.
- `matchNotFound`: Emitted when no match is found in the PDF file's text content.

# Notes

- Make sure the provided PDF file URL is valid and allows cross-origin requests.
- Plugin Dependencies pdfjs-dist@4.9.155

# Contributing
If you'd like to contribute to this project, please fork the repository and submit a pull request.

