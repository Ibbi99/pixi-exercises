import {
    Application,
    Graphics,
    Container
} from "pixi.js";

(async () => {
    const app = new Application();
    await app.init({
        resizeTo: window,
        backgroundColor: 0Xffffff,
        autoDensity: true,
        resolution: Math.min(devicePixelRatio || 1, 2)
    });

    app.canvas.style.position = 'absolute';
    app.canvas.style.left = "0";
    app.canvas.style.top = "0";
    document.body.appendChild(app.canvas);

    const margin = 20;
    const headH = 34;
    const rect = {
        x: margin,
        y: margin + headH,
        w: 600,
        h: 500,
    };

    const border = new Graphics()
        .rect(0, 0, rect.w, rect.h)
        .stroke({ width: 2, color: 0x000000 })
        .fill({ color: 0X94D2BD });

    border.position.set(rect.x, rect.y);
    app.stage.addChild(border);

    const shapesContainer = new Container();
    app.stage.addChild(shapesContainer);

    const maskGraph = new Graphics()
        .rect(0, 0, rect.w, rect.h)
        .fill({ color: 0xffffff });

    maskGraph.position.set(rect.x, rect.y);
    app.stage.addChild(maskGraph);
    shapesContainer.mask = maskGraph;

    const shapes = [];
    let gravity = 900;
    let spawnAcc = 0;
    const spawnEvery = 1;

    function makeRandomShapesAbove() {
        const color = Math.floor(Math.random() * 0xffffff);
        const size = 10 + Math.random() * 18;
        const maxSize = 28;
        const x = rect.x + maxSize + Math.random() * (rect.w - 2 * maxSize);
        const y = rect.y - maxSize - 10;

        const shape = new Graphics();
        const type = Math.floor(Math.random() * 7);

        switch (type) {
            case 0:
                shape.regularPoly(0, 0, size, 3).fill({ color });
                break;
            case 1:
                shape.regularPoly(0, 0, size, 4).fill({ color });
                break;
            case 2:
                shape.regularPoly(0, 0, size, 5).fill({ color });
                break;
            case 3:
                shape.regularPoly(0, 0, size, 6).fill({ color });
                break;
            case 4:
                shape.circle(0, 0, size).fill({ color });
                break;
            case 5:
                shape.ellipse(0, 0, size * 1.3, size * 0.8).fill({ color });
                break;
            case 6:
                shape.star(0, 0, 5, size, size * 0.5).fill({ color });
                break;
        }

        shape.position.set(x, y);
        shape.vy = 0;

        shapesContainer.addChild(shape);
        shapes.push(shape);
    }

    app.ticker.add((ticker) => {
        const dt = ticker.deltaMS / 1000;
        const bottomY = rect.y + rect.h + 50;

        spawnAcc += dt;
        if (spawnAcc >= spawnEvery) {
            spawnAcc -= spawnEvery;
            makeRandomShapesAbove();
        }

        for (let i = shapes.length - 1; i >= 0; i--) {
            const shape = shapes[i];
            shape.vy += gravity * dt;
            shape.y += shape.vy * dt;

            if (shape.y > bottomY) {
                shape.removeFromParent();
                shape.destroy();
                shapes.splice(i, 1);
            }
        }
    });
})();