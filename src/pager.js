/*
    jsFiddle paging:
   - https://stackoverflow.com/questions/19605078
   - https://jsfiddle.net/u9d1ewsh
*/

export function addPagerToTables(
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

export function addPagerToTable(
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
            <div class="glimpPageDiv"></div>
        </td>
    `;

    insertPageLinks(table);
    insertPageInput(table);
    addPageInputListeners(table);
    changeToPage(table, 1);

}

export function addAnchorClickEvents () {

    if (document.hasAnchorClickEvents)
        return;

    document.addEventListener('click', e => {
        if (!e.target.classList.contains('.glimpAnchor'))
            return;
        anchorOnClick(e);
    });

    document.hasAnchorClickEvents = true;

}

function anchorOnClick(e) {

    let table = e.target.closest('.glimpTable')
    let cPage = currentPage(table);
    let hasLt = e.target.innerHTML.substring(0,3) == '&lt';
    let hasGt = e.target.innerHTML.substring(0,3) == '&gt';
    let rel = e.target.rel;

    let toPage = 
        hasLt && cPage == 1 ? tableGet(table, 'pages')
        : hasGt && cPage == tableGet(table, 'pages') ? 1
        : hasLt && rel < 0 ? cPage - 1
        : hasGt && rel < 0 ? cPage + 1
        : parseInt(rel) + 1;

    changeToPage(table, toPage);
    e.preventDefault();

}

function insertPageLinks(table) {

    let pageDiv = table.querySelector('.glimpPageDiv');

    let insertA = (rel,innerHtml) =>
        pageDiv.insertAdjacentHTML(
            'beforeend',
            `<a href='#' rel="${rel}" class='.glimpAnchor'>${innerHtml}</a> ` 
        );

    insertA(0,'<');
    insertA(-1,'<');

    for(let page = 1; page <= tableGet(table, 'pages'); page++) 
        insertA(page - 1,page);

    insertA(-1,'>');
    insertA(tableGet(table, 'pages') - 1,'>');

}

function insertPageInput(table) {

    let pageDiv = table.querySelector('.glimpPageDiv');

    if (tableGet(table, 'pages') < tableGet(table, 'pageInputThreshold'))
        return;

    pageDiv.insertAdjacentHTML(
        'beforeend',
        `
            <br/>
            <div class='glimpPageInputDiv' style='display:none;'>
                <div contenteditable='true' class='glimpPageInput'>1</div>
                <button class='glimpPageInputSubmit'></button>
            </div>
            <label class='glimpPageRatio'>
                ${tableGet(table, 'pages')} pages
            </label>
        `
    );

}

function showInputDiv (tbl, show) {
    if (!tbl.tFoot.querySelector('.glimpPageInputDiv'))
        return;
    tbl.tFoot.querySelector('.glimpPageInputDiv').style.display = 
        show ? 'inline-block' : 'none';
    tbl.tFoot.querySelector('.glimpPageRatio').style.display = 
        show ? 'none' : 'inline-block';
}

function addPageInputListeners (table) {

    if (!table.tFoot.querySelector('.glimpPageInputDiv'))
        return;

    let listen = (selector, event, callback) => 
        table.querySelector(selector)
        .addEventListener(event, callback); 

    table.addEventListener('mouseleave', e => {
        showInputDiv(e.target, false);
        table.querySelector('.glimpPageInput').innerHTML = "";
    });

    listen('.glimpPageRatio', 'mouseenter',
        e => showInputDiv(table, true)
    );

    listen('.glimpPageRatio', 'click',
        e => showInputDiv(table, true)
    );

    listen('.glimpPageInput', 'mouseenter',
        e => table.querySelector('.glimpPageInput').innerHTML = ''
    );

    listen('.glimpPageInputSubmit', 'click', e => {

        let pInput = table.querySelector('.glimpPageInput');
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
    let pageAs = table.querySelectorAll('.glimpPageDiv a');
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
        table.querySelector('.glimpPageDiv a.active').innerHTML
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