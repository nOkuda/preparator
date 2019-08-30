import parseXml from '@rgrove/parse-xml';

export function getParsedObj(xmlString) {
  const parserOptions = {
    ignoreUndefinedEntities: true
  };
  const newlinesBetweenTags = />\s+</gm;
  const selfClosingTags = /<[^>]*?\/>/gm;
  const beginQuote = /<q.*?>/gm;
  const endQuote = /<\/q.*?>/gm;
  const processed = xmlString
    // parse-xml retained inter-tag newlines as text nodes
    .replace(newlinesBetweenTags, '><')
    // we don't need self closing tags
    .replace(selfClosingTags, '')
    .replace(beginQuote, '“')
    .replace(endQuote, '”');
  let parsedObj = parseXml(processed, parserOptions);
  return parsedObj;
}

export function traversePath(parsedObj, path) {
  // grabs objects specified by path
  //
  // if no object is specified by the path, an empty list is returned
  //
  // if multiple objects could be referenced by the given path, they will all
  // be given
  //
  // path should be a list of strings
  let result = [];
  const relevantChildren = parsedObj['children'].filter(x => x.type === 'element' && x.name === path[0]);
  if (path.length > 1) {
    for (const child of relevantChildren) {
      result = result.concat(traversePath(child, path.slice(1)));
    }
  } else if (path.length === 1) {
    return relevantChildren;
  }
  return result;
}

export function getTitleAbbreviation(parsedObj) {
  const path = ['TEI', 'teiHeader', 'fileDesc', 'titleStmt', 'title'];
  for (const titleNode of traversePath(parsedObj, path)) {
    if (titleNode['attributes']['type'] === 'work') {
      return titleNode['attributes']['n'];
    }
  }
}

export function getAuthorAbbreviation(parsedObj) {
  const path = ['TEI', 'teiHeader', 'fileDesc', 'titleStmt', 'author'];
  const firstAuthor = traversePath(parsedObj, path)[0];
  return firstAuthor['attributes']['n'];
}

export function getCTSStructure(parsedObj) {
  const path = ['TEI', 'teiHeader', 'encodingDesc', 'refsDecl'];
  for (const refsDeclNode of traversePath(parsedObj, path)) {
    if (refsDeclNode['attributes']['n'] === 'CTS') {
      let tmp = [];
      for (const child of refsDeclNode['children']) {
        if (child['name'] === 'cRefPattern') {
          tmp.push({
            'n': child['attributes']['n'],
            'pattern': child['attributes']['matchPattern']
          });
        }
      }
      tmp.sort((x, y) => x['pattern'].length - y['pattern'].length);
      return tmp.map(x => x['n']);
    }
  }
}

export function makeTess(parsedObj, author, title, structure) {
  const biggestChunkPath = ['TEI', 'text', 'body', 'div', 'div'];
  // assume that only one edition is available per file
  const biggestChunkNodes = traversePath(parsedObj, biggestChunkPath);
  const tagPrefix = author + ' ' + title;
  let tessChunks = biggestChunkNodes.map(x => buildParts(x, tagPrefix, structure, 0));
  return tessChunks.join('\n');
}

export function buildParts(curNode, tagPrefix, structure, levelIndex) {
  let tessChunks = [];
  const nextLevel = levelIndex + 1;
  if (nextLevel === structure.length) {
    return buildUnit(curNode, tagPrefix);
  }
  for (const child of curNode['children']) {
    let curPrefix = '';
    if (levelIndex > 0) {
      curPrefix = tagPrefix + curNode['attributes']['n'] + '.';
    } else {
      curPrefix = tagPrefix + ' ' + curNode['attributes']['n'] + '.';
    }
    tessChunks.push(buildParts(child, curPrefix, structure, nextLevel));
  }
  return tessChunks.join('\n');
}

export function buildUnit(unitNode, tagPrefix) {
  let result = [];
  let workStack = [];
  const unitDesignation = unitNode['attributes']['n'];
  populateWorkStack(unitNode, workStack);
  while (workStack.length > 0) {
    const curNode = workStack.pop();
    if (curNode['type'] === 'text') {
      result.push(curNode['text']);
    } else {
      populateWorkStack(curNode, workStack);
    }
  }
  return '<' + tagPrefix + unitDesignation + '>' + '\t' + result.join(' ');
}

export function populateWorkStack(node, workStack) {
  // workStack is modified in-place
  //
  // since the work stack is LIFO (last in, first out), child nodes need to go
  // into the work stack backwards in order for text to come out in the correct
  // order
  if ('children' in node) {
    for (const child of node['children'].map(x => x).reverse()) {
      workStack.push(child);
    }
  }
  return workStack;
}
