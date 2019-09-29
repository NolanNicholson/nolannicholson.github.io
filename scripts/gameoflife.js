console.log("hello");

var rows = 10;
var cols = 20;
var playing = false;

function toggle_playing() {
    playing = !playing;
    var btn_play = document.getElementById("btn-pauseplay");
    btn_play.textContent = (playing ? "Pause" : "Resume");
}

function randomize() {
    var tb = document.getElementById("gol-table");
    var tr = tb.firstElementChild;
    var td;

    for (let r = 0; r < rows; r++) {
        td = tr.firstElementChild;
        for (let c = 0; c < cols; c++) {
            td.className = (Math.random() > 0.7 ? "gol alive" : "gol dead");
            td = td.nextElementSibling;
        }
        tr = tr.nextElementSibling;
    }
}

function toggle_alive(td) {
    if (td.classList.contains('alive')) {
        td.className = "gol dead";
    } else {
        td.className = "gol alive";
    }
}

function click_on_table(event) {
    toggle_alive(event.target);
}

function load() {
    var tb = document.getElementById("gol-table");
    
    var tr, td;
    for (let r = 0; r < rows; r++) {
        tr = document.createElement("tr");
        for (let c = 0; c < cols; c++) {
            td = document.createElement("td");
            td.className = "gol dead";
            tr.appendChild(td);
        }
        tb.appendChild(tr);
    }

    tb.addEventListener('mousedown', function(event) {click_on_table(event)});

    //pause/play button
    var btn_play = document.getElementById("btn-pauseplay");
    btn_play.addEventListener('click', toggle_playing);

    //randomize button
    var btn_random = document.getElementById("btn-randomize");
    btn_random.addEventListener('click', randomize);
}

load();
