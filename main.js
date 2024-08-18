import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.7.1/+esm";
import prettier from "https://cdn.jsdelivr.net/npm/prettier@2.8.8/esm/standalone.mjs";
import parserBabel from "https://cdn.jsdelivr.net/npm/prettier@2.8.8/esm/parser-babel.mjs";

let editor;
let fileContents = {};

async function fetchAndExtractZip(url) {
  const response = await fetch(url);
  const blob = await response.blob();

  const zip = new JSZip();
  const contents = await zip.loadAsync(blob);

  for (let filename in contents.files) {
    const file = contents.files[filename];
    if (!file.dir) {
      fileContents[filename] = await file.async("text");
    }
  }

  displayFileExplorer();
}

// Format function
async function formatCode() {
  const unformatted = editor.getValue();
  const formatted = await prettier.format(unformatted, {
    parser: "babel",
    plugins: [parserBabel],
    printWidth: 80,
    tabWidth: 2,
    singleQuote: true,
    trailingComma: 'es5',
    bracketSpacing: true,
    semi: true,
  });
  editor.setValue(formatted);
}

function displayFileExplorer() {
  const explorer = document.getElementById("file-explorer");
  explorer.innerHTML = "";

  for (let filename in fileContents) {
    const fileElement = document.createElement("div");
    fileElement.textContent = filename;
    fileElement.onclick = () => openFile(filename);
    explorer.appendChild(fileElement);
  }

  document.getElementById("loader").style.display = "none";
  document.getElementById("wrapper").style.visibility = "visible";
  document.getElementById("download-btn").style.display = "inline-block";
}

function openFile(filename) {
  const content = fileContents[filename];
  editor.setValue(content);

  // Set the language based on file extension
  const extension = filename.split(".").pop();
  const language = getLanguageFromExtension(extension);
  monaco.editor.setModelLanguage(editor.getModel(), language);
  if (language === "javascript") {
    formatCode();
  }
}

function getLanguageFromExtension(extension) {
  const languageMap = {
    js: "javascript",
    py: "python",
    html: "html",
    css: "css",
    // Add more mappings as needed
  };
  return languageMap[extension] || "plaintext";
}

function run() {
  document.getElementById("loader").style.display = "block";

  // Initialize Monaco Editor
  require.config({
    paths: {
      vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.30.1/min/vs",
    },
  });
  require(["vs/editor/editor.main"], function () {
    editor = monaco.editor.create(document.getElementById("editor"), {
      value: "",
      language: "plaintext",
      theme: "vs-dark",
    });

    const corsProxy = "http://localhost:8081/";
    const url = corsProxy + getUrl(document.getElementById("extension-id").value);
    fetchAndExtractZip(url);
  });
}

function getUrl(id) {
  const url = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=127.0&acceptformat=crx3&x=id%3D${id}%26installsource%3Dondemand%26uc`;

  document.getElementById("download-btn").href = url;

  return url;
}


document.getElementById("run-btn").addEventListener("click", run);