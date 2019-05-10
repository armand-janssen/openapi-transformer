# landVehicle
A vechicle that can drive.


|  property |  required |  type |  description |  details |  example | 
|  :--- |  :---: |  :---: |  :--- |  :--- |  :--- | 
| wheels|  Y | integer| the number of wheels| minimum : 2<br/>maximum : 4<br/>multipleOf : 2| 2| 


# waterVehicle
A vechicle that can float.


|  property |  required |  type |  description |  details |  example | 
|  :--- |  :---: |  :---: |  :--- |  :--- |  :--- | 
| propeller|  Y | integer| the number of propeller| minimum : 1<br/>maximum : 4| 2| 


# airVehicle
A vehicle that can fly.


|  property |  required |  type |  description |  details |  example | 
|  :--- |  :---: |  :---: |  :--- |  :--- |  :--- | 
| name| | string| the name of this type of Air vehicle| maxLength : 20|  &nbsp; | 
| engines|  Y | integer| the number of engines| minimum : 1<br/>maximum : 6| 4| 
| typeOfEngine|  Y | enum| The type of engines| turbojet, turboprop, turbofan, turboshaft|  &nbsp; | 


# vehicle
A generic vehicle. Multiline, just to prove it works :)<br/>


|  property |  required |  type |  description |  details |  example | 
|  :--- |  :---: |  :---: |  :--- |  :--- |  :--- | 
| type|  Y | enum| Type of vehicle based on the movement technology. Hybrid vehicle is not possible.| land, air, water|  &nbsp; | 
| owner|  Y | array[] of owner| the history of owners| minItems : 1|  &nbsp; | 
| registration|  Y | registration|  &nbsp; |  &nbsp; |  &nbsp; | 


# owner
Owner information


|  property |  required |  type |  description |  details |  example | 
|  :--- |  :---: |  :---: |  :--- |  :--- |  :--- | 
| name|  Y | string| the name of the owner|  &nbsp; | John Doe| 
| from|  Y | date| the date the owner, bought the vehicle|  &nbsp; | 2018-08-24| 
| to| | date| the date the owner, sold the vehicle<br/>|  &nbsp; | 2019-07-28| 
| age|  Y | integer| the age of the owner<br/><br/><span style="color:red"> **TODO** </span><br/>Howto determine age?<br/>|  &nbsp; | 23| 
| nicknames| | array[] of strings| the nicknames of the owner|  &nbsp; |  &nbsp; | 
| gender| | enum| the gender of the owner|  &nbsp; |  &nbsp; | 
| file1| | string [binary]|  &nbsp; |  &nbsp; |  &nbsp; | 
| file2| | string [byte]| the second file|  &nbsp; |  &nbsp; | 
| shoeSize| | integer|  &nbsp; |  &nbsp; |  &nbsp; | 
| someDouble| | integer|  &nbsp; |  &nbsp; |  &nbsp; | 


# registration
The registration of a vehicle.


|  property |  required |  type |  description |  details |  example | 
|  :--- |  :---: |  :---: |  :--- |  :--- |  :--- | 
| code|  Y | string| the code of the vehicle|  &nbsp; | DUH-45-DJUU| 
| firstRegistration|  Y | date| first date of registration|  &nbsp; | 2008-01-23| 
| registrationEnd| | date| End date of registration|  &nbsp; | 2018-01-31| 
| country|  Y | enum| country of registration|  &nbsp; |  &nbsp; | 


