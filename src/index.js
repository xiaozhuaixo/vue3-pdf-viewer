import Vue3PdfViewer from "./components/PdfViewer.vue";

export default {
    install(app){
        app.component("Vue3PdfViewer", Vue3PdfViewer);
    }
}

export { Vue3PdfViewer }