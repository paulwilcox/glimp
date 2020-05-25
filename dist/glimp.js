/**
 * ISC License (ISC)
 * Copyright (c) 2019, Paul Wilcox <t78t78@gmail.com>
 * 
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

var printCss = `


.glimpString {
    color: #FF9900;
}

.glimpNumber {
    color: #0088cc;
}

.glimpNull {
    color: gainsboro;
    font-style: italic;
}

.glimpFunc {
    color: BB5500;
    font-family: monospace;
}

.glimpTable {
    border: 2px solid #0088CC;
    border-collapse: collapse;
    margin: 5px;
}

.glimpTable caption {
    border: 1px solid #0088CC;
    background-color: #0088CC;
    color: white;
    font-weight: bold;
    padding: 3px;
}

.glimpTable th {
    background-color: gainsboro;
    border: 1px solid #C8C8C8;
    padding: 3px;
}

.glimpTable td {
    border: 1px solid #C8C8C8;
    text-align: center;
    vertical-align: middle;
    padding: 3px;
}

.glimpTable tFoot {
    background-color: whitesmoke;
    font-style: italic;
    color: teal;
}

.glimpTable tFoot a {
    text-decoration: none;
    color: teal;
}

.glimpTable tFoot a.active {
    text-decoration: underline;
}

.glimpPageDiv {
    text-align: left;
    vertical-align: middle;
    font-size: smaller;
}

.glimpPageInputDiv * {
    display: inline-block;
}

.glimpPageInput {
    padding: 1px 3px;
    background-color: white;
    border: solid 1px blue;
    color: black;
    font-style: normal;
    min-width: 15px;
}

.glimpPageInputSubmit {
    height: 10px;
    width: 10px;
    margin: 0;
    padding: 0;
}

`;

/*
    jsFiddle paging:
   - https://stackoverflow.com/questions/19605078
   - https://jsfiddle.net/u9d1ewsh
*/

function addPagerToTables(
    tables, 
    rowsPerPage = 10, 
    aTagMax = 10,
    pageInputThreshold = null
) {

    tables = typeof tables == "string"
        ? document.querySelectorAll(tables)
        : tables;

    for (let table of [...tables]) 
        addPagerToTable(table, rowsPerPage, aTagMax, pageInputThreshold);

}

function addPagerToTable(
    table, 
    rowsPerPage = 10, 
    aTagMax = 10,
    pageInputThreshold = null
) {

    tableSet(table, 'rowsPerPage', rowsPerPage);
    tableSet(table, 'aTagMax', aTagMax);
    tableSet(table, 'pageInputThreshold', pageInputThreshold || aTagMax);
    tableSet(table, 'pages', Math.ceil( 
        table.querySelectorAll(':scope > tBody > tr').length
        / rowsPerPage
    ));    

    if(tableGet(table, 'pages') == 1)
        return;

    let colCount = 
        [...table.querySelector('tr').cells]
        .reduce((a,b) => a + parseInt(b.colSpan), 0);

    table.createTFoot().insertRow().innerHTML = `
        <td colspan=${colCount}>
            <div class="oneQueryPageDiv"></div>
        </td>
    `;

    insertPageLinks(table);
    insertPageInput(table);
    addPageInputListeners(table);
    changeToPage(table, 1);

}

function addAnchorClickEvents () {

    if (document.hasAnchorClickEvents)
        return;

    document.addEventListener('click', e => {
        if (!e.target.classList.contains('.oneQueryAnchor'))
            return;
        anchorOnClick(e);
    });

    document.hasAnchorClickEvents = true;

}

function anchorOnClick(e) {

    let table = e.target.closest('.oneQueryTable');
    let cPage = currentPage(table);
    let hasLt = e.target.innerHTML.substring(0,3) == '&lt';
    let hasGt = e.target.innerHTML.substring(0,3) == '&gt';
    let rel = e.target.rel;

    let toPage = 
        (hasLt && cPage == 1) ? table.pages
        : (hasGt && cPage == table.pages) ? 1
        : (hasLt && rel < 0) ? cPage - 1
        : (hasGt && rel < 0) ? cPage + 1
        : parseInt(rel) + 1;

    changeToPage(table, toPage);
    e.preventDefault();

}

function insertPageLinks(table) {

    let pageDiv = table.querySelector('.oneQueryPageDiv');

    let insertA = (rel,innerHtml) =>
        pageDiv.insertAdjacentHTML(
            'beforeend',
            `<a href='#' rel="${rel}" class='.oneQueryAnchor'>${innerHtml}</a> ` 
        );

    insertA(0,'<');
    insertA(-1,'<');

    for(let page = 1; page <= tableGet(table, 'pages'); page++) 
        insertA(page - 1,page);

    insertA(-1,'>');
    insertA(tableGet(table, 'pages') - 1,'>');

}

function insertPageInput(table) {

    let pageDiv = table.querySelector('.oneQueryPageDiv');

    if (tableGet(table, 'pages') < tableGet(table, 'pageInputThreshold'))
        return;

    pageDiv.insertAdjacentHTML(
        'beforeend',
        `
            <br/>
            <div class='oneQueryPageInputDiv' style='display:none;'>
                <div contenteditable='true' class='oneQueryPageInput'>1</div>
                <button class='oneQueryPageInputSubmit'></button>
            </div>
            <label class='oneQueryPageRatio'>
                ${tableGet(table, 'pages')} pages
            </label>
        `
    );

}

function showInputDiv (tbl, show) {
    if (!tbl.tFoot.querySelector('.oneQueryPageInputDiv'))
        return;
    tbl.tFoot.querySelector('.oneQueryPageInputDiv').style.display = 
        show ? 'inline-block' : 'none';
    tbl.tFoot.querySelector('.oneQueryPageRatio').style.display = 
        show ? 'none' : 'inline-block';
}

function addPageInputListeners (table) {

    if (!table.tFoot.querySelector('.oneQueryPageInputDiv'))
        return;

    let listen = (selector, event, callback) => 
        table.querySelector(selector)
        .addEventListener(event, callback); 

    table.addEventListener('mouseleave', e => {
        showInputDiv(e.target, false);
        table.querySelector('.oneQueryPageInput').innerHTML = "";
    });

    listen('.oneQueryPageRatio', 'mouseenter',
        e => showInputDiv(table, true)
    );

    listen('.oneQueryPageRatio', 'click',
        e => showInputDiv(table, true)
    );

    listen('.oneQueryPageInput', 'mouseenter',
        e => table.querySelector('.oneQueryPageInput').innerHTML = ''
    );

    listen('.oneQueryPageInputSubmit', 'click', e => {

        let pInput = table.querySelector('.oneQueryPageInput');
        let desiredPage = parseInt(pInput.innerHTML);

        if (isNaN(desiredPage)) {
            pInput.innerHTML = '';
            return;
        }

        changeToPage(table, desiredPage);

    });    

}

function changeToPage(table, page) {

    let startItem = (page - 1) * tableGet(table, 'rowsPerPage');
    let endItem = startItem + tableGet(table, 'rowsPerPage');
    let pageAs = table.querySelectorAll('.oneQueryPageDiv a');
    let tBodyRows = [...table.tBodies].reduce((a,b) => a.concat(b)).rows;

    for (let pix = 0; pix < pageAs.length; pix++) {

        let a = pageAs[pix];
        let aText = pageAs[pix].innerHTML;
        let aPage = parseInt(aText);
        let halfMax = Math.ceil(tableGet(table, 'aTagMax') / 2.0);

        page == aPage
            ? a.classList.add('active')
            : a.classList.remove('active');

        a.style.display =
            isNaN(aPage) ? 'inline-block'
            : aPage > page - halfMax && aPage < page + halfMax ? 'inline-block'
            : 'none';

        for (let trix = 0; trix < tBodyRows.length; trix++) 
            tBodyRows[trix].style.display = 
                (trix >= startItem && trix < endItem)
                ? 'table-row'
                : 'none';  

    }

}

function currentPage (table) {
    return parseInt(
        table.querySelector('.oneQueryPageDiv a.active').innerHTML
    );
}

function tableSet (
    table,
    dataAttributeName, 
    value
) {
    table.setAttribute(`data-${dataAttributeName}`, value);
}

function tableGet(
    table,
    dataAttributeName
) { 
    return parseInt(table.getAttribute(`data-${dataAttributeName}`));
}

function print (target, obj, caption) {

    addDefaultCss();
    addAnchorClickEvents();

    document.querySelector(target).innerHTML +=
        makeHtml(obj, caption);

    let maybeTables = 
        document.querySelector(target)
        .querySelectorAll('.glimpTable');

    if (maybeTables.length > 0)
        addPagerToTables(maybeTables);        

}

function makeHtml(obj, caption) {

    let printType = getPrintType(obj);

    return printType == 'arrayOfObjects' ? arrayOfObjectsToTable(obj, caption)
        : printType == 'array' ? arrayToTable(obj, caption)
        : printType == 'string' ? stringToHtml(obj)
        : printType == 'number' ? `<span class='glimpNumber'>${obj}</span>`
        : printType == 'null' ? `<span class='glimpNull'>${obj}</span>`
        : printType == 'function' ? functionToHtml(obj)
        : printType == 'object' ? objectToTable(obj)
        : `${obj}`;

}

function getPrintType (obj) {

    let isArray = Array.isArray(obj);        
    let isArrayOfObjects = false;

    if (isArray) {
        let len = obj.length;
        let keyCounts = Object.values(getArrayKeys(obj));
        let highlyUsedKeys = keyCounts.filter(kc => kc >= len * 0.75).length;
        isArrayOfObjects = 
            highlyUsedKeys >= keyCounts.length * 0.75 // highly structured;
            && keyCounts.length > 0; 
    }

    return isArrayOfObjects ? 'arrayOfObjects'
        : isArray ? 'array'
        : (obj == null || typeof obj == 'undefined') ? 'null'
        : typeof obj;

}

function getArrayKeys (array) {

    let keys = {};

    for(let item of array) 
    if (getPrintType(item) == 'object')
    for(let key of Object.keys(item))
        if(keys[key])
            keys[key] += 1;
        else 
            keys[key] = 1;

    return keys;

}

function stringToHtml (str) {
    return `
        <span class='glimpString'>
            ${ htmlEncode(str) }
        </span>
    `;
}

function functionToHtml (func) {
    return `
        <span class='glimpFunc'>
            ${ htmlEncode(func.toString()) }
        </span>
    `;
}

function objectToTable (obj) {
    
    let html = ``;

    for (let entry of Object.entries(obj))
        html += `
        <tr>
            <th>${entry[0]}</th>
            <td>${makeHtml(entry[1])}</td>
        </tr>
        `;

    return `<table class='glimpTable'>${html}</table>`;

}

function arrayToTable (items, caption) {
    
    let html = ``;

    for(let item of items) 
        html += `<tr><td>${makeHtml(item)}</td></tr>`;

    return `
        <table class='glimpTable'>
            ${caption != null ? `<caption>${caption}</caption>` : ''}
            ${html}
        </table>`;

}

function arrayOfObjectsToTable (objects, caption) {

    let keys = Object.keys(getArrayKeys(objects));
    
    let header = `<tr>`;
    for(let key of keys)
        header += `<th>${key}</th>`;
    header += `</tr>`;

    let body = ``;

    for(let obj of objects) {
        body += `<tr>`;
        if (getPrintType(obj) == 'object')
            for (let key of keys) 
                body += `<td>${makeHtml(obj[key])}</td>`;
        else 
            body += `<td colspan=${keys.length}>${makeHtml(obj)}</td>`;
        body += `</tr>`;
    }

    return `
        <table class='glimpTable'>
            ${caption != null ? `<caption>${caption}</caption>` : ''}
            <tHead>${header}</tHead>
            <tBody>${body}</tBody>
        </table>
    `;

}

function htmlEncode (str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\t/g, '&emsp;')
        .replace(/  /g, '&emsp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');
}

function addDefaultCss () {

    if (hasglimpCssRule())
        return;

    let style = document.createElement('style');
    style.type = 'text/css';

    style.appendChild(document.createTextNode(printCss));
    document.head.appendChild(style);

}

function hasglimpCssRule () {

    for(let sheet of document.styleSheets)
    for(let rule of sheet.rules)
        if(rule.selectorText.substring(0,5) == ".glimp")
            return true;

    return false; 

}

export { print };
