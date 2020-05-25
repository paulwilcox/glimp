import { print } from '../src/glimp.js';

let str = 'This is a string';
function func (a,b) { return a + b; }

let array = [
    { m: 'em', n: 'en', o: 2, p: true },
    { m: 'm', n: 'n', o: 4 },
    { m: 'mont', n: 'nev', o: 8, p: true },
    { m: 'mu', n: 'nu', o: 16, p: false },
    { m: 'moises', n: 'nancy', o: 32, p: p => p*2 },
    { m: 'mertyl', n: 'northern', o: 64, p: (p,q) => p*q },
    { m: 'muon', n: 'nanometer', o: 128, p: false },
    { m: 'mother', n: 'neice', o: 256, p: true },
    { m: 'millon', n: 'nueve', o: 1024, p: true },
    { m: 'may', n: 'no', o: 2048, p: false },
    { m: 'mechanic', n: 'navigator', o: 4096, p: true },
    { m: 'man', n: 'nick', o: 8192, p: false }
];

let object = { 
    a: 'eigh', 
    b: 1, 
    c: 0.555,
    d: 'delta',
    e: p => p/3,
    f: undefined,
    g: false
};

let large = [];
for (let i = 0; i <= 100; i++) 
    large.push({ a: i, b: i * 2});

document.body.innerHTML += `<div id='stringDiv'></div><br/>`
document.body.innerHTML += `<div id='funcDiv'></div><br/>`
document.body.innerHTML += `<div id='arrayDiv'></div><br/>`
document.body.innerHTML += `<div id='objectDiv'></div><br/>`
document.body.innerHTML += `<div id='largeDiv'></div><br/>`

print('#stringDiv', str);
print('#funcDiv', func);
print('#arrayDiv', array, 'Glimp Array');
print('#objectDiv', object);
print('#largeDiv', large);

function test () {}