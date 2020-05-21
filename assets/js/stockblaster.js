const canvas = document.getElementById("c");
const ctx = canvas.getContext('2d');

class Exchange {
    constructor(starting_price) {
        this.game_length = 60; // seconds total in game
        this.hurry_up_length = 10; // seconds left to do "HURRY UP" graphics
        this.auto_update_interval = 0.5; // seconds between autoprice updates

        this.then = Date.now();
        this.current_time = 0; // time since the exchange opened, in seconds
        this.signal_auto_update = false; // whether an auto update is necessary

        this.countdown_time = 3; // countdown timer at start
        this.display_winner_time = 5; // time to display winner
        this.game_started = false; // whether the game has started
        this.game_over = false; // whether the game has ended

        this.price_history = [starting_price];
        this.time_history = [this.current_time];
    }

    updateTime() {
        var now = Date.now();
        var dt = (now - this.then) / 1000;
        this.then = now;

        // if the game is ongoing
        if (this.game_started && !this.game_over) {
            if (Math.floor((this.current_time + dt) / this.auto_update_interval)
                != Math.floor(this.current_time / this.auto_update_interval)) {
                this.signal_auto_update = true;
            }
            else {
                this.signal_auto_update = false;
            }

            this.current_time += dt;

            if (this.current_time >= this.game_length) {
                this.game_over = true;
            }
        } else if (!this.game_started) {
            this.countdown_time -= dt;
            if (this.countdown_time < 0) {
                this.game_started = true;
            }
        }
    }

    getTimeRemaining() {
        return this.game_length - this.current_time;
    }

    appendPrice(percent_change) {
        var latest = this.price_history[this.price_history.length - 1];
        var new_price = latest * (1 + percent_change);
        new_price = Math.round(new_price * 100) / 100;
        this.price_history.push(new_price);
        this.time_history.push(this.current_time);
    }

    getNewPrice() {
        var percent_change = (Math.random() - 0.5) * 0.10;
        this.appendPrice(percent_change);
    }

    currentPrice() {
        return this.price_history[this.price_history.length - 1];
    }

    buy() {
        var percent_change = (Math.random() - 1) * 0.10;
        this.appendPrice(percent_change);
    }

    sell() {
        var percent_change = Math.random() * 0.10;
        this.appendPrice(percent_change);
    }
}

class Player {
    constructor() {
        this.cash = 100;
        this.shares = 10;
        this.buy_key_held = false;
        this.sell_key_held = false;
    }

    buy(price) {
        if (this.cash >= price) {
            this.cash -= price;
            this.shares += 1;
            return true;
        }
        return false;
    }

    sell(price) {
        if (this.shares >= 1) {
            this.cash += price;
            this.shares -= 1;
            return true;
        }
        return false;
    }
}

function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

function draw_chart(exchange) {
    var cw = canvas.width;
    var ch = canvas.height;

    var price_history = exchange.price_history;
    var time_history = exchange.time_history;

    // Location and size of the chart, in screen space
    var x_start = 0.16 * cw;
    var x_end = 0.901 * cw;
    var x_range = (x_end - x_start);
    var dx = 0.08 * cw;
    var y_start = 0.16 * ch;
    var y_end = 0.651 * ch;
    var dy = 0.08 * ch;
    var y_range = (y_start - y_end);
    var y_padding = 0.05 * ch;
    var x_padding_left = 0.05 * cw;
    var x_padding_right = 0.2 * cw;

    var current_price = exchange.currentPrice();
    var lowest_price = Math.min(9, ...price_history);
    var highest_price = Math.max(11, ...price_history);
    var price_range = (highest_price - lowest_price);

    var earliest_time = Math.min(...time_history);
    var latest_time = Math.max(2, ...time_history);
    var time_range = latest_time - earliest_time;

    // Interpolation functions from price/time space to screen space
    var x_interp = function(time) {
        return (time - earliest_time)
            / (time_range)
            * (x_range - x_padding_left - x_padding_right)
            + x_start + x_padding_left;
    }

    var y_interp = function(price) {
        return (y_range + 2 * y_padding)
            / (price_range)
            * (price - lowest_price)
            + y_end - y_padding;
    }

    var x_tick_spacing = 1; // seconds per vertical gridline
    var y_tick_spacing = 1; // dollars per horizontal gridline

    while (price_range / y_tick_spacing > 6) {
        y_tick_spacing *= 2;
    }
    while (time_range / x_tick_spacing > 4) {
        x_tick_spacing *= 2;
    }

    // Draw grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#666";
    ctx.beginPath();

    // Vertical grid lines
    var time_tick = 0;
    for (; x_interp(time_tick) < x_start; time_tick += x_tick_spacing) {
        // do nothing - so that we start at the first correct tick
    }
    for (; x_interp(time_tick) < x_end; time_tick += x_tick_spacing) {
        var x = x_interp(time_tick);
        ctx.moveTo(x, y_start);
        ctx.lineTo(x, y_end);
        ctx.stroke();
    }
    // Horizontal grid lines
    var price_tick = 0;
    for (; y_interp(price_tick) > y_end; price_tick += y_tick_spacing) {
        // do nothing - so that we start at the first correct tick
    }
    for (; y_interp(price_tick) > y_start; price_tick += y_tick_spacing) {
        var y = y_interp(price_tick);
        ctx.moveTo(x_start, y);
        ctx.lineTo(x_end, y);
        ctx.stroke();
    }
    // Enclosing box
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 2;
    ctx.strokeRect(x_start, y_start, x_end - x_start, y_end - y_start);

    // Draw stock price history
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x_interp(time_history[0]), y_interp(price_history[0]));
    for (var i = 1; i < price_history.length; i++) {
        ctx.lineTo(x_interp(time_history[i]), y_interp(price_history[i]));
    }
    ctx.stroke();

    // Draw marker and label on latest price
    var price_text = "$" + current_price.toFixed(2);
    var font_size = Math.round((y_end - y_start) * 0.12);
    var price_width = font_size * 4;
    var price_height = font_size * 1.5;
    var price_x = x_interp(time_history[time_history.length - 1]);
    var price_y = y_interp(current_price);

    ctx.beginPath();
    ctx.fillStyle = "#fff";
    ctx.arc(price_x, price_y, cw * 0.01, 0, 2 * Math.PI);
    ctx.fill();

    ctx.font = `bold ${font_size}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.translate(price_x, price_y);
    ctx.rotate(-0.1);
    ctx.translate(-price_x, -price_y);
    ctx.fillText(price_text,
        price_x + cw * 0.02, price_y);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // undo the previous transforms

    // Draw latest price as the chart title
    var font_size = Math.round(y_start * 0.8);
    ctx.font = `bold italic ${font_size}px sans-serif`;
    if (exchange.getTimeRemaining() <= exchange.hurry_up_length + 0.5) {
        ctx.fillStyle = "#f66";
    } else {
        ctx.fillStyle = "#fff";
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var title_x = canvas.width / 2;
    var title_y = y_start * 0.55;
    var title_text = "0:"
        + `${Math.round(exchange.getTimeRemaining())}`.padStart(2, '0');
    ctx.fillText(title_text, title_x, title_y);

    // Axis titles
    var font_size = Math.round(y_start / 3);
    ctx.font = `bold ${font_size}px sans-serif`;
    ctx.fillStyle = "#aaa";

    // Vertical
    ctx.textAlign = "right";
    price_tick = 0;
    for (; y_interp(price_tick) > y_end; price_tick += y_tick_spacing) {
        // do nothing - so that we start at the first correct tick
    }
    for (; y_interp(price_tick) > y_start; price_tick += y_tick_spacing) {
        var y = y_interp(price_tick);
        var x = x_start * 0.8;
        ctx.fillText(`$${price_tick}`, x, y);
    }

    // Horizontal
    ctx.textAlign = "center";
    var y_labels = y_end + (ch - y_end) * 0.15;
    var time_tick = 0;
    for (; x_interp(time_tick) < x_start; time_tick += x_tick_spacing) {
        // do nothing - so that we start at the first correct tick
    }
    for (; x_interp(time_tick) < x_end; time_tick += x_tick_spacing) {
        var x = x_interp(time_tick);
        var time_string = '0:' + `${time_tick}`.padStart(2, '0');
        ctx.fillText(time_string, x, y_labels);
    }
}

function draw_scores(p1, p2, share_price, draw_p1 = true, draw_p2 = true) {
    var cw = canvas.width;
    var ch = canvas.height;

    function draw_box(player, color, x_center, y_center, w, h, angle_deg) {
        ctx.translate(x_center, y_center);
        ctx.rotate(angle_deg * Math.PI / 180);
        ctx.translate(-x_center, -y_center);

        // background rectangle
        ctx.fillStyle = color;
        ctx.fillRect(x_center - w/2, y_center - h/2, w, h);

        var shadow = w/40;

        // Draw the player's total portolio value
        var font_size = Math.round(h);
        ctx.font = `bold ${font_size}px sans-serif`;
        ctx.textAlign = "center";

        var total_value = player.cash + player.shares * share_price;
        var cash_string = `$${total_value.toFixed(2)}`
        var x_total = x_center - w * 0.2;
        var y_total = y_center - h / 4;
        ctx.fillStyle = "#333";
        ctx.fillText(cash_string, x_total - shadow, y_total + shadow);
        ctx.fillStyle = "#fff";
        ctx.fillText(cash_string, x_total, y_total);

        // Draw the player's cash
        var font_size = Math.round(h / 2);
        ctx.font = `bold ${font_size}px sans-serif`;
        ctx.textAlign = "center";

        var cash_string = `$${player.cash.toFixed(2)}`
        var x_cash = x_center - w * 0.3;
        var y_cash = y_center + h * 0.6;
        ctx.fillStyle = "#333";
        ctx.fillText("　" + cash_string, x_cash - shadow, y_cash + shadow/4);

        if (player.cash < share_price) {
            ctx.fillStyle = "#f66";
        } else {
            ctx.fillStyle = "#fff";
        }
        ctx.fillText("💰" + cash_string, x_cash, y_cash);

        var font_size = Math.round(h / 2);
        ctx.font = `bold ${font_size}px sans-serif`;
        ctx.textAlign = "center";

        // Draw the player's number of shares
        var x_shares = x_center + w * 0.4;
        var y_shares = y_center + h * 0.6;
        var shares_text = `${player.shares}`;
        ctx.fillStyle = "#333";
        ctx.fillText("　" + shares_text, x_shares - shadow, y_shares + shadow/4);
        if (player.shares < 1) {
            ctx.fillStyle = "#f66";
        } else {
            ctx.fillStyle = "#fff";
        }
        ctx.fillText("📄" + shares_text, x_shares, y_shares);

        ctx.setTransform(1, 0, 0, 1, 0, 0); // undo the previous transforms
    }

    var x_p1 = 0.3 * cw;
    var x_p2 = 0.75 * cw;
    var y_scores = 0.85 * ch;
    var score_box_w = Math.min(cw / 4, ch / 3);
    var score_box_h = score_box_w / 3;

    if (draw_p1)
        draw_box(p1, "#745", x_p1, y_scores, score_box_w, score_box_h, -8);
    if (draw_p2)
        draw_box(p2, "#356", x_p2, y_scores, score_box_w, score_box_h, -8);


};

function draw(exchange, p1, p2) {
    resize();
    draw_chart(exchange);
    if (exchange.game_over) {
        var p1_total = p1.cash + p1.shares * exchange.currentPrice();
        var p2_total = p2.cash + p2.shares * exchange.currentPrice();
        var p1_won = p1_total >= p2_total;
        var p2_won = p2_total >= p1_total;

        //TODO: maybe change this later - it's a bit hacky
        // draw the losing score before drawing the dark overlay
        draw_scores(p1, p2, exchange.currentPrice(), !p1_won, !p2_won);

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // draw the winning score(s) over the dark overlay
        draw_scores(p1, p2, exchange.currentPrice(), p1_won, p2_won);
    }
    else {
        draw_scores(p1, p2, exchange.currentPrice());
    }
}

function title_screen() {
    function draw_screen() {
        resize();

        var cw = canvas.width;
        var ch = canvas.height;
        var min_size = Math.min(cw, ch);

        // Some cool lines in the background
        var dw = cw / 50;
        ctx.lineWidth = min_size / 80;

        ["#745", "#346", "#764"].forEach(color => {
            var y = ch / 2 * (1 + Math.random() * 0.4 - 0.2);
            ctx.strokeStyle = color;

            ctx.beginPath();
            ctx.moveTo(x, y);
            for (var x = cw * -0.1; x <= cw * 1.1; x += dw) {
                y *= (0.8 + Math.random() * 0.4);
                ctx.lineTo(x, ch - y);
            }
            ctx.stroke();
        });

        // Word "STOCK" in a huge font
        var font_size = min_size * 0.26;
        ctx.font = `bold italic ${font_size}px sans-serif`;
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("STOCK", cw / 2, ch / 3);

        // Word "BLASTER" in a less huge font
        font_size = min_size * 0.2;
        ctx.font = `bold italic ${font_size}px sans-serif`;
        ctx.fillText("BLASTER", cw / 2, ch / 3 + 0.89 * font_size);

        // Game instructions
        font_size = min_size * 0.05;
        ctx.font = `bold ${font_size}px sans-serif`;
        var text = `PLAYER 1: "A" TO BUY, "S" TO SELL
PLAYER 2: "L" TO BUY, ";" TO SELL

PRESS SPACEBAR TO START`

        lines = text.split('\n')
        for (var i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], cw / 2, ch * 2 / 3 + i * font_size);
        }
    }

    draw_screen();
    window.addEventListener('resize', draw_screen);

    function start(ev) {
        if (ev.key == ' ') {
            window.removeEventListener('resize', draw_screen);
            window.removeEventListener('keydown', start);
            main();
        }
    }

    window.addEventListener('keydown', start);
}

function drawStartOverlay(exchange) {
    // darken the background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw countdown timer
    ctx.fillStyle = "#fff";
    var font_size = Math.min(canvas.width, canvas.height) * 0.3;
    ctx.font = `bold italic ${font_size}px sans-serif`;
    var countdown_text = Math.ceil(exchange.countdown_time);
    ctx.fillText(countdown_text, canvas.width / 2, canvas.height / 2);
}

function main() {
    var p1 = new Player();
    var p2 = new Player();

    var starting_price = 10;
    var e = new Exchange(starting_price);

    function draw_() {
        draw(e, p1, p2);
    }

    function player_buy(player) {
        if (player.buy(e.currentPrice())) {
            e.sell();
        }
        draw_();
    }

    function player_sell(player) {
        if (player.sell(e.currentPrice())) {
            e.buy();
        }
        draw_();
    }

    const PLAYER1_BUY = 'a';
    const PLAYER1_SELL = 's';
    const PLAYER2_BUY = 'l';
    const PLAYER2_SELL = ';';

    function handle_keydown(ev) {
        switch(ev.key) {
            case PLAYER1_BUY:
                if (!p1.buy_key_held) {
                    player_buy(p1);
                }
                p1.buy_key_held = true;
                break;
            case PLAYER1_SELL:
                if (!p1.sell_key_held) {
                    player_sell(p1);
                }
                p1.sell_key_held = true;
                break;
            case PLAYER2_BUY:
                if (!p2.buy_key_held) {
                    player_buy(p2);
                }
                p2.buy_key_held = true;
                break;
            case PLAYER2_SELL:
                if (!p2.sell_key_held) {
                    player_sell(p2);
                }
                p2.sell_key_held = true;
                break;
        }
    }

    function handle_keyup(ev) {
        switch(ev.key) {
            case PLAYER1_BUY:
                p1.buy_key_held = false;
                break;
            case PLAYER1_SELL:
                p1.sell_key_held = false;
                break;
            case PLAYER2_BUY:
                p2.buy_key_held = false;
                break;
            case PLAYER2_SELL:
                p2.sell_key_held = false;
                break;
        }
    }

    var added_player_handlers = false;

    // use animation frames to update the exchange's clock
    function frame() {
        e.updateTime();
        if (e.game_started) {
            if (!added_player_handlers) {
                added_player_handlers = true;
                window.addEventListener('keydown', handle_keydown);
                window.addEventListener('keyup', handle_keyup);
            }
            if (e.signal_auto_update) {
                e.getNewPrice();
                draw_();
            }
        } else {
            draw_();
            drawStartOverlay(e);
        }

        if (e.game_over) {
            window.removeEventListener('keydown', handle_keydown);
            window.removeEventListener('keyup', handle_keyup);

            window.setTimeout(title_screen, e.display_winner_time * 1000);
        } else {
            requestAnimationFrame(frame);
        }
    }
    requestAnimationFrame(frame);

    draw_();
    window.addEventListener('resize', draw_);
}

title_screen();
//main();
