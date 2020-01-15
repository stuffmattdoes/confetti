function Pool(obj, count) {
    this.active = [];
    this.inactive = [];
    this.obj = Object.assign(obj, {});

    for (let i = 0; i < count; i++) {
        let poolObj = Object.assign(Object.create(Object.getPrototypeOf(this.obj)), this.obj);
        poolObj._poolKey = i;
        this.inactive.push(poolObj);
    }
}

Pool.prototype = {
    allocate: function () {
        let instance;

        if (this.inactive.length) {
            instance = this.inactive.shift();
        } else {
            instance = this.obj;
        }

        this.active.push(instance);
        return instance;
    },
    pool: function (obj) {
        const activeIndex = this.active.findIndex(activeObj => activeObj._poolKey === obj._poolKey);
        this.active.splice(activeIndex, 1);
        this.inactive.push(obj);
    }
}
