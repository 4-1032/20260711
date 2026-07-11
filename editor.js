// js/editor.js

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;

const AppState = {

    projectId: null,

    project: null,

    drawing: false,

    tool: "pen",

    color: "#000000",

    size: 5

};

const canvasWrapper =
    document.getElementById(
        "canvasWrapper"
    );

const layerPanel =
    document.getElementById(
        "layerPanel"
    );

const projectTitle =
    document.getElementById(
        "projectTitle"
    );

const saveStatus =
    document.getElementById(
        "saveStatus"
    );

const layerManager =
    new LayerManager(
        canvasWrapper,
        layerPanel,
        markDirty
    );

const historyManager =
    new HistoryManager();

let autoSaveTimer = null;

init();

async function init() {

    await dbManager.init();

    const params =
        new URLSearchParams(
            location.search
        );

    AppState.projectId =
        params.get("id");

    if (
        !AppState.projectId
    ) {

        alert(
            "作品が見つかりません"
        );

        location.href =
            "index.html";

        return;

    }

    const project =
        await dbManager.getProject(
            AppState.projectId
        );

    if (!project) {

        alert(
            "作品が存在しません"
        );

        location.href =
            "index.html";

        return;

    }

    AppState.project =
        project;

    projectTitle.value =
        project.title;

    if (
        project.layers &&
        project.layers.length
    ) {

        await layerManager
            .importLayers(
                project.layers
            );

    } else {

        const layer =
            layerManager.createLayer(
                "レイヤー1"
            );

        historyManager.capture(
            layer
        );

    }

    bindEvents();

    startAutoSave();

}

function bindEvents() {

    document
    .getElementById(
        "backBtn"
    )
    .onclick =
    () => {

        location.href =
        "index.html";

    };

    document
    .getElementById(
        "addLayerBtn"
    )
    .onclick =
    () => {

        const layer =
            layerManager.createLayer(
                `レイヤー${layerManager.layers.length + 1}`
            );

        historyManager.capture(
            layer
        );

    };

    document
    .getElementById(
        "saveBtn"
    )
    .onclick =
    saveProject;

    document
    .getElementById(
        "exportBtn"
    )
    .onclick =
    exportPNG;

    document
    .getElementById(
        "penBtn"
    )
    .onclick =
    () => {

        AppState.tool =
            "pen";

    };

    document
    .getElementById(
        "eraserBtn"
    )
    .onclick =
    () => {

        AppState.tool =
            "eraser";

    };

    document
    .getElementById(
        "undoBtn"
    )
    .onclick =
    async () => {

        const layer =
            layerManager.activeLayer;

        if (!layer) return;

        await historyManager.undo(
            layer
        );

    };

    document
    .getElementById(
        "redoBtn"
    )
    .onclick =
    async () => {

        const layer =
            layerManager.activeLayer;

        if (!layer) return;

        await historyManager.redo(
            layer
        );

    };

    document
    .getElementById(
        "colorPicker"
    )
    .oninput =
    e => {

        AppState.color =
            e.target.value;

    };

    document
    .getElementById(
        "brushSize"
    )
    .oninput =
    e => {

        AppState.size =
            Number(
                e.target.value
            );

    };

    projectTitle.oninput =
    markDirty;

    setupCanvasEvents();

}

function setupCanvasEvents() {

    canvasWrapper.addEventListener(
        "pointerdown",
        startDraw
    );

    canvasWrapper.addEventListener(
        "pointermove",
        draw
    );

    window.addEventListener(
        "pointerup",
        endDraw
    );

}

function startDraw(e) {

    const layer =
        layerManager.activeLayer;

    if (!layer) {
        return;
    }

    historyManager.capture(
        layer
    );

    AppState.drawing =
        true;

    const p =
        getPosition(e);

    layer.ctx.beginPath();

    layer.ctx.moveTo(
        p.x,
        p.y
    );

}

function draw(e) {

    if (
        !AppState.drawing
    ) {
        return;
    }

    const layer =
        layerManager.activeLayer;

    if (!layer) {
        return;
    }

    const p =
        getPosition(e);

    layer.ctx.lineCap =
        "round";

    layer.ctx.lineJoin =
        "round";

    layer.ctx.lineWidth =
        AppState.size;

    if (
        AppState.tool ===
        "eraser"
    ) {

        layer.ctx.globalCompositeOperation =
            "destination-out";

        layer.ctx.strokeStyle =
            "rgba(0,0,0,1)";

    } else {

        layer.ctx.globalCompositeOperation =
            "source-over";

        layer.ctx.strokeStyle =
            AppState.color;

    }

    layer.ctx.lineTo(
        p.x,
        p.y
    );

    layer.ctx.stroke();

}

function endDraw() {

    AppState.drawing =
        false;

}

function getPosition(e) {

    const rect =
        canvasWrapper
        .getBoundingClientRect();

    return {

        x:
            e.clientX -
            rect.left,

        y:
            e.clientY -
            rect.top

    };

}

function markDirty() {

    saveStatus.textContent =
        "未保存";

}

async function saveProject() {

    const thumbnail =
        generateThumbnail();

    AppState.project.title =
        projectTitle.value;

    AppState.project.updatedAt =
        Date.now();

    AppState.project.thumbnail =
        thumbnail;

    AppState.project.layers =
        layerManager.exportLayers();

    await dbManager.saveProject(
        AppState.project
    );

    saveStatus.textContent =
        "保存済み";

}

function generateThumbnail() {

    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width = 300;
    canvas.height = 175;

    const ctx =
        canvas.getContext(
            "2d"
        );

    layerManager.layers
        .forEach(layer => {

            if (
                layer.visible
            ) {

                ctx.globalAlpha =
                    layer.opacity;

                ctx.drawImage(
                    layer.canvas,
                    0,
                    0,
                    300,
                    175
                );

            }

        });

    return canvas.toDataURL(
        "image/png"
    );

}

async function exportPNG() {

    const merged =
        document.createElement(
            "canvas"
        );

    merged.width =
        CANVAS_WIDTH;

    merged.height =
        CANVAS_HEIGHT;

    const ctx =
        merged.getContext(
            "2d"
        );

    layerManager.layers
        .forEach(layer => {

            if (
                layer.visible
            ) {

                ctx.globalAlpha =
                    layer.opacity;

                ctx.drawImage(
                    layer.canvas,
                    0,
                    0
                );

            }

        });

    const url =
        merged.toDataURL(
            "image/png"
        );

    const a =
        document.createElement(
            "a"
        );

    a.href = url;

    a.download =
        projectTitle.value +
        ".png";

    a.click();

}

function startAutoSave() {

    autoSaveTimer =
        setInterval(
            saveProject,
            30000
        );

}