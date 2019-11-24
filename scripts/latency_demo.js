var demo_canvases = document.getElementsByClassName("demo-canvas");
var score_elems = document.getElementsByClassName("score");
var hiscore_elems = document.getElementsByClassName("hiscore");
var latency_inputs = document.getElementsByClassName("latency-input");
var latency_indicators = document.getElementsByClassName("latency-indicator");


for (var i = 0; i < latency_inputs.length; i++) {
    var elem = latency_inputs[i];
    elem.indicator = latency_indicators[i];
    elem.indicator.textContent = elem.value + " ms";
    elem.addEventListener('input', function(event) {
        event.target.indicator.textContent = event.target.value + " ms";
    });
}


function handleClick(e) {
    //Sets the clicked canvas to active, and the others to inactive.
    var t = e.target;
    var elem, env;
    for (var i = 0; i < demo_canvases.length; i++) {
        elem = demo_canvases[i];
        env = game_envs[i];

        if (elem === t) {
            env.click();

            if (!env.active) {
                if (env.collided) {
                    env.reset();
                }

                elem.classList.add('active-demo');
                elem.classList.remove('inactive-demo');
                env.active = true;
                env.loop();
            }
        } else {
            if (env.active) {
                elem.classList.remove('active-demo');
                elem.classList.add('inactive-demo');
                env.active = false;
                env.render();
            }
        }
    }
}
for (var i = 0; i < demo_canvases.length; i++) {
    document.addEventListener('mousedown', handleClick);
}


function drawBird(cnv, ctx, bird_x_pct, bird_y_pct, angle) {
    //draw a bird
    var bird_r = BIRD_SIZE_PCT / 100 * cnv.height;
    var bird_x = BIRD_X_PCT / 100 * cnv.height;
    var bird_y = bird_y_pct / 100 * cnv.height;
    
    //save and rotate the context
    //(so that we don't have to rotate the constituent shapes individually)
    ctx.save();
    ctx.translate(bird_x, bird_y);
    ctx.rotate(angle);

    //body
    ctx.beginPath();
    ctx.arc(0, 0, bird_r, 0, 2 * Math.PI);
    ctx.fillStyle = "#FFDD00";
    ctx.fill();

    //eye
    ctx.beginPath();
    ctx.ellipse(
        0.3 * bird_r,
        - 0.2 * bird_r,
        bird_r * 0.12,
        bird_r * 0.2,
        0,
        0, 2*Math.PI);
    ctx.fillStyle = "#000000";
    ctx.fill();

    //beak
    ctx.beginPath();
    ctx.ellipse(
        0.9 * bird_r,
        0.3 * bird_r,
        bird_r * 0.3,
        bird_r * 0.2,
        Math.PI * 0.1,
        0, 2*Math.PI);
    ctx.fillStyle = "brown";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
        0.95 * bird_r,
        0.18 * bird_r,
        bird_r * 0.4,
        bird_r * 0.2,
        -Math.PI * 0.1,
        0, 2*Math.PI);
    ctx.fillStyle = "orange";
    ctx.fill();

    //wing
    ctx.beginPath();
    ctx.ellipse(
        - 0.7 * bird_r,
        0.2 * bird_r,
        bird_r * 0.5,
        bird_r * 0.3,
        Math.PI * 0.1,
        0, 2*Math.PI);
    ctx.fillStyle = "#ddbb00";
    ctx.fill();

    ctx.restore();
}

const PIPE_CAP_HEIGHT_PCT = 10; //% of height
const PIPE_WIDTH_PCT = 25; //% of height
const PIPE_CAP_EXTRA_WIDTH_PCT = 1; //% of height
const PIPE_BUFFER_PCT = 20;

function drawPipe(cnv, ctx, pipe_x_pct, pipe_y_pct, is_ceiling) {
    //draw a pipe
    var pipe_buf = parseInt(PIPE_BUFFER_PCT / 100 * cnv.height);
    var pipe_w = parseInt(PIPE_WIDTH_PCT / 100 * cnv.height);
    var pipe_x = parseInt(pipe_x_pct / 100 * cnv.height);
    var pipe_y = parseInt(pipe_y_pct / 100 * cnv.height);

    ctx.fillStyle = "#00AA66";
    if (is_ceiling) {
        var pipe_h = pipe_y + pipe_buf;
        ctx.fillRect(pipe_x, -pipe_buf, pipe_w, pipe_h);
    } else {
        var pipe_h = cnv.height - pipe_y + pipe_buf;
        ctx.fillRect(pipe_x, cnv.height - pipe_h + pipe_buf, pipe_w, pipe_h);
    }

    //draw the pipe's cap
    var pipe_cap_h = parseInt(PIPE_CAP_HEIGHT_PCT / 100 * cnv.height);
    var pipe_cap_xw = parseInt(PIPE_CAP_EXTRA_WIDTH_PCT / 100 * cnv.height);

    if (is_ceiling) {
        var pipe_cap_y = pipe_y - pipe_cap_h;
    } else {
        var pipe_cap_y = pipe_y;
    }

    ctx.fillStyle = "#33CC77";
    ctx.fillRect(pipe_x - pipe_cap_xw, pipe_cap_y,
        pipe_w + 2 * pipe_cap_xw, pipe_cap_h);
}


class Pipe {
    constructor(scroll_speed, x_pct, height_pct, is_ceiling) {
        this.scroll_speed = scroll_speed;

        this.x_pct = x_pct;
        this.is_ceiling = is_ceiling;

        if (is_ceiling) {
            this.y_pct = height_pct;
        } else {
            this.y_pct = 100 - height_pct;
        }
    }
}

const NUM_PIPES = 20;

class PipeQueue {
    constructor(game_env) {
        this.scroll_speed = game_env.scroll_speed;
        this.pipe_spacing_pct = game_env.pipe_spacing_pct;

        //create some pipes
        this.pipes = []
        for (var i = 0; i < NUM_PIPES; i++) {
            this.addPipe();
        }
    }

    addPipe() {
        var is_ceiling = Math.random() > 0.5;
        var pipe_size = 20 + (Math.random() * 50);
        if (this.pipes.length) {
            var x_prev = this.pipes[this.pipes.length - 1].x_pct;
            var pipe_x = x_prev + this.pipe_spacing_pct;
        } else {
            var pipe_x = 120;
        }
        this.pipes.push(new Pipe(
            this.scroll_speed, pipe_x, pipe_size, is_ceiling));
    }

    update() {
        //update the pipes
        this.pipes.forEach(function(p) {
            p.x_pct -= p.scroll_speed;
        });

        //spawn a new pipe if needed
        if (this.pipes[0].x_pct < -1.5 * PIPE_WIDTH_PCT) {
            this.addPipe();
            this.pipes.shift();
        }
    }
}

const BIRD_SIZE_PCT = 8; //% of height
const BIRD_HOP_VY = -4;
const BIRD_MAX_VY = 3;
const BIRD_GRAVITY = 0.4;
const BIRD_X_PCT = 30; //% of height

class Bird {
    constructor(y_pct) {
        this.y_pct = y_pct;
        this.x_pct = BIRD_X_PCT;
        this.r_pct = BIRD_SIZE_PCT;
        this.vy = 0;
        this.angle = -Math.PI / 8;
    }

    hop() {
        this.vy = BIRD_HOP_VY;
    }

    update() {
        this.vy += BIRD_GRAVITY;
        if (this.vy > BIRD_MAX_VY) this.vy = BIRD_MAX_VY;

        this.y_pct += this.vy;
        this.angle = this.vy / 4 * Math.PI / 8;
    }
}

const INITIAL_PIPE_SPACING = 75;

class GameEnvironment {
    constructor(cnv) {
        this.cnv = cnv;
        this.ctx = cnv.getContext("2d");
        this.active = false;
        this.hiscore = 0;

        //game variables
        this.scroll_speed = 1;
        this.pipe_spacing_pct = INITIAL_PIPE_SPACING;

        //create a bird
        var bird_y_pct = 50;
        this.bird = new Bird(bird_y_pct);

        this.reset();
    }

    reset() {
        this.collided = false;
        this.shake = 0;
        this.bird.y_pct = 50;
        this.score = 0;

        //create pipes
        this.pipe_queue = new PipeQueue(this);
    }

    collisionCheck() {
        var b = this.bird;
        var pipes = this.pipe_queue.pipes;
        var p;

        for (var i = 0; i < pipes.length; i++) {
            p = pipes[i];
            //detect horizontal overlap
            if ((b.x_pct + b.r_pct > p.x_pct) && 
                (b.x_pct - b.r_pct < p.x_pct + PIPE_WIDTH_PCT)) {
                if (p.is_ceiling) {
                    if (b.y_pct - b.r_pct < p.y_pct) return true;
                } else {
                    if (b.y_pct + b.r_pct > p.y_pct) return true;
                }
            }
        }
        return false;
    }

    click() {
        this.bird.hop();
    }

    update() {
        //update objects
        this.pipe_queue.update();
        this.bird.update();

        this.collided = this.collisionCheck();
        var env = this;
        if (this.collided) {
            const INIT_SHAKE = 10;
            this.shake = INIT_SHAKE;
            window.setTimeout(function() {
                env.active = false;
                env.render();
            }, 500);
        } else {
            this.score++;
            if (this.score > this.hiscore) {
                this.hiscore = this.score;
            }
        }
    }

    renderGameState(collided, score, hiscore, pipe_queue, bird) {
        //change the background if a collision occurred
        if (collided) {
            this.ctx.fillStyle = "#222222";
            this.ctx.fillRect(0, 0, this.cnv.width, this.cnv.height);
        }

        //shake the screen if the player just hit a pipe
        if (this.active && collided) {
            this.ctx.save();
            this.ctx.translate(
                this.shake * (Math.random() - 0.5) * 2,
                this.shake * (Math.random() - 0.5) * 2
            );
            this.shake *= 0.85;
        }

        //draw objects
        for (var i = 0; i < pipe_queue.pipes.length; i++) {
            var p = pipe_queue.pipes[i];
            drawPipe(this.cnv, this.ctx, p.x_pct, p.y_pct, p.is_ceiling);
        }
        drawBird(this.cnv, this.ctx,
            bird.x_pct, bird.y_pct, bird.angle);

        //restore canvas if we were shaking
        if (this.active && collided) {
            this.ctx.restore();
        }

        //update score elements
        if (this.active) {
            this.score_elem.textContent = score;
            this.hiscore_elem.textContent = hiscore;
        }
    }

    render_latest_state() {
        this.renderGameState(
            this.collided,
            this.score,
            this.hiscore,
            this.pipe_queue,
            this.bird
        );
    }

    render() {
        //clear the canvas
        this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);

        this.render_latest_state();

        //draw start button if needed
        if (!this.active) {
            this.render_start_button();
        }
    }

    render_start_button() {
        const BUTTON_SIZE_PCT = 40; //% of height
        const ARROW_SIZE_PCT = 20; //% of height

        var ctx = this.ctx;
        var cnv = this.cnv;
        const cx = cnv.width / 2, cy = cnv.height / 2;

        const button_r = BUTTON_SIZE_PCT / 100 * cnv.height / 2;
        const arrow_r = ARROW_SIZE_PCT / 100 * cnv.height / 2;
        const arrow_x_left = arrow_r * Math.cos(Math.PI / 3);
        const arrow_y_left = arrow_r * Math.sin(Math.PI / 3);


        //draw the circle
        ctx.beginPath();
        ctx.arc(cx, cy, button_r, 0, Math.PI*2);
        ctx.fillStyle = "#4466ff";
        ctx.fill();

        //draw the arrow (a triangle)
        ctx.beginPath();
        ctx.moveTo(cx + arrow_r, cy);
        ctx.lineTo(cx - arrow_x_left, cy + arrow_y_left);
        ctx.lineTo(cx - arrow_x_left, cy - arrow_y_left);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
    }

    loop() {
        if (this.active) {
            if (!this.collided) {
                this.update();
            }
            this.render();
        }

        if (this.active) {
            window.requestAnimationFrame(this.loop.bind(this));
        }
    }
}


class GameStatePacket {
    constructor (collided, score, hiscore, pipe_queue, bird) {
        this.data = JSON.stringify({
            'collided': collided,
            'score': score,
            'hiscore': hiscore,
            'pipe_queue': pipe_queue,
            'bird': bird
        });
    }
}


class GameEnvLatency extends GameEnvironment {
    constructor(cnv, latency_input) {
        super(cnv);
        this.latency_input = latency_input;
        this.mostRecentPacket = new GameStatePacket(
            this.collided, this.score, this.hiscore,
            this.pipe_queue, this.bird);
    }

    click() {
        var latency = this.latency_input.value;
        var self = this;
        window.setTimeout(function() {
            self.inputArrive();
        }, latency / 2);
    }

    inputArrive() {
        super.click();
    }

    update(send_packet=true) {
        super.update();

        if (send_packet) {
            //encode and "send" "video" data
            var self = this;
            var latency = this.latency_input.value;
            var packet = new GameStatePacket(
                this.collided, this.score, this.hiscore,
                this.pipe_queue, this.bird);
            window.setTimeout(function() {
                self.mostRecentPacket = packet;
            }, latency / 2);
        }
    }

    render_latest_state() {
        //decode "incoming" packet
        var packet_data = JSON.parse(this.mostRecentPacket.data);

        //render based on the contents of the packet
        this.renderGameState(
            packet_data.collided,
            packet_data.score,
            packet_data.hiscore,
            packet_data.pipe_queue,
            packet_data.bird
        );
    }
}

class GameEnvRunAhead extends GameEnvLatency {
    constructor(cnv, latency_input) {
        super(cnv, latency_input);
        this.last_recorded_time = Date.now()
    }

    save_state() {
        var packet = new GameStatePacket(
            this.collided, this.score, this.hiscore,
            this.pipe_queue, this.bird);
        return packet
    }

    load_state(packet) {
        var data = JSON.parse(packet.data);
        this.collided = data.collided;
        this.score = data.score;
        this.hiscore = data.hiscore;
        Object.assign(this.pipe_queue, data.pipe_queue);
        Object.assign(this.bird, data.bird);
    }

    update() {
        //Determine number of frames of latency to counteract
        var frame_ms = (Date.now() - this.last_recorded_time);
        this.last_recorded_time = Date.now()
        var latency_ms = this.latency_input.value;
        var lag_frames = Math.round(latency_ms / frame_ms / 2);

        //Runahead technique, developed by Dwedit for LibRetro:
        //1. Run one frame quickly without outputting video or sound
        super.update(false);

        //2. Save State
        var packet = this.save_state();

        //3. Run N-1 frames quickly without outputting video or sound
        for (var i = 0; i < lag_frames - 1; i++) {
            super.update(false)
        }

        //4. Run one frame with outputting video and sound
        super.update(true);

        //5. Load State
        this.load_state(packet);
    }
}


var game_envs = [];
for (var i = 0; i < demo_canvases.length; i++) {
    var cnv = demo_canvases[i];
    cnv.width = cnv.clientWidth;
    cnv.height = cnv.clientHeight;

    switch(i) {
        case 0:
            var env = new GameEnvironment(cnv);
            break;
        case 1:
            //create an element with latency
            //(index i-1 because the first canvas doesn't have a latency input)
            var env = new GameEnvLatency(
                cnv, latency_inputs[i-1]);
            break;
        case 2:
            var env = new GameEnvRunAhead(
                cnv, latency_inputs[i-1]);
            break;
    }

    game_envs.push(env);
    env.score_elem = score_elems[i];
    env.hiscore_elem = hiscore_elems[i];
    env.render();
}

function resize_canvases() {
    for (var i = 0; i < demo_canvases.length; i++) {
        env = game_envs[i];
        cnv = env.cnv;
        cnv.width = cnv.clientWidth;
        cnv.height = cnv.clientHeight;
        env.render();
    }
}
window.addEventListener('resize', resize_canvases);
window.addEventListener('load', resize_canvases);
