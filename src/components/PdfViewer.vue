<template>
    <div class="pdf-container">
        <div class="toolbar">
            <Toolbar
                v-model:current-page="currentPage"
                :num-pages="numPages"
                v-model:scale="scale"
                @search="handleSearch"
            />
        </div>
        <div class="main-content">
            <Sidebar
                :fileLoaded="fileLoaded"
                :num-pages="numPages"
                v-model:currentPage="currentPage"
                :matchFoundPageNumber="matchFoundPageNumber"
                :showThumbnails="showThumbnails"
            />
            <Viewer
                :num-pages="numPages"
                v-model:currentPage="currentPage"
                :fileLoaded="fileLoaded"
                :scale="scale"
                ref="pdfViewer"
                :matchFoundPageNumber="matchFoundPageNumber"
                :matchFoundItems="matchFoundItems"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, provide, watch } from 'vue'
import {getDocument} from "pdfjs-dist/build/pdf.mjs";
import "pdfjs-dist/build/pdf.worker.min.mjs";
import Toolbar from './Toolbar.vue'
import Sidebar from './Sidebar.vue'
import Viewer from './Viewer.vue'

const props = defineProps({
    pdfUrl: {
        type: [ArrayBuffer, String],
        required: true,
    },
    search: {
        type: String,
        required: false,
    }
})

watch(() => props.search, (newVal) => {
    if(newVal && newVal !== ''){
        handleSearch(newVal)
    }
})

const emits = defineEmits(['loaded', 'initLoad', 'matchNotFound'])

let currentPage = ref(0)
let numPages = ref(0)
let scale = ref(1.5)
let fileLoaded = ref(false)
let pdfViewer = ref()
let matchFoundPageNumber = ref(0)
let matchFoundItems = ref([])
let currentMatchIndex = 0;
let showThumbnails = ref(true)
let recordText = '';
let pdf;


const loadFile = async () => {
    if(!props.pdfUrl){
        console.error("PDF File Must Be ArrayBuffer Or String");
        return;
    }
    emits('initLoad')
    let loadTasking = getDocument(props.pdfUrl);
    pdf = await loadTasking.promise
    currentPage.value = 1
    numPages.value = pdf.numPages
    emits('loaded')
    fileLoaded.value = true;
}

const getPage = async(pageNumber) => {
    return await pdf.getPage(pageNumber)
}

const goToPage = (pageNum) => {
    currentPage.value = pageNum
    pdfViewer.value.goToPage(pageNum)
}

const getPdfContainerSize = () => {
    return pdfViewer.value.getPdfContainerSize();
}

const getViewport = async () => {
    const page = await pdf.getPage(currentPage.value)
    return page.getViewport({ scale: 1 });
}

const handleSearch = async (searchText) => {

    if(recordText !== searchText){
        matchFoundPageNumber.value = 0;
        currentMatchIndex = 0;
        recordText = searchText
    }
    const matchs = await matchText(searchText)

    if(matchs && matchs.length > 0){
        let resultMatchs = []
        for(let i = 0; i < matchs.length; i++){
            let pageNumber = matchs[i].pageNumber;
            let matchedItems = matchs[i].matchedItems;
            if(pageNumber && matchedItems.length > 0){
                resultMatchs.push({
                    pageNumber: pageNumber,
                    matchedItems: matchedItems,
                })
            }
        }
        matchFoundPageNumber.value = resultMatchs[currentMatchIndex].pageNumber;
        matchFoundItems.value = resultMatchs[currentMatchIndex].matchedItems;
        currentMatchIndex = (++currentMatchIndex) % resultMatchs.length;
    }else{
        pdfViewer.value.clearAllHighlights()
        emits('matchNotFound')
    }
}

const matchText = async (text) => {
    const pageNumbers = [...Array(pdf.numPages + 1).keys()].slice(1);

    const pageContentPromises = pageNumbers.map(
        async (pageNumber) => {
            const page = await pdf.getPage(pageNumber);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join('');
            const itemsWithPosition = textContent.items.map((item) => {
                const transform = item.transform;
                const [scaleX, skewX, skewY, scaleY, x, y] = transform;
                const width = item.width;
                const height = item.height || Math.abs(scaleY);

                return {
                    text: item.str,
                    x,
                    y,
                    width,
                    height,
                    pageNumber,
                };
            });
            return { pageText, pageNumber, itemsWithPosition };
        });
    const pageContents = await Promise.all(pageContentPromises);

    let offset = 0
    const fullText = pageContents.map((page) => page.pageText).join('');
    const pageOffsets = pageContents.map((page) => {
        const currentOffset = offset;
        offset += page.pageText.length;
        return currentOffset;
    });
    let regexPattern = text.replace(/[^a-zA-Z\u4e00-\u9fa5]/g, "");

    const pattern = new RegExp(regexPattern.split("").join("[^a-zA-Z\u4e00-\u9fa5]*"), "i");
    const match = fullText.match(pattern);
    if (match) {
        const matchStart = match.index;
        const matchEnd = matchStart + match[0].length;

        const matchedPages = pageOffsets.reduce((acc, startOffset, pageIndex) => {
            const endOffset = pageOffsets[pageIndex + 1] || fullText.length;
            if (matchStart < endOffset && matchEnd > startOffset) {
                const itemsWithPosition = pageContents[pageIndex].itemsWithPosition;
                const matchedItems = itemsWithPosition.filter((item) => {
                    const itemStart = fullText.indexOf(item.text, startOffset);
                    const itemEnd = itemStart + item.text.length;
                    return itemStart < matchEnd && itemEnd > matchStart;
                }).map((item) => {
                    const itemStart = fullText.indexOf(item.text, startOffset);
                    const overlapStart = Math.max(matchStart, itemStart);
                    const overlapEnd = Math.min(matchEnd, itemStart + item.text.length);
                    const matchedText = fullText.substring(overlapStart, overlapEnd);

                    return {
                        ...item,
                        matchedText,
                    };
                });
                acc.push({
                    pageNumber: pageIndex + 1,
                    matchText: fullText.substring(
                        Math.max(matchStart, startOffset),
                        Math.min(matchEnd, endOffset)
                    ),
                    matchedItems
                });
            }
            return acc;
        }, []);
        return matchedPages;
    }

    return null;
}

const setThumbnails = (menuHidden) => {
    showThumbnails.value = menuHidden;
}

provide('getPage', getPage)
provide('goToPage', goToPage)
provide('getPdfContainerSize', getPdfContainerSize)
provide('getViewport', getViewport)
provide('setThumbnails', setThumbnails)

onMounted(async () => {
    await loadFile()
})
</script>

<style scoped>
.pdf-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 16px;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
}

.main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
    background-color: rgb(229, 231, 235);
}

canvas {
    display: block;
    transition: all 0.3s ease-in-out;
}
</style>