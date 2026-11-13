
# vehicle
A generic vehicle. Multiline, just to prove it works :)



## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| type | Y | enum | Type of vehicle based on the movement technology. Hybrid vehicle is not possible. | <ul><li>land</li><li>air</li><li>water</li></ul> | &nbsp; |
| owner | Y | array[] of owner | the history of owners | <ul><li>minItems : 1</li></ul> | &nbsp; |
| registration | Y | registration | &nbsp; | &nbsp; | &nbsp; |

# landVehicle
A vechicle that can drive.


## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| wheels | Y | integer | the number of wheels | <ul><li>minimum : 2</li><li>maximum : 4</li><li>multipleOf : 2</li></ul> | 2 |

# waterVehicle
A vechicle that can float.


## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| propeller | Y | integer | the number of propeller | <ul><li>minimum : 1</li><li>maximum : 4</li></ul> | 2 |

# airVehicle
A vehicle that can fly.


## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| name | &nbsp; | string | the name of this type of Air vehicle | <ul><li>maxLength : 20</li></ul> | &nbsp; |
| engines | Y | integer | the number of engines | <ul><li>minimum : 1</li><li>maximum : 6</li></ul> | 4 |
| typeOfEngine | Y | enum | The type of engines | <ul><li>turbojet</li><li>turboprop</li><li>turbofan</li><li>turboshaft</li></ul> | &nbsp; |

# owner
Owner information


## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| name | Y | string | the name of the owner | <ul><li>minLength : 1</li><li>maxLength : 30</li></ul> | John Doe |
| from | Y | date | the date the owner, bought the vehicle | &nbsp;<ul><li>pattern : yyyy-MM-dd</li></ul> | 2018-08-24 |
| to | &nbsp; | date | the date the owner, sold the vehicle<br/> | &nbsp;<ul><li>pattern : yyyy-MM-dd</li></ul> | 2019-07-28 |
| age | Y | integer | the age of the owner<br/><br/><span style="color:red"> **TODO** </span><br/>Howto determine age?<br/> | <ul><li>minimum : 15</li><li>maximum : 120</li><li>multipleOf : 1</li></ul> | 23 |
| nicknames | &nbsp; | array[] of strings | the nicknames of the owner | <ul><li>minItems : 1</li><li>maxItems : 5</li><li>uniqueItems : true</li></ul> | &nbsp; |
| gender | &nbsp; | enum | the gender of the owner | <ul><li>male</li><li>female</li></ul> | &nbsp; |
| file1 | &nbsp; | string [binary] | &nbsp; | &nbsp; | &nbsp; |
| file2 | &nbsp; | string [byte] | the second file | &nbsp; | &nbsp; |
| shoeSize | &nbsp; | integer | &nbsp; | &nbsp; | &nbsp; |
| someDouble | &nbsp; | integer | &nbsp; | <ul><li>format : double</li></ul> | &nbsp; |

# registration
The registration of a vehicle.


## Properties
| property | required | type | description | details | example |
| :--- | :---: | :---: | :--- | :--- | :--- |
| code | Y | string | the code of the vehicle | <ul><li>maxLength : 12</li></ul> | DUH-45-DJUU |
| firstRegistration | Y | date | first date of registration | &nbsp;<ul><li>pattern : yyyy-MM-dd</li></ul> | 2008-01-23 |
| registrationEnd | &nbsp; | date | End date of registration | &nbsp;<ul><li>pattern : yyyy-MM-dd</li></ul> | 2018-01-31 |
| country | Y | enum | country of registration | <ul><li>NL</li><li>BE</li><li>DE</li><li>FR</li><li>SP</li></ul> | &nbsp; |
