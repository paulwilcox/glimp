let glimpNormalize = require('../dist/glimp.server.js').glimpNormalize;

class complex {

    constructor () {
        this.name = 'dummy'
        this.array = [
            { a: 'eight', b: 'bee', c: { val: 'see', val2: 'now' } },
            { a: 'aye', b: 'bea', c: { val: 'sea', val2: 'ward' }, d: 'rare' },
            { a: 'a', b: 'b', c: { val: 'c', val2: 'c' }, d: this }
        ]
    }
    
    glimpNormalize(options) {
        let normalized = glimpNormalize(this.array, options);
        normalized.glimpCaption = this.name;
        return normalized;
    }

}

let c = new complex();
let normalized = glimpNormalize(c); 
console.log(tableToString(normalized));


function tableToString (

    // The table produced out of glimpNormalize
    table, 

    // If true, '' instead of '<null>' or '<undefined>' 
    preferEmptyString = true, 

    // Numeric array.  Add special row borders before the stated indices. 
    internalRowBorders = null,  
    
    // Numeric array.  Add special column borders before the stated indices
    internalColBorders = null 

) {

// TODO: Cohsider changing behavior of empty tables.

    // If no rows, force a table with a row, but kill the headers.
    // This allows later code to still apply.  It minimizes the 
    // custom logic for this situation.
    if (table.rows.length == 0) {
        table.rows = [{ empty: '' }];
        table.glimpHeaders = false;
    }

    let safeToString = (val) =>  
          val === null ? (preferEmptyString ? '' : '<null>') 
        : val === undefined ? (preferEmptyString ? '' : '<undefined>')
        : val.toString();

    // To capture how wide, in characters, a column has to be.
    // Starts with header lenghts, widened by value lengths.
    let colWidths = {};
    for(let col of table.columns) 
        colWidths[col] = col.length;

    // Convert row values to string representations.
    // These will actually be string arrays, to accomodate multiple lines.
    for(let _row of table.rows) {
        
        let row = 
              _row === null ? '<null>'
            : _row === undefined ? '<undefined>'
            : typeof _row !== 'object' ? '<non-object>' // perhaps better handling later
            : _row; 

        // Convert row values to string arrays.
        let rowHeight = 0; // number of lines the row needs to accomodate
        for(let col of table.columns) {
            row[col] = safeToString(row[col]).split(`\r\n`);
            rowHeight = Math.max(rowHeight, row[col].length);
            colWidths[col] = Math.max(
                colWidths[col], 
                ...row[col].map(val => val.length)
            );
        }

        // All row values (arrays of strings), 
        // must be set to the same array length.
        // So push blank lines if necessary.
        for(let col of table.columns)
        for(let line = 1; line <= rowHeight; line++) 
            if(row[col].length < line)
                row.col.push('');     

    }    

    // Pad the row values to reach the column widths.
    // Do before padding headers as these get referenced here
    for (let row of table.rows)
    for (let col of table.columns)
    for (let ln = 0; ln < row[col].length; ln++) 
        row[col][ln] = row[col][ln].padEnd(colWidths[col]);

    // Pad the header values to reach the column widths
    for (let c = 0; c < table.columns.length; c++) {
        let col = table.columns[c];
        table.columns[c] = col.padEnd(colWidths[col]);
    }

    // convenience character variables
    let chr = (notBb,bb) => internalColBorders || internalRowBorders ? bb : notBb;
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

    let orderedColWidths = table.columns.map(col => colWidths[col]);
    let topBorder = tl+hz + orderedColWidths.map(l => ''.padStart(l,hz+hz+hz)).join(hz+tm+hz) + hz+tr+nl;
    let headerRow = vl+sp + table.columns.join(sp+vm+sp) + sp+vr+nl;
    let divider = ml+hz + orderedColWidths.map(l => ''.padStart(l,hz+hz+hz)).join(hz+mm+hz) + hz+mr+nl;
    let dataRows = 
        table.rows
        .map(row => {
            let orderedRow = table.columns.map(col => row[col]);
            return vl+sp + orderedRow.join(sp+vm+sp) + sp+vr
        })
        .join(nl) + nl;
    let botBorder = bl+hz + orderedColWidths.map(l => ''.padStart(l,hz+hz+hz)).join(hz+bm+hz) + hz+br;

    // Add the special row borders if requested
    if (internalRowBorders) {
        dataRows = dataRows.split(nl)
        for (let position of internalRowBorders.reverse())
            dataRows.splice(position, 0, 
                divider
                .replace(new RegExp(hz,'g'), '\u2550')
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
            result = replacer(vm,vl);
            result = replacer(tm, '\u2566');
            result = replacer(mm, '\u256c');
            result = replacer(bm, '\u2569');
        }

    }

    // terminations
    result = (table.glimpCaption ? (table.glimpCaption+nl) : '') + result;
    return result;

}