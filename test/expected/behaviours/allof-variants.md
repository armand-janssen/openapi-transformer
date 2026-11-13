
# Parent
&nbsp;

## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| id | &nbsp; | string | &nbsp; | &nbsp; | &nbsp; |

# OneInline
Parent plus one inline object.


## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| a | Y | string | &nbsp; | &nbsp; | &nbsp; |

# SeveralInline
Parent plus two inline objects, each with its own required list.


## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| first | Y | string | &nbsp; | &nbsp; | &nbsp; |
| second | Y | integer | &nbsp; | &nbsp; | &nbsp; |

# SeveralParents
Two referenced members; the first is the parent.


## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| own | &nbsp; | string | &nbsp; | &nbsp; | &nbsp; |
| owner | &nbsp; | Parent | &nbsp; | &nbsp; | &nbsp; |

# ParentInFile
Parent lives in another file.


## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| extra | &nbsp; | string | &nbsp; | &nbsp; | &nbsp; |

# Base
&nbsp;

## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| baseId | &nbsp; | string | &nbsp; | &nbsp; | &nbsp; |
