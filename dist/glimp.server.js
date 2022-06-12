/**
 * ISC License (ISC)
 * Copyright (c) 2019, Paul Wilcox <t78t78@gmail.com>
 * 
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

// TODO: make logic of when to put in 'caption' property
// TODO: make logic of when to do 'headers' property
// TODO: make a property for rounding numbers

function glimpNormalize$1 (
    obj, 
    options = {
        maxRows: 50, // maximum number of rows to print if it's an array
        highlyUsedKeyProp: 0.75, // 'highly used' keys are found at this rate in rows
        highlyStructuredArrayProp: 0.75, // rate of 'highly used' keys to be 'highly structured'
        highlyUsedKeyCount: 10, // 'highly used' keys are found at this # in rows
        highlyStructuredArrayCount: 2, // # of 'highly used' keys to be 'highly structured'
        convertObjectsToTables: true, // objects can remain as is, or be converted to tables
        _circularTracked: new Set()
    },
) {

    // Circular reference management
    if(options._circularTracked.has(obj))
        return '<circular>';
    options._circularTracked.add(obj);
    let normalize = (obj) => {
        // clone it, otherwise, a single list exists and multiple
        // references that are non-circular are picked up.
        options._circularTracked = new Set(options._circularTracked);
        return glimpNormalize$1(obj, options);
    };

    // Respect custom normalize logic
    if (obj && obj.glimpNormalize) {
        try {
            options._circularTracked = new Set(options._circularTracked);
            return obj.glimpNormalize(options);
        }
        catch(e) {
            if (e.message == 'Maximum call stack size exceeded')
                e.message += '\r\n' +  
                    '    Infinite loop calling custom glimpNormzlize method.  \r\n' + 
                    '    Is the "_circularTracked" parameter properly utilized?\r\n';
            throw (e);
        }
    }

    let objKeys = tryObjectKeys(obj, null);

    // If it's primitive, no need to normalize, nor to clone
    if(!Array.isArray(obj) && objKeys === null)
        return obj;

    // If keyed object, convert to array.  
    if (objKeys !== null) 
        if (options.convertObjectsToTables) {
            let clone = {};
            for(let entry of Object.entries(obj)) 
                clone[entry[0]] = normalize(entry[1]);
            return clone;
        }
        else {
            obj = Object.entries(obj).map(entry => ({ 
                key: entry[0], 
                value: normalize(entry[1]) 
            }));
        }
        // At this point, we should always be dealing with an array

    // Tally the # of times a key appears in a potentially tabular array.
    // This also tracks order, though with javascript internal logic   
    let arrayKeys = {};
    for(let item of obj) 
    for(let key of tryObjectKeys(item, []))
        if(!arrayKeys[key])
            arrayKeys[key] = { n: 1, order: arrayKeys.length };
        else 
            arrayKeys[key].n += 1;
    
    // Convert arrayKeys to array  
    arrayKeys = 
        Object.entries(arrayKeys)
        .sort(entry => entry[1].order)
        .map(entry => ({
            key: entry[0],
            n: entry[1].n
        }));

    // Identify keys as highly used or not 
    for(let item of arrayKeys) 
        item.isHighlyUsed = 
               item.n >= options.highlyUsedKeyCount
            || item.n >= arrayKeys.length * options.highlyUsedKeyProp;

    // Identify array as highly structured or not
    let highlyUsedKeyCount = arrayKeys.filter(k => k.isHighlyUsed).length; 
    let isHighlyStructured = 
           highlyUsedKeyCount >= arrayKeys.length * options.highlyStructuredArrayProp
        || highlyUsedKeyCount >= options.highlyStructuredArrayCount;
            
    // If not highly structured, just return it as a regular array
    if (!isHighlyStructured) 
        return obj.map(row => normalize(row));

    // Normalize the structured table.
    // Put non-structured properties into a '...' column.
    let highlyUsedArrayKeys = arrayKeys.filter(key => key.isHighlyUsed);
    let lowlyUsedArrayKeys = arrayKeys.filter(key => !key.isHighlyUsed);
    let table = {
        columns: highlyUsedArrayKeys.map(item => item.key),
        rows: []
    };
    if (lowlyUsedArrayKeys.length > 0)
        table.columns.push('...');
    for (
        let r = 0; 
        r < obj.length && r < options.maxRows; 
        r++
    ) {
        let row = obj[r];

        let convertedRow = {};
        
        for (let item of highlyUsedArrayKeys) 
            convertedRow[item.key] = normalize(row[item.key]);

        if (lowlyUsedArrayKeys.length > 0) 
            convertedRow['...'] = {};
        for (let item of lowlyUsedArrayKeys)
            if (row[item.key])
                convertedRow['...'][item.key] = normalize(row[item.key]);

        table.rows.push(convertedRow);        
    }
    if (obj.caption)
        table.caption = obj.caption;
    return table;

}

// Return the keys of a non-primitive, non-array object.
function tryObjectKeys (
    obj, 
    nonObjectOutput // usually either 'null' or '[]' 
) {
    try {
        if (typeof(obj) === 'string' || obj instanceof String)
            return nonObjectOutput;
        if (Array.isArray(obj))
            return nonObjectOutput;
        return Object.keys(obj);
    }
    catch {
        return nonObjectOutput;
    }
}

let glimpNormalize = glimpNormalize$1;

/*
function tableToString (
    data, 
    caption,
    mapper = x => x, 
    limit = 50, 
    headers = true,
    preferEmptyString = true, // if false, '<null>' and '<undefined>' can show
    bordersBefore = null // [[a,b,c],[x,y,z]], borders before resp. row and col ix posits
) {

    if (self.isToStringOverwritten(data)) 
        return data.toString();

    let props = [];
    let vals = [];

    if (data.length == 0) {
        data = [{ empty: '' }];
        headers = false;
    }

    let safeToString = (val) =>  
            val === null ? (preferEmptyString ? '' : '<null>') 
        : val === undefined ? (preferEmptyString ? '' : '<undefined>')
        : val.toString();

    // Initially, values are multi-line.  Even if just 
    // one line they're represented as an array.
    let toStringArray = (val) => safeToString(val).split(`\r\n`);

    for(let r = 0; r < data.length; r++) {
        
        if (r >= limit)
            break;

        let row = mapper(data[r]);
        if (row == null)
            row = '<null>';

        if (typeof row === 'object') 
            row = self.noUndefined(row);
        else 
            row = { '<primitive>': row }; 

        let rowVals = [];
        let rowProps = Object.getOwnPropertyNames(row);

        // force the order of props in previous rows
        for(let i = 0; i < props.length; i++) {
            let prop = props[i];
            let arrayVal = toStringArray(row[prop]);
            rowVals.push(arrayVal);
        }

        // add new props if not previously known
        for(let i = 0; i < rowProps.length; i++) {
            let prop = rowProps[i];
            let arrayVal = toStringArray(row[prop]);

            if (!props.includes(prop)) {
                props.push(prop);
                rowVals.push(arrayVal);
            }
        }

        // spread out the arrayVals into different lines
        // [['one line'],['two','lines']] becomes 
        // [['one line', 'two'], ['', 'lines']]
        let maxLen = Math.max(...rowVals.map(arrayVal => arrayVal.length));
        for(let i = 0; i < maxLen; i++) {
            let flattened = [];
            for (let arrayVal of rowVals) 
                flattened.push(arrayVal[i] || '');
            vals.push(flattened);
        }

    }    

    let lengths = [];

    for (let i = 0; i < props.length; i++) 
        lengths[i] = Math.max(
            ...vals.map(row => safeToString(row[i]).length), 
            headers ? props[i].length : 0
        );

    for(let i = 0; i < props.length; i++)
        props[i] = props[i].padEnd(lengths[i]);

    for(let row of vals)
        for(let i = 0; i < props.length; i++) 
            row[i] = safeToString(row[i]).padEnd(lengths[i]);

    let chr = (notBb,bb) => bordersBefore ? bb : notBb;
    let tl = chr('\u250c', '\u2554');
    let tm = chr('\u252c', '\u2564');
    let tr = chr('\u2510', '\u2557');
    let ml = chr('\u251c', '\u2560');
    let mm = chr('\u253c', '\u256a');
    let mr = chr('\u2524', '\u2563');
    let bl = chr('\u2514', '\u255a');
    let bm = chr('\u2534', '\u2567');
    let br = chr('\u2518', '\u255d');
    let hz = chr('\u2500', '\u2550');
    let vl = chr('\u2502', '\u2551');
    let vm = chr('\u2502', '\u250a');
    let vr = chr('\u2502', '\u2551');
    let nl = '\r\n';
    let sp = ' ';

    let topBorder = tl+hz + lengths.map(l => ''.padStart(l,hz+hz+hz)).join(hz+tm+hz) + hz+tr+nl;
    let headerRow = vl+sp + props.join(sp+vm+sp) + sp+vr+nl;
    let divider = ml+hz + lengths.map(l => ''.padStart(l,hz+hz+hz)).join(hz+mm+hz) + hz+mr+nl;
    let dataRows = vals.map(row => vl+sp + row.join(sp+vm+sp) + sp+vr).join(nl) + nl;
    let botBorder = bl+hz + lengths.map(l => ''.padStart(l,hz+hz+hz)).join(hz+bm+hz) + hz+br;

    // add special row borders
    if (bordersBefore && bordersBefore[0]) {
        dataRows = dataRows.split(nl)
        let bbRev = [...bordersBefore[0]];
        bbRev.reverse();
        for (let bb of bbRev)
            dataRows.splice(bb, 0, 
                divider
                    .replace(new RegExp(hz,'g'), '\u2550')
                    .replace(nl,'')
            );
        dataRows = dataRows.join(nl);
    }

    let result = 
        topBorder +
        (headers ? headerRow : '') + 
        (headers ? divider : '') +
        dataRows +
        botBorder;

    // add special column borders
    if (bordersBefore && bordersBefore[1]) {

        bordersBefore[1] = // convert col posit to char posit
            [...topBorder]
            .map((chr,ix) => chr == tm ? ix : null)
            .filter(ix => ix !== null)
            .filter((x,ix) => bordersBefore[1].includes(ix));

        for(let bb of bordersBefore[1]) {
            let replacer = (val,rep) => 
                result.replace(new RegExp(`(?<=^.{${bb}})${val}`,'gm'), rep);
            result = replacer(vm,vl);
            result = replacer(tm, '\u2566');
            result = replacer(mm, '\u256c');
            result = replacer(bm, '\u2569');
        }

    }

    result = (caption ? (caption+nl) : '') + result;
    return result;

}
*/

exports.glimpNormalize = glimpNormalize;
