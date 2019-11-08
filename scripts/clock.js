var hour_hand = document.getElementById("hour-hand");
var minute_hand = document.getElementById("minute-hand");
var second_hand = document.getElementById("second-hand");
var clock_inner = document.getElementById("clock-face");

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
var number_node;
var angle;
var num_x, num_y;

for (var i = 1; i <= 12; i++) {
    number_node = document.createElement("h1");
    number_node.textContent = i;
    number_node.className = "clock-number";

    angle = ((i - 3) / 12) * Math.PI * 2;
    num_x = parseInt((0.5 + 0.5 * Math.cos(angle)) * 85) + 5;
    num_y = parseInt((0.5 + 0.5 * Math.sin(angle)) * 85) - 5;

    number_node.style.left = "" + num_x + "%";
    number_node.style.top = "" + num_y + "%";

    clock_inner.appendChild(number_node);
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
