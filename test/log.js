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

//let c = new complex();
// console.log(printToServer.normalize(c))


let a = { e: 1 };
let b = { f: 2 };
let c = [ a, b, b ];
c.push(c);

function circles (obj, alreadyReferenced = new Set()) {
	if (alreadyReferenced.has(obj))
  	throw 'its circular'
	alreadyReferenced.add(obj);
  console.log([...alreadyReferenced]);
	if(Array.isArray(obj)) {
  	for (let item of obj) 
    	circles(item, new Set(alreadyReferenced));
  }
}

circles (c)

