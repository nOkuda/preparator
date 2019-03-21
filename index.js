function convertFile(files) {
  const file = files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    const displayArea = document.getElementById("display")
    displayArea.innerHTML = e.target.result;
  }
  reader.readAsText(file);
}
