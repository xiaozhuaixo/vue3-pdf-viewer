import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    build: {
        lib: {
            entry: './src/index.js',
            name: 'Vue3PdfViewer',
            fileName: (format) => `vue3-pdf-viewer.${format}.js`,
        },
        rollupOptions: {
            external: ['vue'], // 避免将 Vue 打包到库中
            output: {
                globals: {
                    vue: 'Vue',
                },
            },
        },
    },
    plugins: [vue()],
});