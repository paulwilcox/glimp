
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

let glimpToString = (val, preferEmptyString) => {
    return  val === null ? (preferEmptyString ? '' : '<null>') 
        : val === undefined ? (preferEmptyString ? '' : '<undefined>')
        : val.glimpType === 'object' ? objectToString(val)
        : val.glimpType === 'array' ? arrayToString(val)
        : val.glimpType === 'table' ? tableToString(val)
        : typeof val === 'string' ? val // TODO: expand to cover other way to be a string
        : val.toString();
}

let objectToString = (
    obj 
) => {
    return '<object - not implemented>'
}

let arrayToString = (
    array 
) => {
    for (let row of array)
        console.log('row:', glimpToString(row))
    return array.map(row => glimpToString(row)).join(nl);
}

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

    if (vm === undefined)
        throw 'tableToString has lost access to convenience characters';

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
                glimpToString(row[col], preferEmptyString) // internal bordres don't pass
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
                lines.push(line);''
            }

            return lines.join(nl);

        })
        .join(nl) + nl;
    let botBorder = 
        _bl+_hz + 
        orderedColWidths.map(l => ''.padStart(l,_hz+_hz+_hz)).join(_hz+_bm+_hz) + 
        _hz+_br;

    // Add the special row borders if requested
    if (internalRowBorders) {
        dataRows = dataRows.split(nl)
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
    result = (table.glimpCaption ? (table.glimpCaption+nl) : '') + result;
    return result;

}


let glimpNormalize = require('../dist/glimp.server.js').glimpNormalize;

class complex {

    constructor () {
        this.name = 'dummy';
        this.array = [
            { a: 'eight', b: 'bee', /*c: { val: 'see', val2: 'now' }*/ },
            { a: 'aye', b: 'bea', /*c: { val: 'sea', val2: 'ward' },*/ d: 'rare' },
            { a: 'a', b: 'b', /*c: { val: 'c', val2: 'c' }m*/ d: this }
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
let normalized = glimpNormalize(c); 
console.log(normalized);
console.log(glimpToString(normalized));
