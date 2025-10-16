// ==========================
//  Registro Ore - Phoenix
// ==========================

// --- Mesi e selezione ---
const mesi = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

let selMese = document.getElementById("mese");
mesi.forEach((m, i) => {
  let opt = document.createElement("option");
  opt.value = i;
  opt.textContent = m;
  selMese.appendChild(opt);
});

let selAnno = document.getElementById("anno");
let annoCorrente = new Date().getFullYear();
for (let y = annoCorrente - 1; y <= annoCorrente + 1; y++) {
  let opt = document.createElement("option");
  opt.value = y;
  opt.textContent = y;
  if (y === annoCorrente) opt.selected = true;
  selAnno.appendChild(opt);
}
selMese.value = new Date().getMonth();

// --- Conversioni frazioni/decimali ---
function decimaleAFrazione(num) {
  if (isNaN(num) || num === 0) return "0";
  let intero = Math.floor(num);
  let fraz = num - intero;
  let frazioni = { 0.25: "1/4", 0.5: "1/2", 0.75: "3/4" };
  let risultato = "";
  if (intero > 0) risultato += intero;
  let frazTesto = frazioni[parseFloat(fraz.toFixed(2))];
  if (frazTesto) risultato += (intero > 0 ? " " : "") + frazTesto;
  return risultato || "0";
}

function frazioneADecimale(val) {
  if (!val) return NaN;
  val = val.trim();
  if (val.includes("/")) {
    let parts = val.split(" ");
    let base = 0;
    if (parts.length === 2) base = parseInt(parts[0]) || 0;
    let fraz = parts[parts.length - 1].split("/");
    let num = parseInt(fraz[0]) || 0;
    let den = parseInt(fraz[1]) || 1;
    return base + (num / den);
  }
  return parseFloat(val.replace(",", "."));
}

// --- Chiave di salvataggio ---
function chiaveStorage(mese, anno) {
  return "ore_" + anno + "_" + (mese + 1);
}

// --- Generazione tabella ---
function generaTabella() {
  let mese = parseInt(selMese.value);
  let anno = parseInt(selAnno.value);
  let giorni = new Date(anno, mese + 1, 0).getDate();
  let chiave = chiaveStorage(mese, anno);
  let datiSalvati = JSON.parse(localStorage.getItem(chiave) || "{}");

  let html = `
  <table id="presenze">
    <thead>
      <tr>
        <th rowspan="2">Giorno</th>
        <th rowspan="2">Ingresso Mattino</th>
        <th rowspan="2">Uscita Mattino</th>
        <th rowspan="2">Ingresso Pomeriggio</th>
        <th rowspan="2">Uscita Pomeriggio</th>
        <th colspan="4">Commesse / Clienti</th>
      </tr>
      <tr>
        <th><textarea rows="2" placeholder="Cliente 1 + Commessa" data-col="nome_c1">${datiSalvati["nome_c1"] || ""}</textarea></th>
        <th><textarea rows="2" placeholder="Cliente 2 + Commessa" data-col="nome_c2">${datiSalvati["nome_c2"] || ""}</textarea></th>
        <th><textarea rows="2" placeholder="Cliente 3 + Commessa" data-col="nome_c3">${datiSalvati["nome_c3"] || ""}</textarea></th>
        <th><textarea rows="2" placeholder="Cliente 4 + Commessa" data-col="nome_c4">${datiSalvati["nome_c4"] || ""}</textarea></th>
      </tr>
    </thead>
    <tbody>`;

  for (let g = 1; g <= giorni; g++) {
    let riga = datiSalvati[g] || {};
    html += `
      <tr>
        <td>${g}/${mese + 1}</td>
        <td><input type="time" data-giorno="${g}" data-col="inMatt" value="${riga.inMatt || ""}"></td>
        <td><input type="time" data-giorno="${g}" data-col="outMatt" value="${riga.outMatt || ""}"></td>
        <td><input type="time" data-giorno="${g}" data-col="inPom" value="${riga.inPom || ""}"></td>
        <td><input type="time" data-giorno="${g}" data-col="outPom" value="${riga.outPom || ""}"></td>
        <td><input type="text" inputmode="decimal" data-giorno="${g}" data-col="c1" value="${riga.c1 || ""}"></td>
        <td><input type="text" inputmode="decimal" data-giorno="${g}" data-col="c2" value="${riga.c2 || ""}"></td>
        <td><input type="text" inputmode="decimal" data-giorno="${g}" data-col="c3" value="${riga.c3 || ""}"></td>
        <td><input type="text" inputmode="decimal" data-giorno="${g}" data-col="c4" value="${riga.c4 || ""}"></td>
      </tr>`;
  }

  html += `
    </tbody>
    <tfoot>
      <tr class="totale">
        <td colspan="5">Totale</td>
        <td id="tot1">0</td>
        <td id="tot2">0</td>
        <td id="tot3">0</td>
        <td id="tot4">0</td>
      </tr>
    </tfoot>
  </table>`;

  document.getElementById("contenitore").innerHTML = html;

  // Eventi
  document.querySelectorAll("#presenze input, #presenze textarea").forEach(inp => {
    inp.addEventListener("input", () => { salvaDati(); calcolaTotali(); });
    if (inp.dataset.col && inp.dataset.col.startsWith("c")) {
      inp.addEventListener("blur", () => { normalizzaFrazioni(); salvaDati(); calcolaTotali(); });
    }
  });

  calcolaTotali();
  normalizzaFrazioni();
}

// --- Salvataggio dati ---
function salvaDati() {
  let mese = parseInt(selMese.value);
  let anno = parseInt(selAnno.value);
  let chiave = chiaveStorage(mese, anno);
  let dati = {};

  document.querySelectorAll("thead textarea").forEach(inp => { dati[inp.dataset.col] = inp.value; });
  document.querySelectorAll("#presenze tbody tr").forEach((tr, idx) => {
    let g = idx + 1;
    dati[g] = {};
    tr.querySelectorAll("input").forEach(inp => {
      let val = inp.value;
      if (inp.dataset.col && inp.dataset.col.startsWith("c")) val = frazioneADecimale(val);
      dati[g][inp.dataset.col] = val;
    });
  });

  localStorage.setItem(chiave, JSON.stringify(dati));
}

// --- Calcolo totali ---
function calcolaTotali() {
  [5, 6, 7, 8].forEach((col, idx) => {
    let inputs = document.querySelectorAll(`#presenze tbody tr td:nth-child(${col + 1}) input`);
    let somma = 0;
    inputs.forEach(inp => {
      let val = frazioneADecimale(inp.value);
      if (!isNaN(val)) somma += val;
    });
    document.getElementById("tot" + (idx + 1)).textContent = decimaleAFrazione(somma);
  });
}

function normalizzaFrazioni() {
  document.querySelectorAll('#presenze tbody input[data-col^="c"]').forEach(inp => {
    let val = frazioneADecimale(inp.value);
    if (!isNaN(val) && val > 0) inp.value = decimaleAFrazione(val);
  });
}

// --- Generazione PDF scrollabile ---
function stampaPDF() {
  const meseNome = mesi[parseInt(selMese.value)];
  const anno = parseInt(selAnno.value);
  const titolo = `Registro_Ore_${meseNome}_${anno}.pdf`;

  // Messaggio di caricamento
  const loadingMsg = document.createElement("div");
  loadingMsg.textContent = "⏳ Generazione PDF in corso...";
  loadingMsg.style.position = "fixed";
  loadingMsg.style.top = "10px";
  loadingMsg.style.right = "10px";
  loadingMsg.style.background = "#1d72ff";
  loadingMsg.style.color = "white";
  loadingMsg.style.padding = "8px 12px";
  loadingMsg.style.borderRadius = "6px";
  loadingMsg.style.fontSize = "14px";
  loadingMsg.style.zIndex = "9999";
  document.body.appendChild(loadingMsg);

  // Crea contenitore
  const elemento = document.createElement("div");
  const logo = document.querySelector(".logo").cloneNode(true);
  const titoloH2 = document.createElement("h2");
  titoloH2.textContent = `Registro Ore - ${meseNome} ${anno}`;
  titoloH2.style.textAlign = "center";

  const tabella = document.getElementById("presenze").cloneNode(true);
  tabella.style.width = "100%";
  tabella.style.fontSize = "12px";
  tabella.style.borderCollapse = "collapse";

  const dataStampa = new Date();
  const dataInfo = document.createElement("p");
  dataInfo.textContent = `Visualizzato il ${dataStampa.toLocaleDateString()} alle ${dataStampa.toLocaleTimeString()}`;
  dataInfo.style.textAlign = "right";
  dataInfo.style.fontSize = "10px";
  dataInfo.style.marginTop = "10px";

  elemento.appendChild(logo);
  elemento.appendChild(titoloH2);
  elemento.appendChild(tabella);
  elemento.appendChild(dataInfo);

  // Ottieni jsPDF dal bundle html2pdf
  const { jsPDF } = window.jspdf;

  html2canvas(elemento, { scale: 3, scrollY: 0, useCORS: true }).then(canvas => {
    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = canvas.width / 8;
    const pdfHeight = canvas.height / 8;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [pdfWidth, pdfHeight]
    });

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // Apri in nuova scheda
    const blobUrl = pdf.output("bloburl");
    window.open(blobUrl, "_blank");

    // Rimuovi messaggio di caricamento
    document.body.removeChild(loadingMsg);
  }).catch(err => {
    alert("Errore durante la generazione del PDF: " + err.message);
    document.body.removeChild(loadingMsg);
  });
}

// --- Avvio automatico ---
generaTabella();