console.log("hello");

var rows = 10;
var cols = 10;

function load() {
    var tb = document.getElementById("gol-table");
    
    var tr, td;
    for (let r = 0; r < rows; r++) {
        tr = document.createElement("tr");
        for (let c = 0; c < cols; c++) {
            td = document.createElement("td");
            tr.appendChild(td);
        }
        tb.appendChild(tr);
    }
}

load();
