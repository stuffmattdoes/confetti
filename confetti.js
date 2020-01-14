const HALF_PI = Math.PI * 0.5;
const colors = [
    '244, 124, 124',    // #F47C7C
    '247, 244, 139',    // #F7F48B
    '161, 222, 147',    // #A1DE93
    '112, 161, 215',    // #70A1D7
];

function Pool(obj, count) {
    this.active = [];
    this.inactive = new Array(count);
    this.inactive.fill(obj, 0, count);
}

Pool.prototype = {
    despawn: function () {
        console.log('Despawn!');
    },
    spawn: function () {
        console.log('Spawn!');
        return this.inactive.length ? this.inactive[0] : null
    }
}

let animId,
    // explosions = new Pool(new Explosion(0, 0, 300), 15),
    explosions = [],
    viewWidth = window.innerWidth,
    viewHeight = window.innerHeight,
    canvas,
    ctx,
    timeStep = (1 / 60);

function Point (x, y) {
    return {
        x: x | 0,
        y: y || 0
    }
}

function Particle (x, y, velocity) {
    const { p0, p1, p2, p3 } = createPath(x, y, velocity);
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;

    // Lifecycle
    this.time = 0;
    this.complete = false;
    this.duration = 3 + Math.random() * 2;

    // Properties
    let rnd = Math.random();
    // this.alpha = 1.0;
    this.alpha = rnd < 0.5 ? 1.0 : rnd < 0.75 ? 0.9 : 0.8;
    this.color = `rgba(${colors[Math.floor(Math.random() * colors.length)]}, ${this.alpha})`;
    this.w = 6 + (Math.random() * 6);
    this.h = 6 + (Math.random() * 6);
    this.shape = Math.random() < 0.5 ? 'triangle' : 'square';
};

Particle.prototype = {
    draw: function () {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.r);
        ctx.scale(1, this.sy);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha - Ease.inOutCubic(this.time, 0, this.alpha, this.duration);

        switch(this.shape) {
            case 'square':
                ctx.fillRect(-this.w * 0.5, -this.h * 0.5, this.w, this.h);
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(-this.w * 0.5, -this.h * 0.5);
                ctx.lineTo(this.w, -this.h * 0.5);
                ctx.lineTo(this.w * 0.5, this.h * 0.75);
                ctx.fill();
                break;
        }

        ctx.restore();
    },
    update: function () {
        this.time = Math.min(this.duration, this.time + timeStep);

        let f = Ease.outCubic(this.time, 0, 1, this.duration);
        let p = Bezier.cubic(this.p0, this.p1, this.p2, this.p3, f);

        let dx = p.x - this.x;
        let dy = p.y - this.y;

        this.r =  Math.atan2(dy, dx) + HALF_PI;
        this.sy = Math.sin(Math.PI * f * 10);
        this.x = p.x;
        this.y = p.y;

        this.complete = this.time === this.duration;

        this.draw();
    }
};

function Explosion(x, y, velocity) {
    this.complete = false;
    this.particles = [];

    for (let i = 0; i < 64; i++) {
        this.particles.push(new Particle(x, y, velocity));
    }

    // this.x = x;
    // this.x = y;
}

Explosion.prototype = {
    update: function () {
        this.particles.forEach((p, i) => {
            if (!p.complete) {
                p.update();
            }
        });
    }
}

function Streamer (x, y, duration, velocity, repeat, debug) {
    // Path
    const { p0, p1, p2, p3 } = createPath(x, y, velocity);
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;

    // Properties
    let rnd = Math.random();
    this.alpha = 1.0;
    this.alpha = rnd < 0.5 ? 1.0 : rnd < 0.75 ? 0.9 : 0.8;
    this.amplitude = Math.random() * 2 + 4;
    this.color = `rgba(${colors[Math.floor(Math.random() * colors.length)]}, 1)`;
    this.frequency = Math.random() * 2 + 4;
    let pathLengths = bezierLength(p0, p1, p2, p3);
    this.pathLength = pathLengths.length;
    this.pathLengths = pathLengths.lengths;
    this.streamerLength = 25;
    this.sineLength = 0;
    
    // Lifecycle
    this.cycles = 0;
    this.completd = false;
    this.duration = duration || 3 + Math.random() * 2;
    this.maxCycles = 2;
    this.repeat = repeat;
    this.debug = debug;
    this.time = 0;

    // Path
    this.pathPoints = [];
    this.renderPoints = [];
    let dir = new Point(),
        lastPathPoint = new Point(),
        pathPoint,
        renderPoint = new Point(),
        sinePathPoint = new Point(),
        theta = 0;

    // TODO
    // Normalize distance between bezier curve points ("arc length" formula)

    // Calculate since curve along path
    for (let i = 0; i < this.pathLength; i++) {
        pathPoint = Bezier.cubic(this.p0, this.p1, this.p2, this.p3, i / this.pathLength);
        dir = {
            x: pathPoint.x - lastPathPoint.x,
            y: pathPoint.y - lastPathPoint.y 
        };
        lastPathPoint = { ...pathPoint };
        theta = Math.atan2(dir.y, dir.x);

        // Sine wave around origin (0, 0)
        sinePathPoint = {
            // x: i,
            x: 0,
            y: Math.sin(i / this.frequency) * this.amplitude
        };

        // Rotating points
        // 𝑥′= 𝑥cos𝜃 − 𝑦sin𝜃
        // 𝑦′ = 𝑥sin𝜃 + 𝑦cos𝜃
        renderPoint = {
            x: sinePathPoint.x * Math.cos(theta) - sinePathPoint.y * Math.sin(theta),
            y: sinePathPoint.x * Math.sin(theta) + sinePathPoint.y * Math.cos(theta)
        };
        
        // Translate back to path offset
        renderPoint.x += pathPoint.x;
        renderPoint.y += pathPoint.y;

        // Translate back to path offset
        // sinePathPoint.x += pathPoint.x;
        // sinePathPoint.y += pathPoint.y;
        
        this.pathPoints.push(pathPoint);
        this.renderPoints.push(renderPoint);
    }

    // Get final length of sine path
    this.sineLength = this.renderPoints.reduce((acc, rp, i, arr) => {
        return i === 0 ? 0 :
            acc += pythagorean(arr[i - 1], rp);
    }, 0);
}

Streamer.prototype = {
    draw: function() {
        let f = Ease.outCubic(this.time, 0, 1, this.duration);

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([ this.streamerLength, 2000]);
        ctx.lineDashOffset = -f * this.sineLength;
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = this.alpha - Ease.inOutCubic(this.time, 0, this.alpha, this.duration);

        this.renderPoints.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        
        if (this.debug) {
            ctx.strokeStyle = '#000';
            ctx.lineDashOffset = -f * this.pathLength;
            ctx.lineWidth = 1;
            ctx.moveTo(this.p0.x, this.p0.y);
            ctx.bezierCurveTo(this.p1.x, this.p1.y, this.p2.x, this.p2.y, this.p3.x, this.p3.y);
            // this.pathPoints.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
        }

        ctx.restore();
    },
    reset: function(x, y) {
        this.time = 0;
        this.cycles += 1;

        if (this.cycles === this.maxCycles) {
            this.repeat = false;
        }
    },
    update: function() {
        this.time = Math.min(this.duration, this.time + timeStep);
        this.complete = this.time === this.duration;

        if (this.complete && this.repeat) {
            this.reset();
        }

        this.draw();
    }
}

// bezier-curve interpolation
function createPath(x, y, velocity) {
    function randomDir(velocity) {
        const leftOrRight = Math.random() < 0.5 ? -1 : 1;
        return Math.random() * velocity * leftOrRight;
    }
    
    return {
        p0: new Point(x, y),
        p1: new Point(x + randomDir(velocity), y + randomDir(velocity)),
        p2: new Point(x + randomDir(velocity), y + randomDir(velocity)),
        p3: new Point(x + randomDir(velocity), y + 100 + Math.random() * 250)
    }
}

function loop() {
    ctx.clearRect(0, 0, viewWidth, viewHeight);
    explosions.forEach((e, i) => {
        if (e.complete) {
            // Pool it!
        } else {
            e.update();
        }
    });

    animId = requestAnimationFrame(loop);
}

// Easing functions

/**
 * easing equations from http://gizma.com/easing/
 * t = current time
 * b = start value
 * c = delta value
 * d = duration
 */
let Ease = {
    inCubic: (t, b, c, d) => {
        t /= d;
        return c * t * t * t + b;
    },
    outCubic: (t, b, c, d) => {
        t /= d;
        t--;
        return c * (t * t * t + 1) + b;
    },
    inOutCubic: (t, b, c, d) => {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t * t + b;
        t -= 2;
        return c / 2 * (t * t * t + 2) + b;
    },
    inBack: (t, b, c, d, s) => {
        s = s || 1.70158;
        return c * (t /= d) * t * ((s + 1) * t - s) + b;
    }
};

const Bezier = {
    cubic: (p0, c0, c1, p1, t) => {
        let p = new Point();
        let nt = (1 - t);

        p.x = Math.pow(nt, 3) * p0.x
            + 3 * Math.pow(nt, 2) * t * c0.x
            + 3 * nt * Math.pow(t, 2) * c1.x
            + Math.pow(t, 3) * p1.x;
        p.y = Math.pow(nt, 3) * p0.y +
            3 * Math.pow(nt, 2) * t * c0.y
            + 3 * nt * Math.pow(t, 2) * c1.y
            + Math.pow(t, 3) * p1.y;
    
        return p;
    },
    equidistant: (p0, c0, c1, p1, t) => {
        let p = new Point();
        const t2 = t * t;
        const t3 = t2 * t;

        p.x = p0.x + (-p0.x * 3 + t * (3 * p0.x - p0.x * t)) * t
        + (3 * c0.x + t * (-6 * c0.x + c0.x * 3 * t)) * t
        + (c1.x * 3 - c1.x * 3 * t) * t2
        + p1.x * t3;

        p.y = p0.y + (-p0.y * 3 + t * (3 * p0.y - p0.y * t)) * t
        + (3 * c0.y + t * (-6 * c0.y + c0.y * 3 * t)) * t
        + (c1.y * 3 - c1.y * 3 * t) * t2
        + p1.y * t3;

        return p;
    }
}

function pythagorean(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function bezierLength(p0, c0, c1, p1) {
    let lenArr = [];
    let lenCurrent = 0;
    let lenTotal = 0;
    let resolution = 200;
    let pA = Bezier.cubic(p0, c0, c1, p1, 0);
    let pB;

    lenArr.push(0);

    for (let i = 0; i < resolution; i++) {
        pB = Bezier.cubic(p0, c0, c1, p1, i / resolution);
        lenCurrent = pythagorean(pA, pB);
        lenArr.push(lenCurrent);
        lenTotal += lenCurrent;
        pA = pB;
    }

    return { length: lenTotal, lengths: lenArr };
}

function setDimensions() {
    canvas.width = viewWidth;
    canvas.height = viewHeight;
}

function init() {
    console.log('init');
    canvas = document.querySelector('canvas');
    ctx = canvas.getContext('2d');
    setDimensions();

    // makeItRain();
    canvas.addEventListener('click', ({ x, y }) => explosions.push(new Explosion(x, y, 300)));
    window.addEventListener('resize', setDimensions);
    requestAnimationFrame(loop);
}

init();
