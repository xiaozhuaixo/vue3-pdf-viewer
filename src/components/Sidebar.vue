<template>
    <div class="thumbnail-container"
    >
        <!-- Thumbnails would go here -->
        <div class="thumbnail"
             :style="{
                            width: showThumbnails ? '12rem' : '0',
                            opacity: showThumbnails ? '1' : '0'
                        }"
        >
            <div
                v-for="page in numPages"
                class="thumbnail-wrapper"
                :ref="el => {if(el) thumbnailRefs[page] = el}"
                :class="{'ring': currentPage === page}"
                @click="handleThumbnailsClick(page)"
            >
                <canvas
                    :id="`thumbnail-${page}`"
                    ref="thumbnails"
                    class="thumbnail-canvas"
                >
                </canvas>
                <div style="text-align: center;">{{page}}</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { inject, watch, ref } from 'vue'

const props = defineProps({
    fileLoaded: {
        type: Boolean,
        required: true,
    },
    numPages: {
        type: Number,
        required: true,
    },
    currentPage: {
        type: Number,
        required: true,
    },
    matchFoundPageNumber: {
        type: Number,
        required: true,
    },
    showThumbnails: {
        type: Boolean,
        required: true,
    }
})

const emits = defineEmits(['update:currentPage'])

const getPage = inject('getPage')
const goToPage = inject('goToPage')
let thumbnails = ref()
let thumbnailRefs = ref({})

watch(() => props.matchFoundPageNumber, (newPageNumber) => {
    if(props.showThumbnails && newPageNumber !== 0) {
        const thumbnailElement = thumbnailRefs.value[newPageNumber];
        const thumbnailContainer = thumbnailElement.closest(".thumbnail-container");
        if (thumbnailContainer) {
            const containerRect = thumbnailContainer.getBoundingClientRect();
            const elementRect = thumbnailElement.getBoundingClientRect();

            const scrollOffset = elementRect.top - containerRect.top + thumbnailContainer.scrollTop;

            thumbnailContainer.scrollTo({
                top: scrollOffset - containerRect.height / 2 + elementRect.height / 2,
                behavior: 'smooth',
            });
        }
    }
})

watch(() => props.fileLoaded, (newValue) => {
    if(newValue){
        loadThumbnails()
    }
})

const loadThumbnails = async () => {
    if(!getPage){
        return;
    }
    for(let i = 1 ; i <= props.numPages; i++){
        const page = await getPage(i);
        const thumbCanvas = thumbnails.value[i - 1];
        const thumbCtx = thumbCanvas.getContext('2d');
        const thumbScale = 0.2;
        const thumbViewport = page.getViewport({ scale: thumbScale });
        thumbCanvas.height = thumbViewport.height;
        thumbCanvas.width = thumbViewport.width;
        await page.render({
            canvasContext: thumbCtx,
            viewport: thumbViewport
        }).promise;
    }
}

const handleThumbnailsClick = (page) => {
    emits('update:currentPage', page)
    goToPage(page);
}

</script>

<style scoped>
.thumbnail-container{
    overflow-y: auto;
    overflow-x: hidden;
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;

}

.thumbnail{
    overflow-y: auto;
    padding: 1rem;
    width: 12rem;
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
    border-right: 1px solid #d1d5db;
}

.thumbnail-wrapper {
    transition: all 0.3s ease;
    margin-bottom: 1rem;
    padding: 0.5rem;
    background-color: rgb(255, 255, 255);
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.thumbnail-wrapper:hover {
    transform: translateY(-2px);
}

.ring{
    box-shadow: 0 0 0 2px #3b82f6;
}

.thumbnail-canvas {
    width: 100%;
    border-radius: 0.375rem;
}
</style>