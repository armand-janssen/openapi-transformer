const constants = {
  lineBreak: '\n',
  tab: '  ',
  space: ' ',
  comma: ', ',
  colon: ' : ',
  detailStart: '[',
  detailEnd: ']',

  RELATIONSHIP_USE: 'use', // --
  RELATIONSHIP_AGGREGATION: 'aggregation', // *--
  RELATIONSHIP_EXTENSION: 'extension', // <|--
};
exports.constants = Object.freeze(constants);
