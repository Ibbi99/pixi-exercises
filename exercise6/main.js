import {
    Application,
    Graphics,
    Container
} from "pixi.js";
import { GameManager } from './modules/GameManager.js';
import { ShapeFactory } from './modules/ShapeFactory.js';
import { GameStats, UIObserver } from './modules/UIObserver.js';

(async () => {
    // Initialize Singleton instances
    const gameManager = GameManager.getInstance();
    const gameStats = new GameStats();
    const uiObserver = new UIObserver();
    
    // Subscribe UI to game stats
    gameStats.subscribe(uiObserver);
    
    const app = new Application();
    await app.init({
        width: 800,
        height: 600,
        backgroundColor: 0x94D2BD,
        autoDensity: true,
        resolution: Math.min(devicePixelRatio || 1, 2)
    });

    // Setup canvas
    app.canvas.style.position = 'absolute';
    app.canvas.style.left = "0";
    app.canvas.style.top = "0";
    document.getElementById('game').appendChild(app.canvas);

    // Setup rectangle
    const margin = 20;
    const headH = 34;
    const rect = { 
        x: margin, 
        y: margin + headH + 40,
        w: 600,
        h: 460
    };

    // Create border
    const border = new Graphics()
        .rect(0, 0, rect.w, rect.h)
        .stroke({ width: 2, color: 0x000000 });
    border.position.set(rect.x, rect.y);
    app.stage.addChild(border);

    // Setup containers
    const shapesContainer = new Container();
    app.stage.addChild(shapesContainer);

    const maskGraph = new Graphics()
        .rect(0, 0, rect.w, rect.h)
        .fill({ color: 0xffffff });
    maskGraph.position.set(rect.x, rect.y);
    app.stage.addChild(maskGraph);
    shapesContainer.mask = maskGraph;

    // Setup clickable area
    const spawnArea = new Graphics()
        .rect(0, 0, rect.w, rect.h)
        .fill({ color: 0x000000, alpha: 0 });
    spawnArea.position.set(rect.x, rect.y);
    spawnArea.eventMode = 'static';
    spawnArea.cursor = "pointer";
    app.stage.addChild(spawnArea);

    // Setup controls
    document.getElementById('increaseFreq').addEventListener('click', () => {
        gameManager.setShapeFrequency(gameManager.shapeFrequency + 0.5);
        gameStats.setFrequency(gameManager.shapeFrequency);
    });

    document.getElementById('decreaseFreq').addEventListener('click', () => {
        gameManager.setShapeFrequency(gameManager.shapeFrequency - 0.5);
        gameStats.setFrequency(gameManager.shapeFrequency);
    });

    document.getElementById('increaseGravity').addEventListener('click', () => {
        gameManager.setGravity(gameManager.gravity + 100);
        gameStats.setGravity(gameManager.gravity);
    });

    document.getElementById('decreaseGravity').addEventListener('click', () => {
        gameManager.setGravity(gameManager.gravity - 100);
        gameStats.setGravity(gameManager.gravity);
    });

    // Shape types for random generation
    const shapeTypes = ['circle', 'triangle', 'square', 'pentagon', 'hexagon', 'ellipse', 'star'];

    // Auto-generate shapes
    let spawnAcc = 0;
    
    app.ticker.add((ticker) => {
        const dt = ticker.deltaMS / 1000;
        const bottomY = rect.y + rect.h + 50;

        // Spawn shapes
        spawnAcc += dt;
        if (spawnAcc >= (1 / gameManager.shapeFrequency)) {
            spawnAcc = 0;
            
            const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
            const x = rect.x + 30 + Math.random() * (rect.w - 60);
            const y = rect.y - 40;
            const size = 10 + Math.random() * 18;
            const color = Math.floor(Math.random() * 0xffffff);
            
            const shape = ShapeFactory.createShape(type, {
                x, y, size, color
            });
            
            shape.graphic = shape.createGraphic();
            shape.graphic.eventMode = 'static';
            shape.graphic.cursor = "pointer";
            shape.graphic.on("pointerdown", (e) => {
                e.stopPropagation();
                shape.dead = true;
            });
            
            shapesContainer.addChild(shape.graphic);
            gameManager.addShape(shape);
        }

        // Update shapes
        for (let i = gameManager.shapes.length - 1; i >= 0; i--) {
            const shape = gameManager.shapes[i];
            shape.update(dt, gameManager.gravity);
            
            if (shape.dead || shape.y > bottomY) {
                if (shape.graphic) {
                    shape.graphic.removeFromParent();
                    shape.graphic.destroy();
                }
                gameManager.removeShape(shape);
            }
        }

        // Update stats
        const totalArea = gameManager.calculateTotalArea();
        gameStats.setShapesCount(gameManager.shapes.length);
        gameStats.setTotalArea(totalArea);
    });

    // Click to create irregular shape
    spawnArea.on("pointerdown", (e) => {
        if (e.target !== spawnArea) return;
        
        const local = shapesContainer.toLocal(e.global);
        const size = 14 + Math.random() * 22;
        const color = Math.floor(Math.random() * 0xffffff);
        
        const shape = ShapeFactory.createShape('irregular', {
            x: local.x,
            y: local.y,
            size,
            color
        });
        
        shape.graphic = shape.createGraphic();
        shape.graphic.eventMode = 'static';
        shape.graphic.cursor = "pointer";
        shape.graphic.on("pointerdown", (e) => {
            e.stopPropagation();
            shape.dead = true;
        });
        
        shapesContainer.addChild(shape.graphic);
        gameManager.addShape(shape);
    });
})();