const constants = {
  lineBreak: '\n',
  mdRowSeperator: '| ',
  mdHeaderCenterAligned: ' :---: ',
  mdHeaderLeftAligned: ' :--- ',
  mdHeaderRightAligned: ' ---: ',
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
