import React from 'react';
import xml2js from 'xml2js';
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
  for (const text of parsedObj['TEI.2']['TEIHEADER'][0]['FILEDESC'][0]['TITLESTMT'][0]['TITLE']) {
    if (text) {
      return text;
    }
  }
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
    this.xmlParserCallback = this.xmlParserCallback.bind(this);
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
      // tag names come out all uppercase because sax-js does so in loose mode
      strict: false,
      explicitChildren: true,
      preserveChildrenOrder: true
    };
    let parser = new xml2js.Parser(parserOptions);
    parser.parseString(e.target.result, this.xmlParserCallback);
  }

  xmlParserCallback(err, result) {
    console.log(result);
    this.setState({text: getTitle(result)});
  };

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
