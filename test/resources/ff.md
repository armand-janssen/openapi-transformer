
# owner
Owner information

| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| name | Y | string | the name of the owner | <ul><li>minLength : 1</li><li>maxLength : 30</li></ul> | John Doe |
| from | Y | date | the date the owner, bought the vehicle | <ul><li>pattern : yyyy-MM-dd</li></ul> | 2018-08-24 |
| to | &nbsp; | date | the date the owner, sold the vehicle<br/> | <ul><li>pattern : yyyy-MM-dd</li></ul> | 2019-07-28 |
| age | Y | integer | the age of the owner<br/><br/><span style="color:red"> **TODO** </span><br/>Howto determine age?<br/> | <ul><li>minimum : 15</li><li>maximum : 120</li><li>multipleOf : 1</li></ul> | 23 |
| nicknames | &nbsp; | array[] of strings | the nicknames of the owner | <ul><li>minItems : 1</li><li>maxItems : 5</li><li>uniqueItems : true</li></ul> | &nbsp; |
| gender | &nbsp; | enum | the gender of the owner | <ul><li>male</li><li>female</li></ul> | &nbsp; |
| file1 | &nbsp; | string [binary] | &nbsp; | &nbsp; | &nbsp; |
| file2 | &nbsp; | string [byte] | the second file | &nbsp; | &nbsp; |
| shoeSize | &nbsp; | integer | &nbsp; | &nbsp; | &nbsp; |
| someDouble | &nbsp; | integer | &nbsp; | <ul><li>format : double</li></ul> | &nbsp; |
| pipe | &nbsp; | string | Also a \| here | <ul><li>pattern : ^(nl\|NL\|Nederland)$</li></ul> | A pipe in the example \| |
