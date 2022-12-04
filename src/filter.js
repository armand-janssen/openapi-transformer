const { Schema } = require("yaml/types");

function openItem(v, d){
    return {value:v, depth:d};
}

function filterByMainSchema(allSchemas,mainSchemaName,depth){

    let filteredSchemas = {};
    
    const builtinTypes = ['string','number','integer','boolean','date','date-time','float','double','int32','int64'];
    let openSchemaNames = [openItem(mainSchemaName,0)];
    let visitedNames = [];

    while(openSchemaNames.length > 0){
        let firstItem = openSchemaNames.pop();
        visitedNames.push(firstItem.value);

        let schema = allSchemas[firstItem.value];
        if(schema==null)
            continue;
        
        filteredSchemas[schema.name] = schema;

        if(firstItem.depth >= depth || schema.properties === undefined || schema.properties.length === 0)
            continue;

        schema.properties.forEach((property) => {
                let _type = property.type.replace('array[] of ','');
                if(builtinTypes.findIndex(e => e === _type)==-1 &&
                    visitedNames.findIndex(e => e === _type) ==-1)
                    openSchemaNames.push(openItem(_type,firstItem.depth+1));
            });
    }

    return filteredSchemas;
}

module.exports = { filterByMainSchema };