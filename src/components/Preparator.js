import React from 'react';
import parseXml from '@rgrove/parse-xml';
import he from 'he';

function traversePath(parsedObj, path) {
  // grabs objects specified by path
  //
  // if not object is specified by the path, an empty list is returned
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
  }
  else if (path.length === 1) {
    return relevantChildren;
  }
  return result;
}

function getTitle(parsedObj) {
  const path = ['TEI.2', 'teiHeader', 'fileDesc', 'titleStmt', 'title'];
  for (const titleNode of traversePath(parsedObj, path)) {
    if (titleNode['children'][0].hasOwnProperty('text')) {
      return titleNode['children'][0]['text'];
    }
  }
}

function getStructures(parsedObj) {
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

function getPrimaryLanguage(parsedObj) {
  const path = ['TEI.2', 'teiHeader', 'profileDesc', 'langUsage']
  console.log(traversePath(parsedObj, path));
  return traversePath(parsedObj, path)[0]['attributes']['id'];
}

function getTexts(parsedObj) {
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

function getLevelsInfo(text, presumedStructure) {
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

function extractTextData(node, isGreek) {
  // breadth first search
  let result = [];
  let workqueue = [node];
  while(workqueue.length > 0) {
    let curNode = workqueue.shift();
    if (curNode.hasOwnProperty('type') && curNode['type'] === 'text') {
      // TODO fix based on whether the work is Greek or not
      result.push(curNode['text'].trim());
    }
    if (curNode.hasOwnProperty('children')) {
      for (const child of curNode['children']) {
        workqueue.push(child);
      }
    }
  }
  return result.join(' ');
}

function tessify(text, tagName, levelsInfo, presumedStructure, isGreek) {
  // assumed:  the keys of levelsInfo are all lowercased
  // assumed:  the strings in presumedStructure are already lowercased
  let levelPosition = 0;
  let workStack = [text];
  let result = '';
  let foundNs = presumedStructure.map(x => 0);
  while (workStack.length > 0) {
    let curNode = workStack.pop();
    if (curNode.hasOwnProperty('children')) {
      for (const child of curNode['children'].map(x => x).reverse()) {
        // depth first search
        workStack.push(child);
      }
    }
    if (curNode['type'] === 'element' ) {
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
          result += '<' + tagName + ' ' + foundNs.join('.') + '>\t' + extractTextData(curNode, isGreek) + '\n';
        }
      } else {
        // let's see if we've come to the next structure of any of the previous
        // levels
        for (let i = levelPosition - 1; i > 0; i--) {
          let tmpLevelName = presumedStructure[i];
          let tmpLevelNodeName = levelsInfo[tmpLevelName]['name'];
          let tmpLevelAttrName = levelsInfo[tmpLevelName]['attrName'];
          if (curNodeName === tmpLevelNodeName && (tmpLevelAttrName === null || curNode['attributes'][tmpLevelAttrName].toLowerCase() === tmpLevelName)) {
            // we are at a next structure
            levelPosition = i;
            for (let j = i+1; j < foundNs.length; j++) {
              // reset the counters for succeeding levels
              // TODO there seems to be a bug in the counter reset
              foundNs[j] = 0;
            }
            break;
          }
        }
      }
    }
  }
  return result;
}

function destroyClickedElement(event)
{
  document.body.removeChild(event.target);
}

class Preparator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tessContents: '',
      presumedStructureDisplay: '',
      textName: ''
    };

    this.loadFile = this.loadFile.bind(this);
    this.postLoad = this.postLoad.bind(this);
    this.updateTessContents = this.updateTessContents.bind(this);
    this.updateTextName = this.updateTextName.bind(this);
    this.updatePresumedStructure = this.updatePresumedStructure.bind(this);
    this.convert = this.convert.bind(this);
    this.saveDoc = this.saveDoc.bind(this);

    this.fileInput = React.createRef();
  }

  loadFile() {
    const file = this.fileInput.current.files[0];
    const reader = new FileReader();
    reader.onload = this.postLoad;
    reader.readAsText(file);
  }

  postLoad(e) {
    const parserOptions = {
      ignoreUndefinedEntities: true
    };
    // parse-xml retained inter-tag newlines as text nodes
    let newlinesRemoved = e.target.result.replace(/>\s+</gm, '><');
    let parsedObj = parseXml(newlinesRemoved, parserOptions);
    let structures = getStructures(parsedObj);
    this.setState({
      parsedObj: parsedObj,
      title: getTitle(parsedObj),
      texts: getTexts(parsedObj),
      structures: structures,
      presumedStructureDisplay: structures[0].join('.')
    });
    console.log(this.state);
  }

  updateTessContents(event) {
    this.setState({tessContents: event.target.value});
  }

  updateTextName(event) {
    this.setState({textName: event.target.value});
  }

  updatePresumedStructure(event) {
    this.setState({
      presumedStructureDisplay: event.target.value
    });
  }

  convert() {
    //
    let finalContents = [];
    // TODO should this be user indicated?
    const isGreek = getPrimaryLanguage(this.state.parsedObj) === 'greek';
    for (const text of this.state.texts) {
      const presumedStructure = this.state.presumedStructureDisplay.split('.');
      const levelsInfo = getLevelsInfo(text, presumedStructure);
      finalContents.push(tessify(text, this.state.textName, levelsInfo, presumedStructure, isGreek));
    }
    this.setState({tessContents: finalContents.join('\n')});
  }

  saveDoc() {
    const text = this.state.tessContents;
    const blob = new Blob([text], {type: 'text/plain'});
    const filename = 'default.tess';
    var downloadLink = document.createElement('a');
    downloadLink.download = filename;
    downloadLink.innerHTML = 'Download File';
    if (window.webkitURL != null)
    {
      // Chrome allows the link to be clicked
      // without actually adding it to the DOM.
      downloadLink.href = window.webkitURL.createObjectURL(blob);
    }
    else
    {
      // Firefox requires the link to be added to the DOM
      // before it can be clicked.
      downloadLink.href = window.URL.createObjectURL(blob);
      downloadLink.onclick = destroyClickedElement;
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
    }

    downloadLink.click();
  }

  render() {
    return [
      <div key="inputDiv"><input type="file" id="toBeConverted" ref={this.fileInput} onChange={this.loadFile} /></div>,
      <div key="optionsDiv">
        <div>
          <label htmlFor="textName">Text Name Abbreviation:</label>
          <input type="text" id="textName" value={this.state.textName} onChange={this.updateTextName} />
        </div>
          <label htmlFor="presumedStructure">Presumed Structure:</label>
          <input type="text" id="presumedStructure" value={this.state.presumedStructureDisplay} onChange={this.updatePresumedStructure} />
        <div>
          <input type="button" id="convertButton" onClick={this.convert} value="Convert" />
        </div>
      </div>,
      <div key="displayDiv">
        <textarea id="display" value={this.state.tessContents} onChange={this.updateTessContents}/>
      </div>,
      <div key="saveDiv"><button type="button" onClick={this.saveDoc}>Save</button></div>
    ];
  }
}

// TODO allow user selection of presumedStructure based on structures found

export default Preparator;
