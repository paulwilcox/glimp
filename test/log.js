let glimpNormalize = require('../dist/glimp.server.js').glimpNormalize;

class complex {

    constructor () {
        this.name = 'dummy'
        this.array = [
            { a: 'eight', b: 'bee', c: { val: 'see', val2: 'now', toString: () => `${this.val1}.${this.val2}` } },
            { a: 'aye', b: 'bea', c: { val: 'sea', val2: 'ward' }, d: 'rare' },
            { a: 'a', b: 'b', c: { val: 'c', val2: 'c' }, d: this }
        ]
    }
    
    glimpNormalize(options) {
        let normalized = glimpNormalize(this.array, options);
        normalized.caption = this.name;
        return normalized;
    }

}

let c = new complex();
console.log(glimpNormalize(c))
