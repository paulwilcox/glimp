
// TODO: make logic of when to put in 'caption' property
// TODO: make logic of when to do 'headers' property
// TODO: make a property for rounding numbers

export default function glimpNormalize (
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
        return glimpNormalize(obj, options);
    }

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
