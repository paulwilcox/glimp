let printToServer = require('../src/printToServer.js');

class complex {

    constructor () {
        this.name = 'dummy'
        this.array = [
            { a: 'eight', b: 'bee', c: { val: 'see', val2: 'now', toString: () => `${this.val1}.${this.val2}` } },
            { a: 'aye', b: 'bea', c: { val: 'sea', val: 'ward', toString: () => `${this.val1}.${this.val2}` } },
            { a: 'a', b: 'b', c: { val: 'c', val2: 'c', toString: () => `${this.val1}.${this.val2}` } }
        ]
    }
    
    normalize() {
        let normalized = printToServer.normalize(this.array);
        normalized.caption = this.name;
        return normalized;
    }

}

let c = new complex();

console.log(printToServer.normalize(c))


