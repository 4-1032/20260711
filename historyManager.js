// js/historyManager.js

class HistoryManager {

    constructor(maxHistory = 20) {

        this.maxHistory =
            maxHistory;

        this.undoStacks =
            new Map();

        this.redoStacks =
            new Map();

    }

    initLayer(layerId) {

        if (
            !this.undoStacks.has(
                layerId
            )
        ) {

            this.undoStacks.set(
                layerId,
                []
            );

        }

        if (
            !this.redoStacks.has(
                layerId
            )
        ) {

            this.redoStacks.set(
                layerId,
                []
            );

        }

    }

    capture(layer) {

        this.initLayer(
            layer.id
        );

        const undoStack =
            this.undoStacks.get(
                layer.id
            );

        undoStack.push(
            layer.canvas.toDataURL(
                "image/png"
            )
        );

        if (
            undoStack.length >
            this.maxHistory
        ) {

            undoStack.shift();

        }

        this.redoStacks.set(
            layer.id,
            []
        );

    }

    async undo(layer) {

        this.initLayer(
            layer.id
        );

        const undoStack =
            this.undoStacks.get(
                layer.id
            );

        const redoStack =
            this.redoStacks.get(
                layer.id
            );

        if (
            undoStack.length <= 1
        ) {

            return false;

        }

        const currentState =
            undoStack.pop();

        redoStack.push(
            currentState
        );

        const previousState =
            undoStack[
                undoStack.length - 1
            ];

        await this.restore(
            layer,
            previousState
        );

        return true;

    }

    async redo(layer) {

        this.initLayer(
            layer.id
        );

        const undoStack =
            this.undoStacks.get(
                layer.id
            );

        const redoStack =
            this.redoStacks.get(
                layer.id
            );

        if (
            redoStack.length === 0
        ) {

            return false;

        }

        const nextState =
            redoStack.pop();

        undoStack.push(
            nextState
        );

        await this.restore(
            layer,
            nextState
        );

        return true;

    }

    async restore(
        layer,
        imageData
    ) {

        return new Promise(
            resolve => {

                const image =
                    new Image();

                image.onload =
                    () => {

                        layer.ctx.clearRect(
                            0,
                            0,
                            layer.canvas.width,
                            layer.canvas.height
                        );

                        layer.ctx.drawImage(
                            image,
                            0,
                            0
                        );

                        resolve();

                    };

                image.src =
                    imageData;

            }
        );

    }

    resetLayer(layerId) {

        this.undoStacks.delete(
            layerId
        );

        this.redoStacks.delete(
            layerId
        );

    }

    clear() {

        this.undoStacks.clear();

        this.redoStacks.clear();

    }

}