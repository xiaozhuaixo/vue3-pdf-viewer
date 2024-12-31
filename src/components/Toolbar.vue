<template>
    <div class="toolbar-group">
        <button class="button"
                :class="{'menu-icon': !menuHidden}"
                @click="handleMenuClick"
        >≡</button>
        <button class="button"
                :disabled="currentPage === 1"
                @click="emits('update:currentPage', props.currentPage - 1)"
        >←</button>
        <span>Page {{currentPage}} of {{numPages}}</span>
        <button class="button"
                :disabled="currentPage === numPages"
                @click="emits('update:currentPage', props.currentPage + 1)"
        >→</button>
    </div>
    <div class="toolbar-group">
        <button class="button"
                @click="zoomOut"
                :disabled="currentScaleIndex === 0"
        >-</button>
        <select class="button"
                @change="handleScaleChange($event.target.value)"
                :value="scale">
            <option
                v-for="scaleMode in scaleModes"
                :value="scaleMode.value"
            >
                {{scaleMode.label}}
            </option>
        </select>
        <button class="button"
                @click="zoomIn"
                :disabled="currentScaleIndex === scaleModes.length - 1"
        >+</button>
    </div>
    <div class="toolbar-group">
        <div class="search-toolbar">
            <input type="text" class="search-box"
                   v-model="searchText"
                   @keydown.enter="handleSearch"
                   placeholder="Search...">
            <button class="button" @click="handleSearch">🔍</button>
        </div>
        <button class="button">⬇</button>
    </div>
</template>

<script setup>
import { ref, inject } from 'vue'

const props = defineProps({
    currentPage: {
        type: Number,
        required: true,
        default: 0
    },
    numPages: {
        type: Number,
        required: true,
        default: 0
    },
    scale: {
        type: Number,
        required: true,
    }
})

const emits = defineEmits(["update:currentPage", 'update:scale', 'search'])

const getPdfContainerSize = inject('getPdfContainerSize')
const getViewport = inject('getViewport')
const setThumbnails = inject('setThumbnails')

let scaleModes = [
    {
        label: 'Auto',
        value: 'auto'
    },
    {
        label: 'Page-Width',
        value: 'page-width',
    },
    {
        label: 'Page-Fit',
        value: 'page-fit',
    },
    {
        label: '50%',
        value: '0.5',
    },
    {
        label: '75%',
        value: '0.75',
    },
    {
        label: '100%',
        value: '1',
    },
    {
        label: '125%',
        value: '1.25',
    },
    {
        label: '150%',
        value: '1.5',
    },
    {
        label: '175%',
        value: '1.75',
    },
    {
        label: '200%',
        value: '2',
    },
    {
        label: '300%',
        value: '3',
    },
    {
        label: '400%',
        value: '4',
    }
]
let scale = ref('auto')
let currentScaleIndex = ref(0)
let menuHidden = ref(true)
let searchText = ref('')

const handleMenuClick = () => {
    menuHidden.value = !menuHidden.value
    setThumbnails(menuHidden.value)
}

const handleScaleChange =  (value) => {
    let emitScale = 0;
    if (value === 'auto') {
        emitScale = 1.5
    } else if (value === 'page-width') {
        emitScale = getPageWidthScale()
    } else if (value === 'page-fit') {
        emitScale = getPageHeightScale()
    } else {
        emitScale = value * 1;
    }
    emits('update:scale', emitScale)
    scale.value = value;
}

const getPageWidthScale = async () => {
    let containerWidth = getPdfContainerSize().width - 96;
    const viewport = await getViewport()
    return containerWidth / viewport.width
}

const getPageHeightScale = async () => {
    let containerWidth = getPdfContainerSize().height - 96;
    const viewport = await getViewport()
    return containerWidth / viewport.height
}

const zoomIn = async () => {
    currentScaleIndex.value++;
    scale.value = scaleModes[currentScaleIndex.value].value
    let resultScale = await scaleModeConvert()
    emits('update:scale', resultScale)
}

const zoomOut = async () => {
    currentScaleIndex.value--;
    scale.value = scaleModes[currentScaleIndex.value].value
    let resultScale = await scaleModeConvert()
    emits('update:scale', resultScale)
}

const scaleModeConvert = async () => {
    if(scale.value === 'auto') {
        return 1.5;
    }else if(scale.value === 'page-width') {
        return await getPageWidthScale()
    }else if(scale.value === 'page-fit') {
        return await getPageHeightScale()
    }else{
        return scale.value * 1;
    }
}

const handleSearch = () => {
    emits('search', searchText.value)
}

</script>

<style scoped>
.toolbar-group {
    display: flex;
    gap: 6px;
    align-items: center;
}

.search-toolbar{
    display: flex;
    align-items: center;

}

.search-box {
    padding: 2px 8px;
    font-size: 12px;
    height: 20px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    width: 150px;
    transition: all 0.2s ease;
    line-height: 1;
    margin:0;
    gap: 0;
}

.search-box:focus {
    outline: none;
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.button {
    padding: 4px 8px;
    font-size: 12px;
    height: 24px;
    min-width: 24px;
    background-color: #fff;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: normal;
    color: rgba(0, 0, 0, 0.85);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
}

.button:hover {
    color: #40a9ff;
    border-color: #40a9ff;
}

.button:active {
    color: #096dd9;
    border-color: #096dd9;
}

.button.active {
    color: #fff;
    background: #1890ff;
    border-color: #1890ff;
}

.button:focus {
    outline: none;
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.button:disabled {
    color: rgba(0, 0, 0, 0.25);
    background: #f5f5f5;
    border-color: #d9d9d9;
    cursor: not-allowed;
    box-shadow: none;
}

select.button {
    padding-right: 20px;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' fill='%23595959' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: calc(100% - 6px) center;
}

.menu-icon {
    transform: rotate(90deg)
}

</style>