const cloneInstance = obj => Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);

function Pool(obj, count) {
    this.active = [];
    this.inactive = [];
    // this.pbj = cloneInstance(obj);

    // for (let i = 0; i < count; i++) {
    //     let clonedInstance = cloneInstance(obj);
    //     clonedInstance._poolKey = i;
    //     this.inactive.push(clonedInstance);
    // }

    console.log(this.inactive);
}

Pool.prototype = {
    allocate: function () {
        let objInstance;

        if (this.inactive.length) {
            objInstance = this.inactive.shift();
        } else {
            objInstance = cloneInstance(this.obj);
        }

        this.active.push(objInstance);

        return objInstance;
    },
    pool: function (obj) {
        const activeIndex = this.active.findIndex(activeObj => activeObj._poolKey === obj._poolKey);
        this.active.splice(activeIndex, 1);
        this.inactive.push(obj);
    }
}
