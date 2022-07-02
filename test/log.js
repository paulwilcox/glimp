
let glimpNormalize = require('../dist/glimp.server.js').glimpNormalize;
let glimpToString = require('../dist/glimp.server.js').glimpToString;

class complex {

    constructor () {
        this.name = 'dummy';
        this.array = [
            { a: 'eight', b: 'bee', c: { val: 'see', val2: 'now' } },
            { a: 'aye', b: 'bea', c: { val: 'sea', val2: 'ward' }, d: 'rare' },
            { a: 'a', b: 'b', c: { val: 'c', val2: 'c' }, d: this }
        ];
        this.irrelevant = 'dont display this prop';
    }
    
    glimpNormalize(options) {
        options.convertObjectsToArrays = true;
        let normalized = glimpNormalize(this.array, options);
        normalized.glimpCaption = this.name;
        normalized.glimpHeaders = true;
        return normalized;
    }

}


let c = new complex();
let n = glimpNormalize(c); 
let s = glimpToString(n)
//console.log(n);
console.log(s);

// TODO: Considering how to scroll in the terminal
console.log({
    procCols: process.stdout.columns,
    procRows: process.stdout.rows,
    strCols: Math.max(...s.split(/\n/).map(line => line.length)),
    strRows:  s.split(/\n/).length
});

process.stdout.write('hello')
process.stdout.cursorTo(2)
process.stdout.clearLine(-1)
process.stdout.write('\n')
process.stdout.write('goodbye');


