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
        this.draw();
    }
}