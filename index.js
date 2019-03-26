function loadAndConvertFile(files) {
  const file = files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    const displayArea = document.getElementById("display")
    displayArea.innerHTML = convertText(e.target.result);
  }
  reader.readAsText(file);
}

function convertText(text) {
  // TODO perform conversion
  return text;
}

function saveDoc() {
  const text = document.getElementById("display").value;
  const blob = new Blob([text], {type: 'text/plain'});
  const filename = "default.tess";
  var downloadLink = document.createElement("a");
  downloadLink.download = filename;
  downloadLink.innerHTML = "Download File";
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
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
  }

  downloadLink.click();
}

function destroyClickedElement(event)
{
  document.body.removeChild(event.target);
}
