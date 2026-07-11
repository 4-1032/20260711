// js/layerManager.js

class LayerManager {

    constructor(
        canvasWrapper,
        layerPanel,
        onChange = null
    ) {

        this.canvasWrapper =
            canvasWrapper;

        this.layerPanel =
            layerPanel;

        this.layers = [];

        this.activeLayer =
            null;

        this.onChange =
            onChange;

    }

    createLayer(
        name = "新規レイヤー"
    ) {

        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.width = 1200;
        canvas.height = 700;

        canvas.className =
            "layerCanvas";

        this.canvasWrapper
            .appendChild(
                canvas
            );

        const layer = {

            id:
                crypto.randomUUID(),

            name,

            visible: true,

            opacity: 1,

            canvas,

            ctx:
                canvas.getContext(
                    "2d"
                )

        };

        this.layers.push(
            layer
        );

        this.activeLayer =
            layer;

        this.updateZIndex();

        this.renderPanel();

        this.notify();

        return layer;

    }

    getLayer(id) {

        return this.layers.find(
            layer =>
                layer.id === id
        );

    }

    selectLayer(id) {

        const layer =
            this.getLayer(id);

        if (!layer) {
            return;
        }

        this.activeLayer =
            layer;

        this.renderPanel();

    }

    deleteLayer(id) {

        if (
            this.layers.length <= 1
        ) {

            alert(
                "最低1枚のレイヤーが必要です"
            );

            return;

        }

        const index =
            this.layers.findIndex(
                layer =>
                    layer.id === id
            );

        if (
            index === -1
        ) {
            return;
        }

        this.layers[index]
            .canvas
            .remove();

        this.layers.splice(
            index,
            1
        );

        this.activeLayer =
            this.layers[
                this.layers.length - 1
            ];

        this.updateZIndex();

        this.renderPanel();

        this.notify();

    }

    toggleVisibility(id) {

        const layer =
            this.getLayer(id);

        if (!layer) {
            return;
        }

        layer.visible =
            !layer.visible;

        layer.canvas.style.display =
            layer.visible
                ? "block"
                : "none";

        this.renderPanel();

        this.notify();

    }

    setOpacity(
        id,
        opacity
    ) {

        const layer =
            this.getLayer(id);

        if (!layer) {
            return;
        }

        layer.opacity =
            opacity;

        layer.canvas.style.opacity =
            opacity;

        this.notify();

    }

    renameLayer(
        id,
        newName
    ) {

        const layer =
            this.getLayer(id);

        if (!layer) {
            return;
        }

        layer.name =
            newName;

        this.renderPanel();

        this.notify();

    }

    moveUp(id) {

        const index =
            this.layers.findIndex(
                layer =>
                    layer.id === id
            );

        if (
            index ===
            this.layers.length - 1
        ) {
            return;
        }

        [
            this.layers[index],
            this.layers[index + 1]
        ] =
        [
            this.layers[index + 1],
            this.layers[index]
        ];

        this.updateZIndex();

        this.renderPanel();

        this.notify();

    }

    moveDown(id) {

        const index =
            this.layers.findIndex(
                layer =>
                    layer.id === id
            );

        if (
            index <= 0
        ) {
            return;
        }

        [
            this.layers[index],
            this.layers[index - 1]
        ] =
        [
            this.layers[index - 1],
            this.layers[index]
        ];

        this.updateZIndex();

        this.renderPanel();

        this.notify();

    }

    updateZIndex() {

        this.layers.forEach(
            (
                layer,
                index
            ) => {

                layer.canvas.style.zIndex =
                    index;

            }
        );

    }

    clearAll() {

        this.layers.forEach(
            layer => {

                layer.canvas.remove();

            }
        );

        this.layers = [];

        this.activeLayer =
            null;

    }

    exportLayers() {

        return this.layers.map(
            layer => ({

                id:
                    layer.id,

                name:
                    layer.name,

                visible:
                    layer.visible,

                opacity:
                    layer.opacity,

                image:
                    layer.canvas
                        .toDataURL(
                            "image/png"
                        )

            })
        );

    }

    async importLayers(
        layersData
    ) {

        this.clearAll();

        for (
            const data
            of layersData
        ) {

            const layer =
                this.createLayer(
                    data.name
                );

            layer.visible =
                data.visible;

            layer.opacity =
                data.opacity;

            layer.canvas.style.opacity =
                data.opacity;

            layer.canvas.style.display =
                data.visible
                    ? "block"
                    : "none";

            if (
                data.image
            ) {

                const img =
                    new Image();

                await new Promise(
                    resolve => {

                        img.onload =
                            () => {

                                layer.ctx.drawImage(
                                    img,
                                    0,
                                    0
                                );

                                resolve();

                            };

                        img.src =
                            data.image;

                    }
                );

            }

        }

        this.renderPanel();

    }

    renderPanel() {

        const addButton =
            document.getElementById(
                "addLayerBtn"
            );

        this.layerPanel.innerHTML =
            "";

        this.layerPanel.appendChild(
            addButton
        );

        [...this.layers]
            .reverse()
            .forEach(
                layer => {

                    const item =
                        document.createElement(
                            "div"
                        );

                    item.className =
                        "layerItem";

                    if (
                        layer ===
                        this.activeLayer
                    ) {

                        item.classList.add(
                            "active"
                        );

                    }

                    item.innerHTML = `

<div class="layerHeader">

<input
type="text"
value="${layer.name}"
class="layerName">

<div class="layerButtons">

<button class="visibleBtn">
${layer.visible ? "👁" : "🚫"}
</button>

<button class="upBtn">
↑
</button>

<button class="downBtn">
↓
</button>

<button class="deleteBtn">
🗑
</button>

</div>

</div>

<input
type="range"
class="opacitySlider"
min="0"
max="1"
step="0.01"
value="${layer.opacity}">

`;

                    item.onclick =
                        () => {

                            this.selectLayer(
                                layer.id
                            );

                        };

                    const nameInput =
                        item.querySelector(
                            ".layerName"
                        );

                    nameInput.oninput =
                        e => {

                            e.stopPropagation();

                            layer.name =
                                e.target.value;

                            this.notify();

                        };

                    item.querySelector(
                        ".visibleBtn"
                    ).onclick =
                    e => {

                        e.stopPropagation();

                        this.toggleVisibility(
                            layer.id
                        );

                    };

                    item.querySelector(
                        ".upBtn"
                    ).onclick =
                    e => {

                        e.stopPropagation();

                        this.moveUp(
                            layer.id
                        );

                    };

                    item.querySelector(
                        ".downBtn"
                    ).onclick =
                    e => {

                        e.stopPropagation();

                        this.moveDown(
                            layer.id
                        );

                    };

                    item.querySelector(
                        ".deleteBtn"
                    ).onclick =
                    e => {

                        e.stopPropagation();

                        this.deleteLayer(
                            layer.id
                        );

                    };

                    item.querySelector(
                        ".opacitySlider"
                    ).oninput =
                    e => {

                        e.stopPropagation();

                        this.setOpacity(
                            layer.id,
                            Number(
                                e.target.value
                            )
                        );

                    };

                    this.layerPanel
                        .appendChild(
                            item
                        );

                }
            );

    }

    notify() {

        if (
            typeof this.onChange ===
            "function"
        ) {

            this.onChange();

        }

    }

}