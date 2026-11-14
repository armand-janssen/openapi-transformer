
# Types
&nbsp;

## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| name | Y | string | &nbsp; | <ul><li>minLength : 2</li><li>maxLength : 10</li><li>pattern : ^[a-z]+$</li></ul> | &nbsp; |
| born | &nbsp; | date | &nbsp; | &nbsp;<ul><li>pattern : yyyy-MM-dd</li></ul> | 2020-12-31 |
| seen | &nbsp; | date-time | &nbsp; | &nbsp; | &nbsp; |
| photo | &nbsp; | string [binary] | &nbsp; | &nbsp; | &nbsp; |
| secret | &nbsp; | string [byte] | &nbsp; | &nbsp; | &nbsp; |
| price | &nbsp; | number | &nbsp; | <ul><li>format : double</li><li>minimum : 0</li><li>maximum : 100.5</li><li>multipleOf : 0.5</li></ul> | &nbsp; |
| count | Y | integer | &nbsp; | <ul><li>format : int32</li><li>minimum : 1</li><li>maximum : 9</li></ul> | &nbsp; |
| active | &nbsp; | boolean | &nbsp; | &nbsp; | &nbsp; |
| tags | &nbsp; | array[] of strings | &nbsp; | <ul><li>minItems : 1</li><li>maxItems : 5</li><li>uniqueItems : true</li></ul> | &nbsp; |
| others | &nbsp; | array[] of Other | &nbsp; | &nbsp; | &nbsp; |
| mixed | &nbsp; | array[] of Other/Third | &nbsp; | &nbsp; | &nbsp; |
| single | &nbsp; | Other | &nbsp; | &nbsp; | &nbsp; |

# Other
&nbsp;

## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| id | &nbsp; | string | &nbsp; | &nbsp; | &nbsp; |

# Third
&nbsp;

## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| id | &nbsp; | string | &nbsp; | &nbsp; | &nbsp; |
