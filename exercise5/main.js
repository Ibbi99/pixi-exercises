import { Application, Graphics, Container, Text, TextStyle } from "pixi.js";

(async () => {
    const app = new Application();
    await app.init({
        resizeTo: window,
        backgroundColor: 0xffffff,
        autoDensity: true,
        resolution: Math.min(devicePixelRatio || 1, 2),
    });

    app.canvas.style.position = "absolute";
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
        .fill({ color: 0x94d2bd });

    border.position.set(rect.x, rect.y);
    app.stage.addChild(border);

    const tabY = rect.y - headH;
    const statistics = makeTab(rect.x, tabY, 520);
    app.stage.addChild(statistics.container);

    function makeTab(x, y, w) {
        const headContainer = new Container();
        headContainer.position.set(x, y);

        const headBg = new Graphics()
            .rect(0, 0, w, headH)
            .fill({ color: 0x0a9396 })
            .stroke({ width: 2, color: 0x000000 });

        headContainer.addChild(headBg);

        const style = new TextStyle({
            fill: 0xffffff,
            fontSize: 14,
            fontFamily: "Arial",
        });

        const countText = new Text({ text: "Number of current shapes: 0", style });
        countText.position.set(8, 6);

        const areaText = new Text({ text: "Surface occupied by shapes: 0", style });
        areaText.position.set(8, 18);

        headContainer.addChild(countText, areaText);

        return { container: headContainer, countText, areaText };
    }

    const shapesContainer = new Container();

    const spawnArea = new Graphics()
        .rect(0, 0, rect.w, rect.h)
        .fill({ color: 0x000000, alpha: 0 });

    spawnArea.position.set(rect.x, rect.y);
    spawnArea.eventMode = "static";
    spawnArea.cursor = "pointer";

    app.stage.addChild(spawnArea);
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

    function computeArea(type, size) {
        switch (type) {
            case 0:
            case 1:
            case 2:
            case 3: {
                const n = type + 3;
                return (n / 2) * size * size * Math.sin((2 * Math.PI) / n);
            }
            case 4:
                return Math.PI * size * size;
            case 5: {
                const rx = size * 1.3;
                const ry = size * 0.8;
                return Math.PI * rx * ry;
            }
            case 6: {
                const outerR = size;
                const innerR = size * 0.5;
                const points = 5;
                return 0.5 * points * outerR * innerR;
            }
            default:
                return 0;
        }
    }

    function makeRandomShapesAbove() {
        const color = Math.floor(Math.random() * 0xffffff);
        const size = 10 + Math.random() * 18;
        const maxSize = 28;

        const x = rect.x + maxSize + Math.random() * (rect.w - 2 * maxSize);
        const y = rect.y - maxSize - 10;

        const shape = new Graphics();
        shape.eventMode = "static";
        shape.cursor = "pointer";

        shape.on("pointerdown", (e) => {
            e.stopPropagation();
            shape.dead = true;
        });

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

        shape.area = computeArea(type, size);
        shape.position.set(x, y);
        shape.vy = 0;

        shapesContainer.addChild(shape);
        shapes.push(shape);
    }

    function createIrregularShape(size, color) {
        const g = new Graphics();
        g.eventMode = "static";
        g.cursor = "pointer";

        const pointsCount = 6 + Math.floor(Math.random() * 7);
        const pts = [];

        for (let i = 0; i < pointsCount; i++) {
            const angle = (i / pointsCount) * Math.PI * 2;
            const radius = size * (0.4 + Math.random() * 0.9);
            pts.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }

        g.poly(pts).fill({ color });

        g.area = Math.PI * size * size;

        g.on("pointerdown", (e) => {
            e.stopPropagation();
            g.dead = true;
        });

        return g;
    }

    spawnArea.on("pointerdown", (e) => {
        const local = shapesContainer.toLocal(e.global);

        const size = 14 + Math.random() * 22;
        const color = Math.floor(Math.random() * 0xffffff);

        const irregular = createIrregularShape(size, color);
        irregular.position.set(local.x, local.y);
        irregular.vy = 0;

        shapesContainer.addChild(irregular);
        shapes.push(irregular);
    });

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

            if (shape.dead || shape.y > bottomY) {
                shape.removeFromParent();
                shape.destroy();
                shapes.splice(i, 1);
            }
        }

        let totalArea = 0;
        for (const s of shapes) totalArea += s.area || 0;

        statistics.countText.text = `Number of current shapes: ${shapes.length}`;
        statistics.areaText.text = `Surface occupied by shapes: ${Math.round(totalArea)}`;
    });
})();
