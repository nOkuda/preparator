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
  return rawStructures.map(x => x['children'].map(y => y['attributes']['unit']));
}

function destroyClickedElement(event)
{
  document.body.removeChild(event.target);
}

class Preparator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {text: ''};

    this.loadAndConvertFile = this.loadAndConvertFile.bind(this);
    this.postprocess = this.postprocess.bind(this);
    this.updateText = this.updateText.bind(this);
    this.saveDoc = this.saveDoc.bind(this);

    this.fileInput = React.createRef();
  }

  loadAndConvertFile() {
    const file = this.fileInput.current.files[0];
    const reader = new FileReader();
    reader.onload = this.postprocess;
    reader.readAsText(file);
  }

  postprocess(e) {
    const parserOptions = {
      ignoreUndefinedEntities: true
    };
    // parse-xml retained inter-tag newlines as text nodes
    let newlinesRemoved = e.target.result.replace(/>\s+</gm, '><');
    let parsedObj = parseXml(newlinesRemoved, parserOptions);
    console.log(parsedObj);
    console.log(getStructures(parsedObj));
    this.setState({text: getTitle(parsedObj)});
  }

  updateText(event) {
    this.setState({text: event.target.value});
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
      <div key="inputDiv"><input type="file" id="toBeConverted" ref={this.fileInput} onChange={this.loadAndConvertFile} /></div>,
      <div key="displayDiv"><textarea id="display" value={this.state.text} onChange={this.updateText}/></div>,
      <div key="saveDiv"><button type="button" onClick={this.saveDoc}>Save</button></div>
    ];
  }
}

export default Preparator;
