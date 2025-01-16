const fileInput = document.getElementById("files");
const fileList = document.getElementById("fileList");

fileInput.addEventListener("change", updateFileList);

function updateFileList() {
  fileList.innerHTML = "";
  const files = Array.from(fileInput.files);
  files.forEach((file, index) => {
    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      return;
    }
    const li = document.createElement("li");
    // Sanitize file name
    li.textContent = file.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    li.draggable = true;
    li.dataset.index = index;
    fileList.appendChild(li);
  });
}

fileList.addEventListener("dragstart", (event) => {
  event.dataTransfer.setData("text/plain", event.target.dataset.index);
});

fileList.addEventListener("dragover", (event) => {
  event.preventDefault();
});

fileList.addEventListener("drop", (event) => {
  event.preventDefault();
  const draggedIndex = event.dataTransfer.getData("text/plain");
  const targetIndex = event.target.dataset.index;
  if (draggedIndex !== targetIndex) {
    const files = Array.from(fileInput.files);
    const draggedFile = files.splice(draggedIndex, 1)[0];
    files.splice(targetIndex, 0, draggedFile);
    updateFileInput(files);
    updateFileList();
  }
});

function updateFileInput(files) {
  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));
  fileInput.files = dataTransfer.files;
}

document
  .getElementById("uploadForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const files = fileInput.files;
    if (files.length === 0) {
      alert("Please select at least one PDF file.");
      return;
    }

    try {
      const mergedPdf = await PDFLib.PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        const arrayBuffer = await files[i].arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "merged.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.getElementById("result").style.color = "#00ff00";
      document.getElementById("result").innerText =
        "PDF merged successfully. Download started.";
    } catch (error) {
      document.getElementById("result").innerText = "Error: " + error.message;
    }
  });