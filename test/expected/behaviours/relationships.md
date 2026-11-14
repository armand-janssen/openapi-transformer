
# Owner
The root description.


## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| id | Y | string | Identifier. | &nbsp; | abc-1 |
| pet | &nbsp; | Pet | &nbsp; | &nbsp; | &nbsp; |
| toys | &nbsp; | array[] of Toy | &nbsp; | &nbsp; | &nbsp; |
| things | &nbsp; | array[] of Pet/Toy | &nbsp; | &nbsp; | &nbsp; |
| notes | &nbsp; | string | First line.<br/>Second line with a \| pipe.<br/><span style="color:red"> **TODO** </span> fix this later. | &nbsp; | line one<br/>line two |

# Pet
A pet, with a multi-line description.
| a | b |
<span style="color:red"> **TODO** </span>: add more.



## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| name | &nbsp; | string | &nbsp; | &nbsp; | Rex |

# Toy
A toy with a | pipe in its description.


## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| color | Y | string | &nbsp; | &nbsp; | &nbsp; |

# Dog
A dog.


## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| bark | &nbsp; | boolean | &nbsp; | &nbsp; | &nbsp; |
