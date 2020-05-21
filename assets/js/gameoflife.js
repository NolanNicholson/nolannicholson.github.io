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
    //x coordinate is retrieved by backing up to the first element (cell)
    //in the group of siblings (row).
    var x = 0;
    while (td.previousElementSibling != null) {
        x++;
        td = td.previousElementSibling;
    }
    return x;
}

function get_live_neighbor_count(td) {
    //This function returns the number of "alive" neighbors for a given
    //cell. Neighbors are those cells which are adjacent horizontally,
    //vertically, or diagonally.
    var num_live_neighbors = 0;
    var n, neighbor; //different vars for neighbors and neighbors' siblings
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
        //If the row exists at all...
        if (tr != null) {
            //get the cell directly above and below
            n = tr.children[x]
            //...and check it along with its left/right neighbors
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
    //Game of Life rules:
    //Living cells die if they have fewer than 2 or more than 3 neighbors.
    //Dead cells come alive if they have exactly 3 neighbors.
    if (is_alive(td)) {
        if (neighbor_count < 2 || neighbor_count > 3) {
            toggle_alive(td);
        } else {
            increase_age(td);
        }
    } else {
        if (neighbor_count == 3) {
            toggle_alive(td);
        } else {
            increase_age(td);
        }
    }
}

function update_board() {

    var tb = document.getElementById("gol-table");
    var tr = tb.firstElementChild;
    var td;
    var neighbor_counts = [];

    //Get all neighbor counts in an array first.
    //This way, the update of earlier cells won't affect later cells.
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

    //activate or deactivate a timer interval
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

    //Randomize the entire table, giving each cell a 30% chance of life
    for (let r = 0; r < rows; r++) {
        td = tr.firstElementChild;
        for (let c = 0; c < cols; c++) {
            td.className = (Math.random() > 0.7 ?
                "gol alive age0" : "gol dead age0");
            td = td.nextElementSibling;
        }
        tr = tr.nextElementSibling;
    }
}

function clear() {
    var tb = document.getElementById("gol-table");
    var tr = tb.firstElementChild;
    var td;
    console.log('hello');

    //Clear the entire table
    for (let r = 0; r < rows; r++) {
        td = tr.firstElementChild;
        for (let c = 0; c < cols; c++) {
            if (is_alive(td)) {
                toggle_alive(td);
            }
            td = td.nextElementSibling;
        }
        tr = tr.nextElementSibling;
    }
}

function increase_age(td) {
    //The age is the last class listed for each cell
    var age_token = td.classList[td.classList.length - 1]
    var doa = (is_alive(td) ? "alive" : "dead");

    //advance the age, up to age 3 (using classes so CSS can handle color)
    switch (age_token) {
        case 'age0': td.className = "gol " + doa + " age1"; break;
        case 'age1': td.className = "gol " + doa + " age2"; break;
        case 'age2': td.className = "gol " + doa + " age3"; break;
    }
}

function toggle_alive(td) {
    if (is_alive(td)) {
        td.className = "gol dead age0";
    } else {
        td.className = "gol alive age0";
    }
}

function click_on_table(event) {
    toggle_alive(event.target);
}

function load() {
    var tb = document.getElementById("gol-table");
    
    //Create the table rows and cells
    //(done via JS so that the size can be easily adjusted)
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

    tb.addEventListener('mousedown',
        function(event) {click_on_table(event)});

    //pause/play button
    var btn_play = document.getElementById("btn-pauseplay");
    btn_play.addEventListener('click', toggle_playing);

    //step button
    var btn_step = document.getElementById("btn-step");
    btn_step.addEventListener('click', update_board);

    //randomize button
    var btn_random = document.getElementById("btn-randomize");
    btn_random.addEventListener('click', randomize);

    //clear button
    var btn_clear = document.getElementById("btn-clear");
    btn_clear.addEventListener('click', clear);
}

load();
