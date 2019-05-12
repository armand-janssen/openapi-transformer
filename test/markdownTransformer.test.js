const { assert } = require('chai');
const fs = require('fs');
const markdownTransformer = require('../src/markdownTransformer');
const Schema = require('../src/schema');
const Property = require('../src/property');
const Detail = require('../src/detail');

function mockCar() {
  const name = 'Car';
  const properties = [];
  const description = 'A car is a transport thingy';
  const relationShips = [];
  const parent = 'Vehicle';

  return new Schema(name, properties, description, relationShips, parent);
}

function mockBrandDetails() {
  const detailMaxLength = new Detail('maxLength', '30');
  const detailMinLength = new Detail('minLength', '1');

  return [detailMaxLength, detailMinLength];
}

function mockBrandProperty() {
  const name = 'Brand';
  const type = 'string';
  const required = true;
  const details = mockBrandDetails();
  const description = 'The brand of the vehicle';
  const example = 'Volvo';

  const property = new Property(name, type, required, details, description, example);

  return property;
}

function mockDoorsDetails() {
  const zeroDoors = new Detail('enumvalue', '0 door');
  const oneDoor = new Detail('enumvalue', '1 door');
  const twoDoors = new Detail('enumvalue', '2 door');
  const threeDoors = new Detail('enumvalue', '3 door');
  const fourDoors = new Detail('enumvalue', '3 door');

  return [zeroDoors, oneDoor, twoDoors, threeDoors, fourDoors];
}

function mockDoorsProperty() {
  const name = 'Doors';
  const type = 'enum';
  const required = true;
  const details = mockDoorsDetails();
  const description = 'Number of doors';
  const example = '1 door';

  return new Property(name, type, required, details, description, example);
}
function mockWheelsProperty() {
  const name = 'Wheels';
  const type = 'integer';
  const required = false;
  const details = undefined;
  const description = undefined;
  const example = undefined;

  return new Property(name, type, required, details, description, example);
}

function mockPipeProperty() {
  const name = 'Pipe';
  const type = 'string';
  const required = false;
  const details = [new Detail('| Also | here', 'and here |')];
  const description = 'Since markdown uses the pipe character "|" for table seperation, it needs to be escaped';
  const example = 'Also the | here.';

  return new Property(name, type, required, details, description, example);
}

function mockVehicle() {
  const name = 'Vehicle';
  const properties = [mockBrandProperty(), mockPipeProperty(), mockDoorsProperty(), mockWheelsProperty()];
  const description = 'A Vehicle is a transport thingy. The pipe escaping is tested here \\|';
  const relationShips = [];
  const parent = '';
  return new Schema(name, properties, description, relationShips, parent);
}

function mockBike() {
  const name = 'Bike';
  const properties = undefined;
  const description = undefined;
  const relationShips = undefined;
  const parent = '';
  return new Schema(name, properties, description, relationShips, parent);
}

function mockOneClassNoProperties() {
  return [mockCar()];
}

function mockTwoClassWithProperties() {
  return [mockVehicle(), mockCar(), mockBike()];
}

describe('Test markdown generator', () => {
  it('No schemas', () => {
    const schemas = undefined;
    const md = markdownTransformer.generate(schemas);
    const expectedResult = '';

    assert.equal(md, expectedResult.toString());
  });

  it('One class no properties', () => {
    const schemas = mockOneClassNoProperties();
    const md = markdownTransformer.generate(schemas);
    const expectedResult = fs.readFileSync('./test/resources/markdownTransformer/oneClassNoProperties.md');

    assert.equal(md, expectedResult.toString());
  });

  it('Two class with properties', () => {
    const schemas = mockTwoClassWithProperties();
    const md = markdownTransformer.generate(schemas);
    const expectedResult = fs.readFileSync('./test/resources/markdownTransformer/twoClassWithProperties.md');
    // console.log('['+md+']');
    // console.log('['+expectedResult.toString()+']');

    assert.equal(md, expectedResult.toString());
  });
});
