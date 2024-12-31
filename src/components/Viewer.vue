<template>
    <div class="page-container"
         @scroll="handleScroll"
         ref="pdfContainer">
        <div
            v-for="page in numPages"
            :key="page"
            ref="pdfViewContainer"
            class="pdf-page-container"
            :style="{
                    width: `${pageWidth * scale}px`,
                    }"
        >
            <canvas
                :id="`page-${page}`"
                ref="pdfViewer"
                class="viewer-canvas"
                :style="{
                        width: `${pageWidth * scale}px`,
                        height: `${pageHeight * scale}px`,
                    }"
            >
            </canvas>
            <div
                :id="`text-content-${page}`"
                ref="textContent"
                class="text-content"
                :style="{
                                    width: `${pageWidth}px`,
                                    height: `${pageHeight}px`,
                                    transform: `scale(${scale})`,
                                    transformOrigin: 'top left',
                                    pointerEvents: 'none'
                                }"
            >
            </div>
            <div
                :id="`highlight-layer-${page}`"
                ref="highlightLayer"
                class="highlight-layer"
                :style="{
                                    width: `${pageWidth}px`,
                                    height: `${pageHeight}px`,
                                    transform: `scale(${scale})`,
                                    transformOrigin: 'top left'
                                }"
            >
            </div>
        </div>
    </div>
</template>

<script setup>
import {inject, ref, watch} from 'vue'

const props = defineProps({
    fileLoaded: {
        type: Boolean,
        required: true,
    },
    currentPage: {
        type: Number,
        required: true,
    },
    numPages: {
        type: Number,
        required: true,
    },
    scale: {
        type: Number,
        required: true,
    },
    matchFoundPageNumber: {
        type: Number,
        required: true,
    },
    matchFoundItems: {
        type: Array,
        required: true,
    }
})

const emits = defineEmits(['update:currentPage'])

const getPage = inject('getPage')

let pdfViewer = ref()
let pageWidth = ref(0)
let pageHeight = ref(0)
let pdfContainer = ref()
let textContent = ref()
let highlightLayer = ref()
watch(() => props.fileLoaded, (newValue) => {
    if(newValue){
        loadViewer()
    }
})

watch([() => props.matchFoundPageNumber, () => props.matchFoundItems], ([newPageNumber,newFoundItems], [oldPageNumber, oldFoundItems]) => {
    if(newPageNumber !== 0 && newFoundItems.length > 0){
        goToPage(newPageNumber)
        highlight(newPageNumber, newFoundItems)
    }
})


const loadViewer = async () => {
    for(let pageNum = 1; pageNum <= props.numPages; pageNum++){
        const page = await getPage(pageNum);
        const viewport = page.getViewport({ scale: 1 });

        const canvas = pdfViewer.value[pageNum - 1];
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (pageNum === 1) {
            pageWidth.value = viewport.width;
            pageHeight.value = viewport.height;
        }

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        const pageTextContent = await page.getTextContent();
        const textContentDiv = textContent.value[pageNum - 1];
        if(textContentDiv){
            textContentDiv.innerHTML = '';
            pageTextContent.items.forEach(item => {
                const tx = item.transform[4];
                const ty = pageHeight.value - item.transform[5];
                const fontSize = Math.sqrt((item.transform[0] * item.transform[0]) + (item.transform[1] * item.transform[1]));

                const textSpan = document.createElement('span');
                textSpan.textContent = item.str;
                textSpan.style.position = 'absolute';
                textSpan.style.left = `${tx}px`;
                textSpan.style.top = `${ty}px`;
                textSpan.style.fontSize = `${fontSize}px`;
                textSpan.style.fontFamily = item.fontName;
                textSpan.style.transform = `scaleY(${-1})`;
                textSpan.style.color = 'transparent';
                textSpan.style.cursor = 'text';
                textSpan.style.pointerEvents = 'auto';
                textSpan.style.userSelect = 'text';
                textSpan.style.webkitUserSelect = 'text';
                textSpan.dataset.text = item.str;

                textContentDiv.appendChild(textSpan);
            });
        }
    }
}

const handleScroll = () => {
    if(!pdfContainer.value){
        return;
    }

    const container = pdfContainer.value;
    const containerRect = container.getBoundingClientRect();
    const pageContainers = Array.from(container.children);

    let closestPage = 1;
    let minDistance = Infinity;

    pageContainers.forEach((pageContainer, index) => {
        const rect = pageContainer.getBoundingClientRect();
        const distance = Math.abs(rect.top - containerRect.top);
        if (distance < minDistance) {
            minDistance = distance;
            closestPage = index + 1;
        }
    });

    if(props.currentPage !== closestPage){
        emits('update:currentPage', closestPage);
    }
}

const goToPage = (pageNum) => {
    if(!pdfContainer.value){
        return;
    }
    const pageElement = pdfViewer.value[pageNum - 1];
    if(pageElement){
        const container = pdfContainer.value;
        const containerTop = container.getBoundingClientRect().top;
        const elementTop = pageElement.getBoundingClientRect().top;
        const currentScrollTop = container.scrollTop;
        const scrollToPosition = currentScrollTop + (elementTop - containerTop);
        container.scrollTo({
            top: scrollToPosition,
            behavior: 'smooth',
        });
    }
}

const getPdfContainerSize = () => {
    if(!pdfContainer.value){
        return;
    }
    return {
        width: pdfContainer.value.clientWidth,
        height:pdfContainer.value.clientHeight
    };
}

const highlight = (pageNumber, items) => {
    clearAllHighlights()
    const highlightLayerDiv = highlightLayer.value[pageNumber - 1];
    if(highlightLayerDiv){
        items.forEach((item) => {
            const tx = item.x;
            const ty = pageHeight.value - item.y;

            const highlight = document.createElement('div');
            highlight.style.position = 'absolute';
            highlight.style.left = `${tx}px`;
            highlight.style.top = `${ty}px`;
            highlight.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
            highlight.style.width = `${item.width}px`;
            highlight.style.height = `${item.height}px`;
            highlight.style.transform = `scaleY(-1)`;

            highlightLayerDiv.appendChild(highlight);
        })
    }
}

const clearAllHighlights = () => {
    highlightLayer.value.forEach(layer => {
        layer.innerHTML = ''
    })
}

defineExpose({
    goToPage,
    getPdfContainerSize,
    clearAllHighlights,
})
</script>

<style scoped>
.page-container {
    flex: 1; /* flex-1 */
    overflow-y: auto; /* overflow-y-auto */
    background-color: #e5e7eb; /* bg-gray-200 */
    padding: 1rem; /* p-4 */
}

.pdf-page-container {
    transition: all 0.3s ease-in-out;
    margin-left: auto;
    margin-right: auto;
    position: relative;
    margin-bottom: 1.25rem;
    background-color: #ffffff;
    border-radius: 0.375rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.pdf-page-container:hover {
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) !important;
}

.viewer-canvas{
    margin-left: auto;
    margin-right: auto;
    width: 100%;
    height: 100%;
    transition: transform 0.3s ease-in-out;
}

.pdf-page-container:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.text-content{
    position: absolute;
    top: -1rem;
    left: 0;
    right: 0;
    bottom: 0;
    user-select: text;
}

.highlight-layer{
    position: absolute;
    top: -0.75rem;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
}
</style>