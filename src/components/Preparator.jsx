import React from 'react';
import * as parsing from '../parsing.js';

function destroyClickedElement(event) {
  document.body.removeChild(event.target);
}

function cleanName(name) {
  let result = name.toLowerCase();
  if (name[name.length - 1] !== '.') {
    result = result + '.';
  }
  return result;
}

class Preparator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tessContents: '',
      authorName: '',
      textName: '',
      presumedStructure: '',
      structure: []
    };

    this.loadFile = this.loadFile.bind(this);
    this.postLoad = this.postLoad.bind(this);
    this.updateTessContents = this.updateTessContents.bind(this);
    this.updateTextName = this.updateTextName.bind(this);
    this.updateAuthorName = this.updateAuthorName.bind(this);
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
    const parsedObj = parsing.getParsedObj(e.target.result);
    const structure = parsing.getCTSStructure(parsedObj);
    this.setState({
      parsedObj: parsedObj,
      authorName: cleanName(parsing.getAuthorAbbreviation(parsedObj)),
      textName: cleanName(parsing.getTitleAbbreviation(parsedObj)),
      structure: structure,
      presumedStructure: structure.join('.')
    });
    console.log(this.state);
  }

  updateTessContents(event) {
    this.setState({ tessContents: event.target.value });
  }

  updateTextName(event) {
    this.setState({ textName: cleanName(event.target.value) });
  }

  updateAuthorName(event) {
    this.setState({ authorName: cleanName(event.target.value) });
  }

  updatePresumedStructure(event) {
    this.setState({
      presumedStructure: event.target.value,
      structure: event.target.value.split('.')
    });
  }

  convert() {
    this.setState({
      tessContents: parsing.makeTess(
        this.state.parsedObj,
        this.state.authorName,
        this.state.textName,
        this.state.structure
      )
    });
  }

  saveDoc() {
    const text = this.state.tessContents;
    const blob = new Blob([text], { type: 'text/plain' });
    const authorPart = this.state.authorName;
    const textPart = this.state.textName;
    const filename = authorPart + textPart + 'tess';
    var downloadLink = document.createElement('a');
    downloadLink.download = filename;
    downloadLink.innerHTML = 'Download File';
    if (window.webkitURL != null) {
      // Chrome allows the link to be clicked
      // without actually adding it to the DOM.
      downloadLink.href = window.webkitURL.createObjectURL(blob);
    } else {
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
      <div key='inputDiv'><input type='file' id='toBeConverted' ref={this.fileInput} onChange={this.loadFile} /></div>,
      <div key='optionsDiv'>
        <div>
          <label htmlFor='authorName'>Author Abbreviation:</label>
          <input type='text' id='authorName' value={this.state.authorName} onChange={this.updateAuthorName} />
        </div>
        <div>
          <label htmlFor='textName'>Text Name Abbreviation:</label>
          <input type='text' id='textName' value={this.state.textName} onChange={this.updateTextName} />
        </div>
        <div>
          <input type='button' id='convertButton' onClick={this.convert} value='Convert' />
        </div>
      </div>,
      <div key='displayDiv'>
        <textarea id='display' value={this.state.tessContents} onChange={this.updateTessContents} />
      </div>,
      <div key='saveDiv'><button type='button' onClick={this.saveDoc}>Save</button></div>
    ];
  }
}

// TODO allow user selection of presumedStructure based on structures found

export default Preparator;
