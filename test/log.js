let printToServer = require('../src/printToServer.js');

class complex {

    constructor () {
        this.name = 'dummy'
        this.array = [
            { a: 'eight', b: 'bee', c: { val: 'see', val2: 'now', toString: () => `${this.val1}.${this.val2}` } },
            { a: 'aye', b: 'bea', c: { val: 'sea', val2: 'ward' }, d: 'rare' },
            { a: 'a', b: 'b', c: { val: 'c', val2: 'c' }, d: this }
        ]
    }
    
    glimpNormalize(options, circularTracked) {
        let normalized = printToServer.glimpNormalize(this.array, options, circularTracked);
        normalized.caption = this.name;
        return normalized;
    }

}

let c = new complex();
console.log(printToServer.glimpNormalize(c))
