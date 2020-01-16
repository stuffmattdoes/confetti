const HALF_PI = Math.PI * 0.5;
const colors = [
    '244, 124, 124',    // #F47C7C
    '247, 244, 139',    // #F7F48B
    '161, 222, 147',    // #A1DE93
    '112, 161, 215',    // #70A1D7
];

let animId,
    explosions,
    viewWidth = window.innerWidth,
    viewHeight = window.innerHeight,
    canvas,
    ctx,
    timeStep = (1 / 60);

function Point (x, y) {
    return {
        x: x || 0,
        y: y || 0
    }
}

function Particle (x, y, velocity) {
    const { p0, p1, p2, p3 } = createPath(x, y, velocity);
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.velocity = velocity;

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
    reset: function(x, y) {
        const { p0, p1, p2, p3 } = createPath(x, y, this.velocity);
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    
        // Lifecycle
        this.time = 0;
        this.complete = false;
        this.duration = 3 + Math.random() * 2;
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

        this.complete = this.time >= this.duration;

        this.draw();
    }
};

function Explosion(x, y, velocity) {
    this.complete = false;
    this.particles = [];
    const particleCount = Math.floor(Math.random() * 75) + 50;

    for (let i = 0; i < particleCount; i++) {
        this.particles.push(new Particle(x, y, velocity));
    }

    this.activeParticles = this.particles.length;
    this.x = x;
    this.y = y;
}

Explosion.prototype = {
    reset: function(x, y) {
        this.activeParticles = this.particles.length;
        this.complete = false;
        this.particles.forEach((p, i) => p.reset(x, y));
        this.x = x;
        this.y = y;
    },
    update: function () {
        this.particles.forEach((p, i) => {
            if (!p.complete) {
                p.update();
            } else {
                this.activeParticles -= 1;
            }

            if (this.activeParticles <= 0) {
                this.complete = true;
            }
        });
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
    explosions.active.forEach((e, i) => {
        if (e.complete) {
            explosions.pool(e);
        } else {
            e.update();
        }
    });

    animId = requestAnimationFrame(loop);
}

function setDimensions() {
    canvas.width = viewWidth;
    canvas.height = viewHeight;
}

function explode({ x, y }) {
    explosions.allocate().reset(x, y);
}

function init() {
    canvas = document.querySelector('canvas');
    ctx = canvas.getContext('2d');
    explosions = new Pool(new Explosion(10, 10, 300), 10);

    for (let i = 0; i < 15; i ++) {
        explosions.inactive.push(new Explosion(0, 0, 300));
    }

    setDimensions();

    canvas.addEventListener('click', explode);
    window.addEventListener('resize', setDimensions);
    requestAnimationFrame(loop);
}

init();

// function Child(eyeballs) {
//     this.eyeballs = eyeballs;
// }
// Child.prototype.complaing = () => console.log('Complain');

// function Parent(child) {
//     this.child = Object.assign(Object.create(Object.getPrototypeOf(child)), child);
//     this.child2 = Object.assign(Object.create(Object.getPrototypeOf(child)), child);
//     this.child.eyeballs = 1;
//     console.log(child, this.child);
// }

// const parent = new Parent(new Child(2));
