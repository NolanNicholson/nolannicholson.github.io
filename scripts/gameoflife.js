/*
JavaScript implementation of Conway's Game of Life
Nolan Nicholson, 2019
*/
  
var rows = 20;
var cols = 30;
var playing = false;
var timer_var;

function is_alive(td) {
    return (td.classList.contains('alive') ? true : false);
}

function get_x(td) {
    var x = 0;
    while (td.previousElementSibling != null) {
        x++;
        td = td.previousElementSibling;
    }
    return x;
}

function get_live_neighbor_count(td) {
    var num_live_neighbors = 0;
    var n, neighbor;
    var x = get_x(td);

    //Check cells to the left and the right
    for (neighbor of [td.previousSibling, td.nextSibling]) {
        if (neighbor !== null && is_alive(neighbor)) {
            num_live_neighbors++;
        }
    }

    //Check cells above and below
    var this_row = td.parentElement;
    for (var tr of [this_row.previousElementSibling,
        this_row.nextElementSibling]) {
        if (tr != null) {
            n = tr.children[x]
            for (neighbor of [n, n.previousSibling, n.nextSibling]) {
                if (neighbor != null && is_alive(neighbor)) {
                    num_live_neighbors++;
                }
            }
        }
    }

    return num_live_neighbors;
}

function update_cell(td, neighbor_count) {
    if (is_alive(td)) {
        if (neighbor_count < 2 || neighbor_count > 3) {
            toggle_alive(td);
        }
    } else {
        if (neighbor_count == 3) {
            toggle_alive(td);
        }
    }
}

function update_board() {
    //Get all neighbor counts
    var tb = document.getElementById("gol-table");
    var tr = tb.firstElementChild;
    var td;
    var neighbor_counts = [];

    for (let r = 0; r < rows; r++) {
        var row = [];
        td = tr.firstElementChild;
        for (let c = 0; c < cols; c++) {
            row.push(get_live_neighbor_count(td));
            td = td.nextElementSibling;
        }
        neighbor_counts.push(row);
        tr = tr.nextElementSibling;
    }
    
    //Update cells based on neighbor counts
    tr = tb.firstElementChild;
    for (let r = 0; r < rows; r++) {
        td = tr.firstElementChild;
        for (let c = 0; c < cols; c++) {
            update_cell(td, neighbor_counts[r][c]);
            td = td.nextElementSibling;
        }
        tr = tr.nextElementSibling;
    }
}

function toggle_playing() {
    playing = !playing;

    //update the button's appearance
    var btn_play = document.getElementById("btn-pauseplay");
    btn_play.textContent = (playing ? "Pause" : "Resume");

    if (playing) {
        timer_var = window.setInterval(update_board, 300);
    } else {
        clearInterval(timer_var);
    }
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
    if (is_alive(td)) {
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

    //step button
    var btn_step = document.getElementById("btn-step");
    btn_step.addEventListener('click', update_board);

    //randomize button
    var btn_random = document.getElementById("btn-randomize");
    btn_random.addEventListener('click', randomize);
}

load();
