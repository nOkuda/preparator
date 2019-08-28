import parseXml from '@rgrove/parse-xml';
import he from 'he';
import { betaCodeToGreek } from 'beta-code-js';

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

export function getTitle(parsedObj) {
  const path = ['TEI.2', 'teiHeader', 'fileDesc', 'titleStmt', 'title'];
  for (const titleNode of traversePath(parsedObj, path)) {
    if (titleNode['children'][0].hasOwnProperty('text')) {
      return titleNode['children'][0]['text'];
    }
  }
}

export function getStructures(parsedObj) {
  const path = ['TEI.2', 'teiHeader', 'encodingDesc', 'refsDecl'];
  const rawStructures = traversePath(parsedObj, path);
  let units = [];
  for (const raw of rawStructures) {
    const states = traversePath(raw, ['state']);
    if (states) {
      units = units.concat([states.map(x => x['attributes']['unit'])]);
    } else {
      const steps = traversePath(raw, ['step']);
      units = units.concat([steps.map(x => x['attributes']['refunit'])]);
    }
  }
  return units;
}

export function getPrimaryLanguage(parsedObj) {
  const path = ['TEI.2', 'teiHeader', 'profileDesc', 'langUsage']
  console.log(traversePath(parsedObj, path));
  return traversePath(parsedObj, path)[0]['attributes']['id'];
}

export function getTexts(parsedObj) {
  let result = [];
  if (parsedObj.hasOwnProperty('children')) {
    for (const child of parsedObj['children']) {
      if (child.type === 'element' && child.name === 'text') {
        result = result.concat(child);
      }
      let deeperTexts = getTexts(child);
      if (deeperTexts) {
        result = result.concat(deeperTexts)
      }
    }
  }
  return result
}

export function getLevelsInfo(text, presumedStructure) {
  let levels = {};
  for (const structure of presumedStructure) {
    levels[structure] = null;
  }
  let remaining = [text];
  while (remaining.length > 0) {
    const curNode = remaining.shift();
    const levelsRemaining = Object.getOwnPropertyNames(levels).filter(x => levels[x] === null);
    if (levelsRemaining.length > 0) {
      for (const tmpName of levelsRemaining) {
        const levelName = tmpName.toLowerCase();
        if (levelName === 'line' && (curNode['name'] === 'l' || curNode['name'] === 'lb')) {
          levels[levelName] = {
            'name': curNode['name'],
            'attrName': null
          }
          break;
        }
        for (const attrName of ['type', 'unit']) {
          if (curNode.hasOwnProperty('attributes')) {
            const curNodeAttrs = curNode['attributes'];
            if (attrName in curNodeAttrs && curNodeAttrs[attrName].toLowerCase() === levelName) {
              levels[levelName] = {
                'name': curNode['name'],
                'attrName': attrName
              };
              break;
            }
          }
        }
      }
      if (curNode.hasOwnProperty('children')) {
        for (const child of curNode['children'].filter(x => x['type'] === 'element')) {
          remaining.push(child);
        }
      }
    } else {
      break;
    }
  }
  console.log(levels);
  return levels;
}

export function cleanGreekText(greekText) {
  // break Greek text into HTML entity parts and betacode parts, then run
  // appropriate decoding before stringing everything back together
  let result = [];
  let ampPos = -1;
  let semiPos = -1;
  let lastPos = 0;
  for (let i = 0; i < greekText.length; i++) {
    if (greekText[i] === '&') {
      // we found the beginning of the HTML entity
      ampPos = i;
    } else if (greekText[i] === ';') {
      // we found the end of the HTML entity
      semiPos = i;
    }
    if (ampPos >= 0 && semiPos >= 0) {
      if (ampPos !== lastPos) {
        // there is some Greek that came before the HTML entity that we need to
        // account for
        result.push(betaCodeToGreek(greekText.slice(lastPos, ampPos)));
      }
      lastPos = semiPos + 1;
      result.push(he.decode(greekText.slice(ampPos, lastPos)));
    }
  }
  if (lastPos < greekText.length) {
    // there is some Greek left in the string that needs to be accounted for
    result.push(betaCodeToGreek(greekText.slice(lastPos)));
  }
  return result.join('');
}

export function cleanLatinText(latinText) {
  return he.decode(latinText);
}

export function extractTextData(node, textIsGreek) {
  // depth first search
  let result = [];
  let workstack = [node];
  while (workstack.length > 0) {
    let curNode = workstack.pop();
    if (curNode.hasOwnProperty('type')) {
      if (curNode['type'] === 'element' && (curNode['name'] === 'foreign' || curNode['name'] === 'quote')) {
        if (!textIsGreek && 'lang' in curNode['attributes'] && curNode['attributes']['lang'] === 'greek') {
          result.push(extractTextData(curNode, true));
        } else if (textIsGreek && 'lang' in curNode['attributes'] && curNode['attributes']['lang'] !== 'greek') {
          result.push(extractTextData(curNode, false));
        }
      } else if (curNode['type'] === 'text') {
        const curNodeText = curNode['text'].trim();
        if (textIsGreek) {
          result.push(cleanGreekText(curNodeText));
        } else {
          result.push(cleanLatinText(curNodeText));
        }
      }
    }
    if (curNode.hasOwnProperty('children')) {
      for (const child of curNode['children'].map(x => x).reverse()) {
        workstack.push(child);
      }
    }
  }
  return result.join(' ');
}

export function tessify(text, tagName, levelsInfo, presumedStructure, textIsGreek) {
  // assumed:  the keys of levelsInfo are all lowercased
  // assumed:  the strings in presumedStructure are already lowercased
  let levelPosition = 0;
  let workStack = [text];
  let result = '';
  let foundNs = presumedStructure.map(x => 0);
  let accumulatedTexts = [];
  while (workStack.length > 0) {
    let curNode = workStack.pop();
    if (curNode.hasOwnProperty('children')) {
      for (const child of curNode['children'].map(x => x).reverse()) {
        // depth first search
        workStack.push(child);
      }
    }
    if (curNode['type'] === 'text') {
      accumulatedTexts.push(curNode['text']);
    }
    if (curNode['type'] === 'element') {
      let curNodeName = curNode['name'];
      let levelName = presumedStructure[levelPosition];
      let levelNodeName = levelsInfo[levelName]['name'];
      let levelAttrName = levelsInfo[levelName]['attrName'];
      if (curNodeName === levelNodeName && (levelAttrName === null || curNode['attributes'][levelAttrName].toLowerCase() === levelName)) {
        // we've found a structure of a level to dig into
        if (curNode.hasOwnProperty('attributes') && 'n' in curNode['attributes']) {
          foundNs[levelPosition] = curNode['attributes']['n'];
        } else {
          foundNs[levelPosition] = String(Number(foundNs[levelPosition]) + 1);
        }
        if (levelPosition + 1 < presumedStructure.length) {
          // let's look for the next level
          levelPosition += 1;
        } else {
          // we're ready to make another line in the .tess file
          result += '<' + tagName + ' ' + foundNs.join('.') + '>\t' + extractTextData(curNode, textIsGreek) + '\n';
          accumulatedTexts = [];
        }
      } else {
        // let's see if we've come to the next structure of any of the previous
        // levels
        for (let i = levelPosition - 1; i >= 0; i--) {
          let tmpLevelName = presumedStructure[i];
          let tmpLevelNodeName = levelsInfo[tmpLevelName]['name'];
          let tmpLevelAttrName = levelsInfo[tmpLevelName]['attrName'];
          if (curNodeName === tmpLevelNodeName && (tmpLevelAttrName === null || curNode['attributes'][tmpLevelAttrName].toLowerCase() === tmpLevelName)) {
            // we are at a next structure
            foundNs[i] = String(Number(foundNs[i]) + 1);
            for (let j = i + 1; j < foundNs.length; j++) {
              // reset the counters for succeeding levels
              foundNs[j] = String(0);
            }
            // resume looking for substructures
            levelPosition = i + 1;
            break;
          }
        }
      }
    }
  }
  return result;
}
