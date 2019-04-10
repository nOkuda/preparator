import React from 'react';
import fxp from 'fast-xml-parser';
import he from 'he';

// TODO implement findNodes to match Perl script?
function findNode(parsedObj, nodeName) {
  if (parsedObj.hasOwnProperty(nodeName)) {
    return parsedObj[nodeName];
  }
  for (let child in parsedObj) {
    let found = findNode(parsedObj[child], nodeName);
    if (found) {
      return found;
    }
  }
  return null;
}

function getTitle(parsedObj) {
  for (const text of parsedObj['TEI.2']['teiHeader']['fileDesc']['titleStmt']['title']) {
    if (text) {
      return text;
    }
  }
}

function convertText(text) {
  // TODO perform conversion
  /*
  const parser = new DOMParser();
  const dom = parser.parseFromString(text, 'application/xml');
  console.log(dom.doctype);
  console.log(Array.from(dom.firstElementChild.children).map(x => x.localName));
  console.log(dom.firstElementChild.firstElementChild.innerHTML);
  return Array.from(dom.children).map(x => x.localName).join('\n');
  */
  // TODO Idea:  use loose xml parser and correct bad stuff afterwards
  // (fast-xmlparser? xml2js?)
  const fxpOptions = {
    attributeNamePrefix : "@_",
    attrNodeName: "attr", //default is 'false'
    ignoreAttributes: false,
    tagValueProcessor: a => he.decode(a)
  };
  const parsedObj = fxp.parse(text, fxpOptions);
  const title = getTitle(parsedObj);
  const refStates = findNode(parsedObj, 'encodingDesc')['refsDecl']['state'].map(x => x['attr']['@_unit']);
  console.log(parsedObj);
  console.log(title);
  console.log(refStates);
  // TODO Idea:  try replacing all bad stuff before parsing with DOM (regex)
  // TODO Idea:  build validating xml parser that downloads external DTDs
  // (sax-js)
  // TODO firefox refuses to finish parsing once it finds the first error;
  // chrome parses along anyway; DTD problem?
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
    this.setState({text: convertText(e.target.result)});
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
