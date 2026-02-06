// Observer Pattern for UI updates
class Subject {
    constructor() {
        this.observers = [];
    }
    
    subscribe(observer) {
        this.observers.push(observer);
    }
    
    unsubscribe(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }
    
    notify(data) {
        this.observers.forEach(observer => observer.update(data));
    }
}

class GameStats extends Subject {
    constructor() {
        super();
        this.shapesCount = 0;
        this.totalArea = 0;
        this.gravity = 900;
        this.frequency = 1;
    }
    
    setShapesCount(count) {
        this.shapesCount = count;
        this.notify({ type: 'shapesCount', value: count });
    }
    
    setTotalArea(area) {
        this.totalArea = area;
        this.notify({ type: 'totalArea', value: area });
    }
    
    setGravity(value) {
        this.gravity = value;
        this.notify({ type: 'gravity', value });
    }
    
    setFrequency(value) {
        this.frequency = value;
        this.notify({ type: 'frequency', value });
    }
}

class UIObserver {
    constructor() {
        this.shapesCountElement = document.getElementById('shapesCount');
        this.totalAreaElement = document.getElementById('areaUsed');
        this.gravityElement = document.getElementById('gravityValue');
        this.frequencyElement = document.getElementById('freqValue');
    }
    
    update(data) {
        switch (data.type) {
            case 'shapesCount':
                this.shapesCountElement.textContent = `Number of current shapes: ${data.value}`;
                break;
            case 'totalArea':
                this.totalAreaElement.textContent = `Surface occupied by shapes: ${Math.round(data.value)} px^2`;
                break;
            case 'gravity':
                this.gravityElement.textContent = data.value.toFixed(1);
                break;
            case 'frequency':
                this.frequencyElement.textContent = data.value.toFixed(1);
                break;
        }
    }
}

export { GameStats, UIObserver };