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

// TODO: make a property for rounding numbers

function glimpNormalize$1 (
    obj, 
    options = {
        maxRows: 50, // maximum number of rows to print if it's an array
        highlyUsedKeyProp: 0.75, // 'highly used' keys are found at this rate in rows
        highlyStructuredArrayProp: 0.75, // rate of 'highly used' keys to be 'highly structured'
        highlyUsedKeyCount: 10, // 'highly used' keys are found at this # in rows
        highlyStructuredArrayCount: 2, // # of 'highly used' keys to be 'highly structured'
        convertObjectsToArrays: true, // objects can remain as is, or be converted to tables
        _circularTracked: new Set()
    },
) {

    // Circular reference management
    if(options._circularTracked.has(obj))
        return '<circular>';
    try {
        obj.glimpIsReferenceType = true; // if it's primitive, this property won't set
        options._circularTracked.add(obj);
    }
    catch (e) {
        if (!e.message.startsWith('Cannot create property'))
            throw e;
    }
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

    // If object, and no conversion to array, 
    // then clone, normalize props, and return.
    if (objKeys !== null && !options.convertObjectsToArrays) {
        let clone = {};
        for (let [key, value] of Object.entries(obj)) 
            clone[key] = 
                key.startsWith('glimp') 
                ? value 
                : normalize(value);
        clone.glimpType = 'object';
        return clone;
    }

    // If keyed object, and conversion desired, then convert it.  
    if (objKeys !== null && options.convertObjectsToArrays) { 

        let clone = [];
        clone = copyGlimpProps(obj, clone);
        clone.glimpHeaders = false;

        for (let [key, value] of Object.entries(obj)) 
            if (key.startsWith('glimp'))  
                clone[key] = value; 
            else 
                clone.push({ key, value /*normalization comes later*/ });

        obj = clone;

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
    if (!isHighlyStructured) {
        let ar = obj.map(row => normalize(row));
        ar = copyGlimpProps(obj, ar);
        ar.glimpType = 'array'; 
        return ar;
    }
    
    // Split keys into highly vs lowly used
    let highlyUsedArrayKeys = arrayKeys.filter(key => key.isHighlyUsed);
    let lowlyUsedArrayKeys = arrayKeys.filter(key => !key.isHighlyUsed);

    // Create the table object to house restructured data
    let table = {
        glimpType: 'table',
        columns: highlyUsedArrayKeys.map(item => item.key),
        rows: []
    };
    table = copyGlimpProps(obj, table);
    if (lowlyUsedArrayKeys.length > 0) // Lowly used keys go into '...' column.
        table.columns.push('...');

    // Populate the table
    for (
        let r = 0; 
        r < obj.length && r < options.maxRows; 
        r++
    ) {
        let row = obj[r];

        let convertedRow = {};
        
        for (let item of highlyUsedArrayKeys) 
            convertedRow[item.key] = normalize(row[item.key]);

        if (lowlyUsedArrayKeys.length > 0) {
            let excess = {};
            for (let item of lowlyUsedArrayKeys) 
                if (row[item.key])
                    excess[item.key] = row[item.key];
            excess = normalize(excess);
            convertedRow['...'] = excess;
        }

        table.rows.push(convertedRow);        
    }

    // table terminations
    return table;

}

function copyGlimpProps(sourceObj, targetObj) {
    if (sourceObj.glimpCaption) 
        targetObj.glimpCaption = sourceObj.glimpCaption;
    if (sourceObj.glimpHeaders) 
        targetObj.glimpHeaders = sourceObj.glimpHeaders;
    return targetObj;
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

function glimpToString$1 (val, preferEmptyString) {
    return  val === null ? (preferEmptyString ? '' : '<null>') 
        : val === undefined ? (preferEmptyString ? '' : '<undefined>')
        : val.glimpType === 'object' ? objectToString()
        : val.glimpType === 'array' ? arrayToString(val)
        : val.glimpType === 'table' ? tableToString(val)
        : typeof val === 'string' ? val // TODO: expand to cover other way to be a string
        : val.toString();
}


// convenience character variables
var tl = '\u250c'; // top-left
var tm = '\u252c'; // top-middle
var tr = '\u2510'; // top-right
var ml = '\u251c'; // middle-left
var mm = '\u253c'; // middle-middle
var mr = '\u2524'; // middle-right
var bl = '\u2514'; // bottom-left
var bm = '\u2534'; // bottom-middle
var br = '\u2518'; // bottom-right
var hz = '\u2500'; // horizontal
var vl = '\u2502'; // vertical-left
var vm = '\u2502'; // vertical-middle
var vr = '\u2502'; // vertical-right
var nl = '\r\n';
var sp = ' ';

let objectToString = (
    obj 
) => {
    return '<object - not implemented>'
};

let arrayToString = (
    array 
) => {
    return array.map(row => glimpToString$1(row)).join(nl);
};

let tableToString = (

    // The table produced out of glimpNormalize
    table, 

    // If true, '' instead of '<null>' or '<undefined>' 
    preferEmptyString = true, 

    // Numeric array.  Add special row borders before the stated indices. 
    internalRowBorders = null,  
    
    // Numeric array.  Add special column borders before the stated indices
    internalColBorders = null 

) => {

    // Override borders if there are internal borders
    let _tl = tl; let _tm = tm; let _tr = tr;
    let _ml = ml; let _mm = mm; let _mr = mr;
    let _bl = bl; let _bm = bm; let _br = br;
    let _vl = vl; let _vm = vm; let _vr = vr;
    let _hz = hz;
    if (internalColBorders || internalRowBorders) {
        _tl = '\u2554'; _tm = '\u2564'; _tr = '\u2557';
        _ml = '\u2560'; _mm = '\u256a'; _mr = '\u2563';
        _bl = '\u255a'; _bm = '\u2567'; _br = '\u255d';
        _vl = '\u2551'; _vm = '\u250a'; _vr = '\u2551';
        _hz = '\u2550'; 
    }

    let columns = table.columns;
    let rows = table.rows;

    if (rows.length == 0) 
        return '<empty table>'

    // To capture how wide, in characters, a column has to be.
    // Starts with header lenghts, widened by value lengths.
    let colWidths = {};
    for(let col of columns) 
        colWidths[col] = col.length;

    // Convert row values to string representations.
    // These will actually be string arrays, to accomodate multiple lines.
    for(let _row of rows) {
        
        let row = 
              _row === null ? '<null>'
            : _row === undefined ? '<undefined>'
            : typeof _row !== 'object' ? '<non-object>' // perhaps better handling later
            : _row; 

        // Convert row values to string arrays.
        let rowHeight = 0; // number of lines the row needs to accomodate
        for(let col of columns) {
            row[col] = 
                glimpToString$1(row[col], preferEmptyString) // internal bordres don't pass
                .split(`\r\n`);
            rowHeight = Math.max(rowHeight, row[col].length);

            colWidths[col] = Math.max(
                colWidths[col], 
                ...row[col].map(val => val.length)
            );
        }

        // All row values (arrays of strings), 
        // must be set to the same array length.
        // So push blank lines if necessary.
        for(let col of columns)
        for(let line = 1; line <= rowHeight; line++) 
            if(row[col].length < line)
                row[col].push('');     

    }    

    // Pad the header values to reach the column widths
    let paddedHeaders = 
        columns
        .map(col => col.padEnd(colWidths[col]));

    // Pad the row values to reach the column widths.
    // Then condense row values from arrays back into strins
    for (let row of rows)
    for (let col of columns) {
        for (let ln = 0; ln < row[col].length; ln++) 
            row[col][ln] = row[col][ln].padEnd(colWidths[col]);
    }

    let orderedColWidths = columns.map(col => colWidths[col]);
    let topBorder = 
        _tl+_hz + 
        orderedColWidths.map(l => ''.padStart(l,_hz+_hz+_hz)).join(_hz+_tm+_hz) + 
        _hz+_tr+nl;
    let headerRow = 
        _vl+sp + 
        paddedHeaders.join(sp+_vm+sp) + 
        sp+_vr+nl;
    let divider = 
        _ml+_hz + 
        orderedColWidths.map(l => ''.padStart(l,_hz+_hz+_hz)).join(_hz+_mm+_hz) + 
        _hz+_mr+nl;
    let dataRows = 
        rows.map(row => {

            // Remember that at this point, cells within a 
            // row are string arrays of the same length.
            // So you can get the length of any one cel and
            // you get the desired length for the row.
            let rowHeight = row[columns[0]].length; 

            // Cells are string array values of the same length within a row.
            // Create a single string for each line position. 
            let lines = [];
            for(let lineNum = 0; lineNum < rowHeight; lineNum++) {
                let line = 
                    columns
                    .map(col => row[col][lineNum])
                    .join(sp+_vm+sp);
                line = _vl+sp + line + sp+_vr;
                lines.push(line);            }

            return lines.join(nl);

        })
        .join(nl) + nl;
    let botBorder = 
        _bl+_hz + 
        orderedColWidths.map(l => ''.padStart(l,_hz+_hz+_hz)).join(_hz+_bm+_hz) + 
        _hz+_br;

    // Add the special row borders if requested
    if (internalRowBorders) {
        dataRows = dataRows.split(nl);
        for (let position of internalRowBorders.reverse())
            dataRows.splice(position, 0, 
                divider
                .replace(new RegExp(_hz,'g'), '\u2550')
                .replace(nl,'')
            );
        dataRows = dataRows.join(nl);
    }

    // put it all together
    let result = 
        topBorder +
        (table.glimpHeaders ? headerRow : '') + 
        (table.glimpHeaders ? divider : '') +
        dataRows +
        botBorder;

    // Add the special column borders if requested
    if (internalColBorders) {

        // convert col posit to char posit
        internalColBorders = 
            [...topBorder]
            .map((chr,ix) => chr == tm ? ix : null)
            .filter(ix => ix !== null)
            .filter((x,ix) => internalColBorders.includes(ix));

        for(let position of internalColBorders) {
            let replacer = (val,rep) => 
                result.replace(new RegExp(`(?<=^.{${position}})${val}`,'gm'), rep);
            result = replacer(_vm,_vl);
            result = replacer(_tm, '\u2566');
            result = replacer(_mm, '\u256c');
            result = replacer(_bm, '\u2569');
        }

    }

    // terminations
    result = (table.glimpCaption ? (sp+table.glimpCaption+nl) : '') + result;
    return result;

};

let glimpNormalize = glimpNormalize$1;
let glimpToString = glimpToString$1;

exports.glimpNormalize = glimpNormalize;
exports.glimpToString = glimpToString;
