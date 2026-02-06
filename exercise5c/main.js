import {
    Application,
    Container,
    Graphics
} from "pixi.js";


(async () => {
    const app = new Application();
    await app.init({
        resizeTo: window,
        backgroundColor: 0X94D2BD,
        autoDensity: true,
        resolution: Math.min(devicePixelRatio || 1, 2)
    });

    app.canvas.style.position = 'absolute';
    app.canvas.style.left = "0";
    app.canvas.style.top = "0";
    app.canvas.style.zIndex = "1";

    document.body.appendChild(app.canvas);


    const margin = 20;
    const headH = 34;

    const rect = {
        x: margin,
        y: margin + headH,
        w: Math.min(600, window.innerWidth - margin * 2),
        h: Math.min(800, window.innerHeight - (margin * 2 + headH))
    };

    const shapesDiv = document.getElementById("shapesCount");
    const areaDiv = document.getElementById("areaUsed");

    function positionHud() {
        const tabY = rect.y - headH;

        shapesDiv.style.left = `${rect.x}px`;
        shapesDiv.style.top = `${tabY}px`;

        areaDiv.style.left = `${rect.x + 260}px`;
        areaDiv.style.top = `${tabY}px`;
    }
    positionHud();
    window.addEventListener("resize", positionHud);

    const border = new Graphics()
        .rect(0, 0, rect.w, rect.h)
        .stroke({ width: 2, color: 0x000000 });

    border.position.set(rect.x, rect.y);
    app.stage.addChild(border);


    const spawnArea = new Graphics()
        .rect(0, 0, rect.w, rect.h)
        .fill({ color: 0x000000, alpha: 0 });

    spawnArea.position.set(rect.x, rect.y);
    spawnArea.eventMode = 'static';
    spawnArea.cursor = "pointer";
    app.stage.addChild(spawnArea);

    const shapesContainer = new Container();
    app.stage.addChild(shapesContainer);

    const maskGraph = new Graphics()
        .rect(0, 0, rect.w, rect.h)
        .fill({ color: 0xffffff });

    maskGraph.position.set(rect.x, rect.y);
    app.stage.addChild(maskGraph);

    shapesContainer.mask = maskGraph;

    const shapes = [];
    let gravity = 900; // px/s^2

    function makeRandomShapesAbove() {
        const color = Math.floor(Math.random() * 0xffffff);

        const size = 10 + Math.random() * 18;

        const maxSize = 28;
        const x = rect.x + maxSize + Math.random() * (rect.w - 2 * maxSize);

        const y = rect.y - maxSize - 10;

        const shape = new Graphics();


        shape.eventMode = 'static';
        shape.cursor = "pointer";

        shape.on("pointerdown", (e) => {
            e.stopPropagation();
            shape.dead = true;
        });

        const type = Math.floor(Math.random() * 7);

        switch (type) {
            case 0:
                shape.regularPoly(0, 0, size, 3)
                    .fill({ color });
                break;
            case 1:
                shape.regularPoly(0, 0, size, 4)
                    .fill({ color });
                break;
            case 2:
                shape.regularPoly(0, 0, size, 5)
                    .fill({ color });
                break;
            case 3:
                shape.regularPoly(0, 0, size, 6)
                    .fill({ color });
                break;
            case 4:
                shape.circle(0, 0, size)
                    .fill({ color });
                break;
            case 5:
                shape.ellipse(0, 0, size * 1.3, size * 0.8)
                    .fill({ color });
                break;
            case 6:
                shape.star(0, 0, 5, size, size * 0.5)
                    .fill({ color });
                break;
        }

        shape.area = computeArea(type, size);
        shape.position.set(x, y);
        shape.vy = 0;


        shapesContainer.addChild(shape);
        shapes.push(shape);
    }

    function computeArea(type, size) {
        switch (type) {
            case 0:
            case 1:
            case 2:
            case 3: {
                const n = type + 3;
                // A = (n/2) * R^2 * sin(2π/n)
                return (n / 2) * size * size * Math.sin((2 * Math.PI) / n);
            }
            case 4:
                return Math.PI * size * size;
            case 5: {
                // ellipse (rx=size*1.3, ry=size*0.8)
                const rx = size * 1.3;
                const ry = size * 0.8;
                return Math.PI * rx * ry;
            }
            case 6: {
                // ~0.5 * points * outerR * innerR
                const outerR = size;
                const innerR = size * 0.5;
                const points = 5;
                return 0.5 * points * outerR * innerR;
            }
            default:
                return 0;
        }
    }

    let spawnAcc = 0;
    const spawnEvery = 1;


    app.ticker.add((ticker) => {
        const dt = ticker.deltaMS / 1000;
        const bottomY = rect.y + rect.h + 50;

        spawnAcc += dt;
        if (spawnAcc >= spawnEvery) {
            spawnAcc -= spawnEvery;
            makeRandomShapesAbove();
        }

        for (let i = shapes.length - 1; i >= 0; i--) {
            const c = shapes[i];

            c.vy += gravity * dt;
            c.y += c.vy * dt;

            if (c.dead || c.y > bottomY) {
                c.removeFromParent();
                c.destroy();
                shapes.splice(i, 1);
            }
        }

        shapesDiv.textContent = `Number of current shapes: ${shapes.length}`;

        let totalArea = 0;
        for (const s of shapes) totalArea += (s.area || 0);

        areaDiv.textContent = `Surface occupied by shapes: ${Math.round(totalArea)}`;

    });

    function createIrregularShape(size, color) {
        const g = new Graphics();

        const pointsCount = 6 + Math.floor(Math.random() * 7);
        const pts = [];

        for (let i = 0; i < pointsCount; i++) {
            const angle = (i / pointsCount) * Math.PI * 2;

            const radius = size * (0.4 + Math.random() * 0.9);

            pts.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }

        g.poly(pts).fill({ color });

        g.area = Math.PI * size * size;

        return g;
    }

    spawnArea.on("pointerdown", (e) => {
        if (e.target !== spawnArea) return;

        const local = shapesContainer.toLocal(e.global);

        const size = 14 + Math.random() * 22;
        const color = Math.floor(Math.random() * 0xffffff);

        const irregular = createIrregularShape(size, color);

        irregular.position.set(local.x, local.y);
        irregular.vy = 0;

        irregular.eventMode = "static";
        irregular.cursor = "pointer";
        irregular.on("pointerdown", (e) => {
            e.stopPropagation();
            irregular.dead = true;
        });

        shapesContainer.addChild(irregular);
        shapes.push(irregular);
    });



})();

