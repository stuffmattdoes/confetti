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
