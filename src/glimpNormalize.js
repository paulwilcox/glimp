
// TODO: make a property for rounding numbers

export default function glimpNormalize (
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
