// Factory Pattern for creating shapes
class ShapeFactory {
    static createShape(type, options = {}) {
        const defaultOptions = {
            x: 0,
            y: 0,
            size: 20,
            color: 0xffffff,
            ...options
        };
        
        switch (type) {
            case 'circle':
                return new Circle(defaultOptions);
            case 'triangle':
                return new Triangle(defaultOptions);
            case 'square':
                return new Square(defaultOptions);
            case 'pentagon':
                return new Pentagon(defaultOptions);
            case 'hexagon':
                return new Hexagon(defaultOptions);
            case 'ellipse':
                return new Ellipse(defaultOptions);
            case 'star':
                return new Star(defaultOptions);
            case 'irregular':
                return new IrregularShape(defaultOptions);
            default:
                return new Circle(defaultOptions);
        }
    }
}

// Base Shape class
class BaseShape {
    constructor(options) {
        this.x = options.x;
        this.y = options.y;
        this.size = options.size;
        this.color = options.color;
        this.vy = 0;
        this.dead = false;
        this.graphic = null;
        this.area = this.calculateArea();
    }
    
    calculateArea() {
        return Math.PI * this.size * this.size;
    }
    
    update(dt, gravity) {
        this.vy += gravity * dt;
        this.y += this.vy * dt;
        
        if (this.graphic) {
            this.graphic.position.set(this.x, this.y);
        }
    }
}

// Concrete shape classes
class Circle extends BaseShape {
    calculateArea() {
        return Math.PI * this.size * this.size;
    }
    
    createGraphic() {
        const g = new Graphics()
            .circle(0, 0, this.size)
            .fill({ color: this.color });
        return g;
    }
}

class Triangle extends BaseShape {
    calculateArea() {
        return (Math.sqrt(3) / 4) * (this.size * 2) * (this.size * 2);
    }
    
    createGraphic() {
        const g = new Graphics()
            .regularPoly(0, 0, this.size, 3)
            .fill({ color: this.color });
        return g;
    }
}

// ... more shape classes

export { ShapeFactory, BaseShape };