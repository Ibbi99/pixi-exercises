import { Application, Container, Graphics, Rectangle } from "pixi.js";

interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

class Game {
    private static _instance: Game | null = null;

    public readonly app: Application;
    public readonly stage: Container;

    private constructor(app: Application) {
        this.app = app;
        this.stage = app.stage;
    }

    public static async createAndStart(): Promise<Game> {
        if (Game._instance) return Game._instance;

        const app = new Application();
        await app.init({
            resizeTo: window,
            backgroundColor: 0x111111,
            autoDensity: true,
            resolution: Math.min(devicePixelRatio || 1, 2),
        });

        document.body.style.margin = "0";
        document.body.style.overflow = "hidden";
        document.body.appendChild(app.canvas);

        Game._instance = new Game(app);
        Game._instance.bootstrap();

        return Game._instance;
    }

    public static get instance(): Game {
        if (!Game._instance) {
            throw new Error("Game not created. Call Game.createAndStart() first.");
        }
        return Game._instance;
    }

    private bootstrap(): void {
        //ex 1
        const area = new CanvasArea({
            margin: 20,
            headerHeight: 50,
            maxWidth: 700,
            maxHeight: 800,
            borderColor: 0x00bcd4,
            borderWidth: 3,
            fillColor: 0x000000,
            fillAlpha: 0.15,
        });

        this.stage.addChild(area.view);

        //ex 2
        const shapeManager = new ShapeManager({
            gravity: 1400,  //f gravity value 
            spawnEvery: 1,  //g 1 shape/second
        });

        //ex 5 bonus
        const htmlHud = new HtmlHud();

        //ex 5
        // const statusPanel = new Hud();
        // this.stage.addChild(statusPanel.view);

        //ex 6

        const controls = new HtmlControls(
            (rate) => {
                shapeManager.setSpawnRate(rate);
                controls.setValues(shapeManager.getSpawnRate(), shapeManager.getGravity());
            },
            (g) => {
                shapeManager.setGravity(g);
                controls.setValues(shapeManager.getSpawnRate(), shapeManager.getGravity());
            }
        );

        controls.setValues(shapeManager.getSpawnRate(), shapeManager.getGravity());

        // init shown values
        controls.setValues(shapeManager.getSpawnRate(), shapeManager.getGravity());

        //e mask
        const maskG = new Graphics();
        shapeManager.view.mask = maskG;

        const hitG = new Graphics();
        hitG.eventMode = "static";
        hitG.cursor = "pointer";

        this.stage.addChild(maskG);
        this.stage.addChild(hitG);
        this.stage.addChild(shapeManager.view);


        hitG.on("pointerdown", (e) => {
            console.log("HIT");
            const p = e.global;
            shapeManager.spawnAt(p.x, p.y);
        });


        const onResize = () => {
            const r = this.getAreaRect(area.config);
            area.relayout(r);

            const headerY = r.y - area.config.headerHeight;
            htmlHud.setPosition(r.x, headerY);

            maskG.clear();
            maskG.rect(r.x, r.y, r.w, r.h).fill({ color: 0xffffff, alpha: 1 });

            hitG.clear();
            hitG.rect(r.x, r.y, r.w, r.h).fill({ color: 0xffffff, alpha: 0.001 });

            //ex 6
            controls.setPosition(r.x, r.y + r.h + 10);

            ////ex 5
            // statusPanel.setPosition(r.x + 10, r.y + 10);
        };
        window.addEventListener("resize", onResize);
        onResize();

        //ex 2 a, f
        this.app.ticker.add((ticker) => {
            const dtMs = ticker.deltaMS;

            //dt: clamped
            const dtPhysics = Math.min(dtMs, 50) / 1000;

            //spawn dt: real time
            const dtSpawn = dtMs / 1000;

            shapeManager.update(dtPhysics, dtSpawn, area.boundsRect);

            const stats = shapeManager.getStats(area.boundsRect);
            htmlHud.update(stats.count, stats.area);

            //ex 5
            // const stats = shapeManager.getStats(area.boundsRect);
            // statusPanel.update(stats.count, stats.area);
        });

    }

    private getAreaRect(cfg: CanvasAreaConfig): Rect {
        const margin = cfg.margin;
        const headH = cfg.headerHeight;

        const w = Math.min(cfg.maxWidth, window.innerWidth - margin * 2);
        const h = Math.min(cfg.maxHeight, window.innerHeight - (margin * 2 + headH));

        return {
            x: margin,
            y: margin + headH,
            w: Math.max(0, w),
            h: Math.max(0, h),
        };
    }
}

type CanvasAreaConfig = {
    margin: number;
    headerHeight: number;
    maxWidth: number;
    maxHeight: number;
    borderColor: number;
    borderWidth: number;
    fillColor: number;
    fillAlpha: number;
};

class CanvasArea {
    public readonly view: Container = new Container();
    public readonly config: CanvasAreaConfig;

    private readonly g: Graphics = new Graphics();
    private rect: Rect = { x: 0, y: 0, w: 0, h: 0 };

    constructor(config: CanvasAreaConfig) {
        this.config = config;
        this.view.addChild(this.g);
    }

    public relayout(rect: Rect): void {
        this.rect = rect;
        this.redraw();
    }

    public get boundsRect(): Rect {
        return this.rect;
    }

    private redraw(): void {
        const { x, y, w, h } = this.rect;
        const { borderColor, borderWidth, fillColor, fillAlpha } = this.config;

        this.g.clear();

        this.g.rect(x, y, w, h);
        this.g.fill({ color: fillColor, alpha: fillAlpha });

        this.g.rect(x, y, w, h);
        this.g.stroke({ width: borderWidth, color: borderColor, alpha: 1 });
    }
}

//ex 5 bonus
class HtmlHud {
    private shapesEl: HTMLDivElement;
    private areaEl: HTMLDivElement;

    constructor() {
        const shapes = document.getElementById("shapesCount");
        const area = document.getElementById("areaUsed");

        if (!shapes || !area) {
            throw new Error("Missing #shapesCount or #areaUsed in HTML");
        }

        this.shapesEl = shapes as HTMLDivElement;
        this.areaEl = area as HTMLDivElement;
    }

    public setPosition(x: number, y: number): void {
        const stats = document.getElementById("stats") as HTMLDivElement | null;
        if (!stats) return;

        stats.style.position = "absolute";
        stats.style.left = `${Math.round(x)}px`;
        stats.style.top = `${Math.round(y)}px`;
        stats.style.zIndex = "10";
        stats.style.pointerEvents = "none";
    }

    public update(count: number, areaPx2: number): void {
        this.shapesEl.textContent = `Number of current shapes: ${count}`;
        this.areaEl.textContent = `Surface occupied by shapes: ${Math.round(areaPx2)}`;
    }
}

//ex 6
class HtmlControls {
    private root: HTMLDivElement;

    private spawnValue: HTMLSpanElement;
    private gravValue: HTMLSpanElement;

    private spawnRate = 1;
    private gravity = 200;

    constructor(
        private handleSpawnRate: (newRate: number) => void,
        private handleGravity: (newG: number) => void
    ) {
        const root = document.getElementById("controls") as HTMLDivElement | null;
        const spawnValue = document.getElementById("spawnValue") as HTMLSpanElement | null;
        const gravValue = document.getElementById("gravValue") as HTMLSpanElement | null;

        const spawnMinus = document.getElementById("spawnMinus") as HTMLButtonElement | null;
        const spawnPlus = document.getElementById("spawnPlus") as HTMLButtonElement | null;
        const gravMinus = document.getElementById("gravMinus") as HTMLButtonElement | null;
        const gravPlus = document.getElementById("gravPlus") as HTMLButtonElement | null;

        if (!root || !spawnValue || !gravValue || !spawnMinus || !spawnPlus || !gravMinus || !gravPlus) {
            throw new Error("Missing controls HTML elements");
        }

        this.root = root;
        this.spawnValue = spawnValue;
        this.gravValue = gravValue;

        spawnMinus.addEventListener("click", () => this.setSpawnRate(this.spawnRate - 0.5));
        spawnPlus.addEventListener("click", () => this.setSpawnRate(this.spawnRate + 0.5));
        gravMinus.addEventListener("click", () => this.setGravity(this.gravity - 100));
        gravPlus.addEventListener("click", () => this.setGravity(this.gravity + 100));
    }

    public setPosition(x: number, y: number): void {
        this.root.style.left = `${Math.round(x)}px`;
        this.root.style.top = `${Math.round(y)}px`;
    }

    public setValues(spawnRate: number, gravity: number): void {
        this.spawnRate = spawnRate;
        this.gravity = gravity;
        this.spawnValue.textContent = spawnRate.toFixed(1);
        this.gravValue.textContent = Math.round(gravity).toString();
    }

    private setSpawnRate(v: number): void {
        const clamped = Math.max(0, Math.min(4000, v));
        this.spawnRate = clamped;
        this.spawnValue.textContent = clamped.toFixed(1);
        this.handleSpawnRate(clamped);
    }

    private setGravity(v: number): void {
        const clamped = Math.max(0, Math.min(4000, v));
        this.gravity = clamped;
        this.gravValue.textContent = Math.round(clamped).toString();
        this.handleGravity(clamped);
    }
}

////ex 5
// class Hud {
//     public readonly view = new Container();

//     private readonly countText: Text;
//     private readonly areaText: Text;

//     constructor() {
//         const style = new TextStyle({
//             fontFamily: "Arial",
//             fontSize: 16,
//             fill: 0xffffff,
//         });

//         this.countText = new Text({ text: "Shapes: 0", style });
//         this.areaText = new Text({ text: "Area: 0 px^2", style });

//         this.areaText.y = 22;

//         this.view.addChild(this.countText, this.areaText);
//     }

//     public setPosition(x: number, y: number): void {
//         this.view.position.set(x, y);
//     }

//     public update(count: number, area: number): void {
//         this.countText.text = `Shapes: ${count}`;
//         this.areaText.text = `Area: ${Math.round(area)} `;
//     }
// }

//ex 2
abstract class FallingShape {
    public readonly g: Graphics = new Graphics();
    public vy = 0;
    public area = 0;

    constructor(
        public x: number,
        public y: number,
        public size: number,
        public color: number
    ) {
        this.g.position.set(x, y);
    }

    public redraw(): void {
        this.draw();
        this.area = this.computeArea();
    }

    protected abstract draw(): void;
    protected abstract computeArea(): number;

    public update(dt: number, gravity: number): void {
        this.vy += gravity * dt;
        this.y += this.vy * dt;
        this.g.position.set(this.x, this.y);
    }
}

//ex 2
class TriangleShape extends FallingShape {
    protected draw(): void {
        const s = this.size;

        this.g.clear();
        this.g
            .moveTo(0, 0)
            .lineTo(s, 0)
            .lineTo(s / 2, -s)
            .closePath()
            .fill({ color: this.color, alpha: 1 });
    }
    protected computeArea(): number {
        return (this.size * this.size) / 2;
    }
}

//ex 2h
type ShapeType =
    | "TRIANGLE"
    | "QUAD"
    | "PENTAGON"
    | "HEXAGON"
    | "CIRCLE"
    | "ELLIPSE"
    | "STAR";

//regular poligon
class RegularPolygonShape extends FallingShape {
    constructor(
        x: number,
        y: number,
        size: number,
        color: number,
        private sides: number
    ) {
        super(x, y, size, color);
    }

    protected draw(): void {
        const r = this.size;
        const start = -Math.PI / 2;

        this.g.clear();

        //path
        for (let i = 0; i < this.sides; i++) {
            const a = start + (i * 2 * Math.PI) / this.sides;
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;

            if (i === 0) this.g.moveTo(px, py);
            else this.g.lineTo(px, py);
        }
        this.g.closePath();

        this.g.fill({ color: this.color, alpha: 1 });
    }

    protected computeArea(): number {
        const n = this.sides;
        const R = this.size;
        return (n / 2) * R * R * Math.sin((2 * Math.PI) / n);
    }
}

class CircleShape extends FallingShape {
    protected draw(): void {
        this.g.clear();
        this.g.circle(0, 0, this.size).fill({ color: this.color, alpha: 1 });
    }
    protected computeArea(): number {
        const r = this.size;
        return Math.PI * r * r;
    }
}

class EllipseShape extends FallingShape {
    constructor(
        x: number,
        y: number,
        size: number,
        color: number,
        private rx: number,
        private ry: number
    ) {
        super(x, y, size, color);
    }

    protected draw(): void {
        this.g.clear();
        this.g.ellipse(0, 0, this.rx, this.ry).fill({ color: this.color, alpha: 1 });
    }
    protected computeArea(): number {
        return Math.PI * this.rx * this.ry;
    }

}

class StarShape extends FallingShape {
    constructor(
        x: number,
        y: number,
        size: number,
        color: number,
        private pointsCount: number = 5
    ) {
        super(x, y, size, color);
    }

    protected draw(): void {
        const outerR = this.size;
        const innerR = this.size * 0.5;
        const total = this.pointsCount * 2;
        const start = -Math.PI / 2

        this.g.clear();

        for (let i = 0; i < total; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const a = start + (i * Math.PI) / this.pointsCount;
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;

            if (i === 0) this.g.moveTo(px, py);
            else this.g.lineTo(px, py);
        }
        this.g.closePath();

        this.g.fill({ color: this.color, alpha: 1 });
    }
    protected computeArea(): number {
        const outerR = this.size;
        const innerR = this.size * 0.5;
        const total = this.pointsCount * 2;
        const start = -Math.PI / 2;

        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < total; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const a = start + (i * Math.PI) / this.pointsCount;
            pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
        }
        return polygonArea(pts);
    }

}

////ex 3
// class SquareShape extends FallingShape {
//     protected draw(): void {
//         const s = this.size;
//         this.g.clear();
//         this.g.rect(-s / 2, -s / 2, s, s).fill({ color: this.color, alpha: 1 });
//     }
// }

//ex 3 bonus
class IrregularPolygonShape extends FallingShape {
    constructor(
        x: number,
        y: number,
        size: number,
        color: number,
        private points: { x: number; y: number }[]
    ) {
        super(x, y, size, color);
    }

    protected draw(): void {
        this.g.clear();

        //path
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            if (i === 0) this.g.moveTo(p.x, p.y);
            else this.g.lineTo(p.x, p.y);
        }
        this.g.closePath();

        this.g.fill({ color: this.color, alpha: 1 });
    }

    protected computeArea(): number {
        return polygonArea(this.points);
    }
}


class ShapeFactory {
    private static types: ShapeType[] = [
        "TRIANGLE",
        "QUAD",
        "PENTAGON",
        "HEXAGON",
        "CIRCLE",
        "ELLIPSE",
        "STAR",
    ];


    public static createRandom(area: Rect): FallingShape {
        const type = this.types[randInt(0, this.types.length - 1)];

        const color = randColor();
        const x = randFloat(area.x, area.x + area.w);
        const y = area.y - 80;

        let shape: FallingShape;

        switch (type) {
            case "TRIANGLE":
                shape = new RegularPolygonShape(x, y, randInt(18, 40), color, 3);
                break;
            case "QUAD":
                shape = new RegularPolygonShape(x, y, randInt(18, 40), color, 4);
                break;
            case "PENTAGON":
                shape = new RegularPolygonShape(x, y, randInt(18, 40), color, 5);
                break;
            case "HEXAGON":
                shape = new RegularPolygonShape(x, y, randInt(18, 40), color, 6);
                break;
            case "CIRCLE":
                shape = new CircleShape(x, y, randInt(16, 36), color);
                break;
            case "ELLIPSE": {
                const rx = randInt(18, 40);
                const ry = randInt(12, 32);
                shape = new EllipseShape(x, y, Math.max(rx, ry), color, rx, ry);
                break;
            }
            case "STAR":
                shape = new StarShape(x, y, randInt(18, 40), color, 5);
                break;
            default:
                shape = new CircleShape(x, y, 25, 0xffffff);
        }

        console.log(type);

        shape.redraw();
        return shape;
    }

    public static createAt(x: number, y: number): FallingShape {
        const type = this.types[randInt(0, this.types.length - 1)];
        const color = randColor();

        let shape: FallingShape;

        switch (type) {
            case "TRIANGLE":
                shape = new RegularPolygonShape(x, y, randInt(18, 40), color, 3);
                break;
            case "QUAD":
                shape = new RegularPolygonShape(x, y, randInt(18, 40), color, 4);
                break;
            case "PENTAGON":
                shape = new RegularPolygonShape(x, y, randInt(18, 40), color, 5);
                break;
            case "HEXAGON":
                shape = new RegularPolygonShape(x, y, randInt(18, 40), color, 6);
                break;
            case "CIRCLE":
                shape = new CircleShape(x, y, randInt(16, 36), color);
                break;
            case "ELLIPSE": {
                const rx = randInt(18, 40);
                const ry = randInt(12, 32);
                shape = new EllipseShape(x, y, Math.max(rx, ry), color, rx, ry);
                break;
            }
            case "STAR":
                shape = new StarShape(x, y, randInt(18, 40), color, 5);
                break;
            default:
                shape = new CircleShape(x, y, 25, 0xffffff);
        }

        shape.redraw();
        return shape;
    }
}


type ShapeSpawnerConfig = {
    gravity: number;      //px / s^2
    spawnEvery: number;   //1 shape / second
};

class ShapeManager {
    public readonly view: Container = new Container();

    private shapes: FallingShape[] = [];
    private spawnTimer = 0;
    private maxShapes = 150;

    constructor(private cfg: ShapeSpawnerConfig) { }

    public update(dtPhysics: number, dtSpawn: number, area: Rect): void {

        this.spawnTimer += dtSpawn;

        if (this.spawnTimer >= this.cfg.spawnEvery) {
            this.spawnTimer -= this.cfg.spawnEvery; //keep a reminder
            this.spawnOne(area);
        }

        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const s = this.shapes[i];
            s.update(dtPhysics, this.cfg.gravity);

            const b = s.g.getBounds();
            const bottomOutside = b.y > area.y + area.h + 50; //50 px buffer

            if (bottomOutside) {
                this.view.removeChild(s.g);
                s.g.destroy();
                this.shapes.splice(i, 1);
            }
        }
    }

    //ex 6
    public setSpawnRate(perSecond: number): void {
        const clamped = Math.max(0.2, Math.min(10, perSecond));
        this.cfg.spawnEvery = 1 / clamped;
    }

    public setGravity(g: number): void {
        this.cfg.gravity = Math.max(0, Math.min(4000, g));
    }

    public getGravity(): number {
        return this.cfg.gravity;
    }

    public getSpawnRate(): number {
        return 1 / this.cfg.spawnEvery;
    }

    //ex 4
    private removeShape(target: FallingShape): void {
        const idx = this.shapes.indexOf(target);
        if (idx === -1) return;

        this.view.removeChild(target.g);
        target.g.destroy();
        this.shapes.splice(idx, 1);
    }

    private makeInteractive(s: FallingShape): void {
        s.g.eventMode = "static";
        s.g.cursor = "pointer";

        const size = s.size;
        s.g.hitArea = new Rectangle(-size, -size, size * 2, size * 2);

        s.g.on("pointerdown", (e: any) => {
            e.stopPropagation?.();
            e.stopImmediatePropagation?.();
            this.removeShape(s);
        });
    }

    ////ex 3
    // public spawnAt(x: number, y: number): void {
    //     const size = randInt(18, 40);
    //     const color = 0xffc300;

    //     const square = new SquareShape(x, y, size, color);
    //     square.redraw();

    //     this.shapes.push(square);
    //     this.view.addChild(square.g);

    //     while (this.shapes.length > this.maxShapes) {
    //         const old = this.shapes.shift()!;
    //         this.view.removeChild(old.g);
    //         old.g.destroy();
    //     }
    // }

    public spawnAt(x: number, y: number): void {
        const size = randInt(25, 55);
        const color = randColor(); //

        const vertexCount = randInt(5, 10);     // random no of peaks
        const irregularity = randFloat(0.25, 0.6);
        const points = randomIrregularPoints(vertexCount, size, irregularity);

        const shape = new IrregularPolygonShape(x, y, size, color, points);
        shape.redraw();

        this.shapes.push(shape);
        this.view.addChild(shape.g);
        this.makeInteractive(shape);

        while (this.shapes.length > this.maxShapes) {
            const old = this.shapes.shift()!;
            this.view.removeChild(old.g);
            old.g.destroy();
        }
    }

    private spawnOne(area: Rect): void {
        ////ex2
        // const size = randInt(20, 50);
        // const color = 0xffc300;

        // // c) random X across top of rectangle
        // const x = randFloat(area.x, area.x + area.w);

        // // b) initial Y outside top of rectangle
        // const y = area.y - 60;

        // const tri = new TriangleShape(x, y, size, color);
        // this.shapes.push(tri);
        // this.view.addChild(tri.g);
        const shape = ShapeFactory.createRandom(area);
        this.shapes.push(shape);
        this.view.addChild(shape.g);
        this.makeInteractive(shape);

        //prevent WebGL buffer overflow
        while (this.shapes.length > this.maxShapes) {
            const old = this.shapes.shift()!;
            this.view.removeChild(old.g);
            old.g.destroy();
        }
    }

    //ex 5
    public getStats(area: Rect): { count: number; area: number } {
        let count = 0;
        let areaSum = 0;

        for (const s of this.shapes) {

            const b = s.g.getBounds();

            const intersects =
                b.x < area.x + area.w &&
                b.x + b.width > area.x &&
                b.y < area.y + area.h &&
                b.y + b.height > area.y;

            if (intersects) {
                count++;
                areaSum += s.area;
            }
        }
        return { count, area: areaSum };
    }
}



function randFloat(min: number, max: number): number {
    return min + Math.random() * (max - min);
}
function randInt(min: number, max: number): number {
    return Math.floor(randFloat(min, max + 1));
}
function randColor(): number {
    const r = randInt(80, 255);
    const g = randInt(80, 255);
    const b = randInt(80, 255);
    return (r << 16) | (g << 8) | b;
}

function randomIrregularPoints(
    vertexCount: number,
    baseR: number,
    irregularity: number
): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = [];
    const start = Math.random() * Math.PI * 2;

    for (let i = 0; i < vertexCount; i++) {
        const a = start + (i * 2 * Math.PI) / vertexCount;

        const r = baseR * (1 - irregularity + Math.random() * 2 * irregularity);

        pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    return pts;
}

function polygonArea(pts: { x: number; y: number }[]): number {
    let sum = 0;
    for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        sum += a.x * b.y - b.x * a.y;
    }
    return Math.abs(sum) / 2;
}

//ex2
void TriangleShape;


(async () => {
    await Game.createAndStart();
})();
