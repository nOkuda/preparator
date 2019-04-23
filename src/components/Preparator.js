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
      for (const levelName of levelsRemaining) {
        if (levelName.toLowerCase() === 'line' && (curNode['name'] === 'l' || curNode['name'] === 'lb')) {
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
    for (const text of this.state.texts) {
      const levelsInfo = getLevelsInfo(text, this.state.presumedStructureDisplay.split('.'));
    }
    this.setState({tessContents: 'loaded'});
  }

  saveDoc() {
    const text = this.state.text;
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
          <label htmlFor="textName">Text Name:</label>
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

export default Preparator;
