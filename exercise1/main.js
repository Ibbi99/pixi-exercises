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

    let gravity = 900; // px/s^2
    let spawnAcc = 0;
    const spawnEvery = 1;

    //ex 2
    const circles = [];

    function makeCircleAbove(r) {
        const x = rect.x + r + Math.random() * (rect.w - 2 * r);

        const y = rect.y - r - 10;

        const circleGrph = new Graphics()
            .circle(0, 0, r)
            .fill({ color: 0x9B2226 });

        circleGrph.position.set(x, y);
        circleGrph.vy = 0;

        shapesContainer.addChild(circleGrph);
        circles.push(circleGrph);
    }

    app.ticker.add((ticker) => {
        const dt = ticker.deltaMS / 1000;
        const bottomY = rect.y + rect.h + 50;

        spawnAcc += dt;
        if (spawnAcc >= spawnEvery) {
            spawnAcc -= spawnEvery;
            makeCircleAbove(10 + Math.random() * 25);
        }

        for (let i = circles.length - 1; i >= 0; i--) {
            const c = circles[i];

            c.vy += gravity * dt;
            c.y += c.vy * dt;

            if (c.y > bottomY) {
                c.removeFromParent();
                c.destroy();
                circles.splice(i, 1);
            }
        }
    });
})();