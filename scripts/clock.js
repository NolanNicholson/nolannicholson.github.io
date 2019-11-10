var hour_hand = document.getElementById("hour-hand");
var minute_hand = document.getElementById("minute-hand");
var second_hand = document.getElementById("second-hand");
var clock_face = document.getElementById("clock-face");

cubeBgR = 0.125;
cubeBgG = 0.125;
cubeBgB = 0.125;

var d; //date object
var hour, minute, second; //the actual time
var h_ang, m_ang, s_ang; //the degrees of the hands (0 deg @ 12:00:00)

//adjust the properties of the clock hands
function set_hand_css(elem, length, back_length) {
    var origin_y = length / (length + back_length) * 100;
    elem.style.height = "" + (length + back_length) + "%";
    elem.style.bottom = "" + (50 - back_length) + "%";
    elem.style.transformOrigin = "50% " + origin_y + "%";
}

set_hand_css(hour_hand, 30, 10);
set_hand_css(minute_hand, 40, 10);
set_hand_css(second_hand, 45, 10);

//create numbers on the clock face
var number_container_node, number_node;
var angle;
var num_x, num_y;
var r_numbers = 80;
for (var i = 1; i <= 12; i++) {
    number_container_node = document.createElement("div");
    number_container_node.className = "clock-number-container";
    clock_face.appendChild(number_container_node);

    number_node = document.createElement("div");
    number_node.className = "clock-number";
    number_node.textContent = i;
    number_container_node.appendChild(number_node);

    angle = ((i - 3) / 12) * Math.PI * 2;
    num_x = 50 + (0.5 * Math.cos(angle) * r_numbers);
    num_y = 50 + (0.5 * Math.sin(angle) * r_numbers);

    number_container_node.style.left = "" + num_x + "%";
    number_container_node.style.top = "" + num_y + "%";
}

//create clock ticks
var tick_node;
var r_ticks = 95;
for (var i = 0; i < 60; i++) {
    tick_node = document.createElement("div");
    tick_node.className = "clock-tick";
    clock_face.appendChild(tick_node);

    angle = i / 60 * Math.PI * 2;
    num_x = 50 + (0.5 * Math.cos(angle) * r_ticks);
    num_y = 50 + (0.5 * Math.sin(angle) * r_ticks);

    tick_node.style.left = "" + num_x + "%";
    tick_node.style.top = "" + num_y + "%";
    tick_node.style.transformOrigin = "50% 0%";
    tick_node.style.transform = "translate(-50%, 0%) rotate(" + (i * 6 + 90) + "deg)";
}

function update_clock() {
    //fetch time information
    d = new Date();
    hour = d.getHours() % 12;
    minute = d.getMinutes();
    second = d.getSeconds();

    //calculate angles
    h_ang = parseInt((hour + minute / 60) / 12 * 360);
    m_ang = parseInt((minute + second / 60) / 60 * 360);
    s_ang = parseInt(second / 60 * 360);

    //update clock CSS
    hour_hand.style.transform = "rotate(" + h_ang + "deg)";
    minute_hand.style.transform = "rotate(" + m_ang + "deg)";
    second_hand.style.transform = "rotate(" + s_ang + "deg)";
}

update_clock();
setInterval(update_clock, 1000);
