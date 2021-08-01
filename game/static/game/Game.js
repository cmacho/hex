'use strict';

class Game extends React.Component {
    constructor(props) {
        super(props);

        var squares = new Array(11);
        for (var i=0; i<11; i++) {
            squares[i] = new Array(11);
            for (var j=0; j<11; j++) {
                squares[i][j] = 0;
            }
        }

        const squares_history = []
        squares_history.push(squares)
        console.log(props.moves)
        for (const move of props.moves) {
            squares = this.execute_move(move, squares);
            squares_history.push(squares);
        }

        var my_player_num;
        if (props.my_user_id === props.player1_id) {
            my_player_num = 1
        } else if (props.my_user_id === props.player2_id) {
            my_player_num = 2
        } else {
            my_player_num = null;
        }
        console.log('my_player_num:');
        console.log(my_player_num);

        var is_my_turn;
        const playerToMove = this.determinePlayerToMove(
            props.stage,
            props.player1color,
            props.cake_cutter,
            squares_history.length
        );
        if (playerToMove === my_player_num) {
            is_my_turn = true;
        } else {
            is_my_turn = false;
        }

        var seconds_used_p1 = props.seconds_used_p1;
        var seconds_used_p2 = props.seconds_used_p2;
        if (playerToMove === 1) {
            seconds_used_p1 = seconds_used_p1 + props.seconds_current_move;
        } else if (playerToMove === 2) {
            seconds_used_p2 = seconds_used_p2 + props.seconds_current_move;
        }

        this.state = {
            out_of_sync: false,
            squares_history: squares_history,
            stage: props.stage,
            my_user_id: props.my_user_id,
            my_player_num: my_player_num,
            player1_id: props.player1_id,
            player1_name: props.player1_name,
            player2_id: props.player2_id,
            player2_name: props.player2_name,
            player1color: props.player1color,
            color_selection_mode: props.color_selection_mode,
            cake_cutter: props.cake_cutter,
            is_my_turn: is_my_turn,
            winner: props.winner,
            player1_ready: props.player1_ready,
            player2_ready: props.player2_ready,
            seconds_used_p1: seconds_used_p1,
            seconds_used_p2: seconds_used_p2,
            total_time_player1: props.total_time_player1,
            total_time_player2: props.total_time_player2,
            resigned: props.resigned,
            out_of_time: props.out_of_time
        }
    }

    componentDidMount() {
        this.updateInterval = setInterval(() => this.perhapsGetUpdate(),500);
        if (this.props.use_time_control) {
            this.tickInterval = setInterval(() => this.tick(), 1000);
        }
    }

    componentWillUnmount() {
        clearInterval(this.updateInterval);
        if (this.props.use_time_control) {
            clearInterval(this.tickInterval);
        }
    }

    tick() {
        console.log('tick');
        const playerToMove = this.determinePlayerToMove(
            this.state.stage,
            this.state.player1color,
            this.state.cake_cutter,
            this.state.squares_history.length
        );
        console.log(`playerToMove is ${playerToMove}`);
        if (playerToMove === 1) {
            console.log('adding one sec for p1');
            this.setState(state => ({
                seconds_used_p1: state.seconds_used_p1 + 1
            }));
        } else if (playerToMove === 2) {
            console.log('adding one sec for p2')
            this.setState(state => ({
                seconds_used_p2: state.seconds_used_p2 + 1
            }));
        }
    }

    determinePlayerToMove(stage,
                          player1color,
                          cake_cutter,
                          squares_hist_length) {
        var playerToMove, colorToMove;
        if (stage === 1) {
            playerToMove = cake_cutter;
        } else if (stage === 2) {
            playerToMove = 3 - cake_cutter;
        } else if (stage === 3) {
            colorToMove = 2 - (squares_hist_length % 2);
            playerToMove = 2 - (colorToMove + player1color + 1) % 2;
        } else {
            playerToMove = null;
        }
        return playerToMove;
    }

    squareIsEmpty(i,j) {
        const s_hist = this.state.squares_history;
        const squares = s_hist[s_hist.length - 1]
        if (squares[i][j] === 0) {
            return true;
        } else {
            return false;
        }
    }

    execute_move(move, squares) {
        if (squares[move.x][move.y] !== 0) {
            return null;
        }
        const new_squares = copy_squares(squares);
        new_squares[move.x][move.y]= 2 - (move.move_num % 2);
        return new_squares;
    }

    perhapsGetUpdate = () => {
        if (this.state.stage !== 4) {
            this.getUpdate();
        }
    }

    getUpdate = async () => {
        const url = `/get_update/${this.props.game_id}`;
        const latest_move_num = this.state.squares_history.length - 1;
        const res = await fetch(url);
        const data = await res.json();
        console.log(data)

        if ([0,1,2,3,4].includes(data.stage)) {
            const update_obj = {
                stage: data.stage,
                total_time_player1: data.total_time_player1,
                total_time_player2: data.total_time_player2
            }
            const squares_history = this.state.squares_history.slice();
            if (this.state.stage === 0) {
                update_obj['player1_id'] = data.player1_id;
                update_obj['player2_id'] = data.player2_id;
                update_obj['player1_ready'] = data.player1_ready;
                update_obj['player2_ready'] = data.player2_ready;
                update_obj['player1_name'] = data.player1_name;
                update_obj['player2_name'] = data.player2_name;
                update_obj['cake_cutter'] = data.cake_cutter;
            }

            if ([0,1,2].includes(this.state.stage)) {
                update_obj['player1color'] = data.player1color;
            }

            if (data.stage === 4) {
                update_obj['winner'] = data.winner;
                update_obj['resigned'] = data.resigned;
                update_obj['out_of_time'] = data.out_of_time;
                update_obj['seconds_used_p1'] = data.seconds_used_p1
                update_obj['seconds_used_p2'] = data.seconds_used_p2
            }

            if(data.latest_move) {
                console.log(`latest_move_num = ${latest_move_num}`);
                console.log(`data.latest_move['move_num'] is ${data.latest_move['move_num']}`);
            }

            if ((data.latest_move !== null) &&
                (data.latest_move['move_num'] === latest_move_num + 1)) {
                //update move history
                const move = data.latest_move;
                const current_squares = (
                    squares_history[squares_history.length - 1]
                );
                const squares_new = this.execute_move(move, current_squares);
                console.log(update_obj)
                update_obj['squares_history'] = squares_history.concat([squares_new]);
                console.log(update_obj)
            }

            if ([1,2,3].includes(data.stage)) {
                //update is_my_turn
                var is_my_turn;
                var len_squares_hist;
                if (data.latest_move !== null) {
                    len_squares_hist = data.latest_move['move_num'] + 1
                } else {
                    len_squares_hist = 0
                }
                const playerToMove = this.determinePlayerToMove(data.stage,
                                        data.player1color,data.cake_cutter,
                                        len_squares_hist)
                if (this.state.my_player_num === playerToMove) {
                    is_my_turn = true
                } else {
                    is_my_turn = false
                }
                update_obj['is_my_turn'] = is_my_turn
            }
            this.setState(update_obj)
        } else {
            // received some error TODO
        }
    }


    handleClick(i,j) {
        console.log(`(${i},${j}) was clicked`)
        if (!this.state.is_my_turn || !this.squareIsEmpty(i,j)) {
            console.log('not my turn or square not empty.');
            return;
        }
        if (![1,3].includes(this.state.stage)) {
            console.log('not expecting move to be played at this stage');
            return;
        }
        const move = {
            player: this.state.my_player_num,
            move_num: this.state.squares_history.length,
            x: i,
            y: j
        };
        const squares_history = this.state.squares_history.slice();
        const current_squares = squares_history[squares_history.length - 1];
        const squares_new = this.execute_move(move, current_squares);
        const update_obj = {
            squares_history: squares_history.concat([squares_new]),
            is_my_turn: false
        };
        if (this.state.stage === 1) {
            update_obj['stage'] = 2;
        }
        this.setState(update_obj)

        const color = 2 - move.move_num % 2;
        var winning_path, is_win;
        if (this.state.stage === 3) {
            winning_path = checkWinCondition(squares_new, color);
            is_win = (winning_path !== null);
        } else {
            is_win = false;
        }
        if (is_win) {
            this.setState({
                stage: 4,
                winner: move.player
            })
        }

        const csrftoken = getCookie('csrftoken');
        fetch(`/make_move/${this.props.game_id}`, {
            method: 'PUT',
            headers: {'X-CSRFToken': csrftoken},
            body: JSON.stringify({
                move: move,
                win: is_win,
                winning_path: winning_path
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data['accepted']) {
                this.setState({
                    seconds_used_p1: data.seconds_used_p1,
                    seconds_used_p2: data.seconds_used_p2
                })
            } else {
                this.setState({
                    out_of_sync: true
                })
            }
        })
    }

    handleReadyClick() {
        const data_to_send = {}
        if ((this.state.my_player_num === 1 && this.state.player1_ready) ||
            (this.state.my_player_num === 2 && this.state.player2_ready)) {
            console.log('case 1');
            data_to_send['ready'] = 0
        } else {
            console.log('case 2');
            data_to_send['ready'] = 1
        }

        console.log('data_to_send');
        console.log(data_to_send);
        const csrftoken = getCookie('csrftoken');
        fetch(`/toggle_rdy/${this.props.game_id}`, {
            method: 'PUT',
            headers: {'X-CSRFToken': csrftoken},
            body: JSON.stringify(data_to_send)
        })
        .then(res => res.json())
        .then(data => {
            if (data['accepted']) {
                console.log('changing state');
                this.setState({
                    player1_ready: data.player1_ready,
                    player2_ready: data.player2_ready,
                    player2_id: data.player2_id,
                    player2_name: data.player2_name
                });
            }
        })
    }

    handleLeaveClick() {
        const csrftoken = getCookie('csrftoken');
        fetch(`/leave_game/${this.props.game_id}`, {
            method: 'PUT',
            headers: {'X-CSRFToken': csrftoken}
        })
        .then(res => res.json())
        .then(data => {
            if (data.accepted) {
                window.location.href = '/games'
            } else {
                this.setState({
                    out_of_sync: true
                });
            }
        });
    }

    handleResign() {
        console.log('resign button pressed')
        const csrftoken = getCookie('csrftoken');
        fetch(`/resign/${this.props.game_id}`, {
            method: 'PUT',
            headers: {'X-CSRFToken': csrftoken}
        })
        .then(res => res.json())
        .then(data => {
            if (data.accepted) {
                this.setState({
                    winner: data.winner,
                    resigned: data.resigned,
                    stage: data.stage,
                    seconds_used_p1: data.seconds_used_p1,
                    seconds_used_p2: data.seconds_used_p2,
                    total_time_player1: data.total_time_player1,
                    total_time_player2: data.total_time_player2
                })
            }
        })
    }

    chooseColor(i) {
        var player1color
        if (this.state.my_player_num === 1) {
            player1color = i;
        } else {
            player1color = 3 - i;
        }

        const csrftoken = getCookie('csrftoken');
        fetch(`/choose_color/${this.props.game_id}`, {
            method: 'PUT',
            headers: {'X-CSRFToken': csrftoken },
            body: JSON.stringify({
                player1color: player1color
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.accepted) {
                //determine whose turn it is
                var blueplayer;
                if (player1color === 1) {
                    blueplayer = 2;
                } else {
                    blueplayer = 1;
                }
                console.log(`blueplayer is ${blueplayer}`);
                var my_turn;
                if (this.state.my_player_num === blueplayer) {
                    my_turn = true;
                } else {
                    my_turn = false;
                }
                this.setState({
                    player1color: player1color,
                    stage: data.stage,
                    is_my_turn: my_turn,
                    seconds_used_p1: data.seconds_used_p1,
                    seconds_used_p2: data.seconds_used_p2
                });
            }

        });
    }

    render() {
        if (this.state.stage === 0) {
            return <GameMenu
                        player1_name={this.state.player1_name}
                        player2_name={this.state.player2_name}
                        player1_ready={this.state.player1_ready}
                        player2_ready={this.state.player2_ready}
                        my_player_num={this.state.my_player_num}
                        onReadyClick={() => this.handleReadyClick()}
                        onLeaveClick={() => this.handleLeaveClick()}
                    />
        } else {
            var idx = this.state.squares_history.length - 1;
            var squares = this.state.squares_history[idx]
            var top_div, time_div;
            var winner_name;
            var remaining_sec_p1 = Math.max(
                this.state.total_time_player1 - this.state.seconds_used_p1,
                0
            );
            var remaining_sec_p2 = Math.max(
                this.state.total_time_player2 - this.state.seconds_used_p2,
                0
            ).toLocaleString(undefined, {minimumIntegerDigits:2});
            const minutes_p1 = Math.floor(remaining_sec_p1 / 60);
            const seconds_p1 = remaining_sec_p1 % 60;
            const minutes_p2 = Math.floor(remaining_sec_p2 / 60);
            const seconds_p2 = remaining_sec_p2 % 60;
            const minutes_p1_str = minutes_p1.toLocaleString(undefined, {minimumIntegerDigits:2});
            const seconds_p1_str = seconds_p1.toLocaleString(undefined, {minimumIntegerDigits:2});
            const minutes_p2_str = minutes_p2.toLocaleString(undefined, {minimumIntegerDigits:2});
            const seconds_p2_str = seconds_p2.toLocaleString(undefined, {minimumIntegerDigits:2});

            time_div = (
                <div>
                    <p>
                    time remaining player1: {minutes_p1_str}:{seconds_p1_str}
                    </p>
                    <p>
                    time remaining player2: {minutes_p2_str}:{seconds_p2_str}
                    </p>
                </div>
            )
            if (this.state.stage === 1 &&
                this.state.my_player_num === this.state.cake_cutter) {
                top_div = (
                    <div>
                        Play the first move. Afterwards, player
                        {3 - this.state.cake_cutter} gets to choose,
                        which color to continue playing as.
                    </div>
               );
            } else if (this.state.stage === 2 &&
                       this.state.my_player_num === this.state.cake_cutter) {
                top_div = (
                    <div>
                        Waiting for player  {3 - this.state.cake_cutter} to
                        choose who gets to play as which color.
                    </div>
               );
            } else if (this.state.stage === 1 &&
                       this.state.my_player_num === 3 - this.state.cake_cutter) {
                top_div = (
                    <div>
                        Waiting for player {this.state.cake_cutter}
                        to play the first move.
                        Afterwards you get to choose a color.
                    </div>
               );

            } else if (this.state.stage === 2 &&
                       this.state.my_player_num === 3 - this.state.cake_cutter) {
                top_div = (
                    <div>
                        Choose a color.
                        <button onClick={() => this.chooseColor(1)}>Red</button>
                        <button onClick={() => this.chooseColor(2)}>Blue</button>
                    </div>
               );
            } else if (this.state.stage === 4) {
                if (this.state.winner === 1) {
                    winner_name = this.state.player1_name;
                } else {
                    winner_name = this.state.player2_name;
                }
                top_div = (
                    <div>
                        The game has ended. {winner_name} has won.
                    </div>
                )
            }
            if (this.state.out_of_sync) {
                return (
                    <div>
                        Local game state out of sync with server.
                        Please refresh the page.
                    </div>
                )
            }
            return (
                <div>
                {time_div}
                {top_div}
                <Board
                    onClick={(i,j) => this.handleClick(i,j)}
                    squares={squares}
                />
                <ResignButton
                    onClick={() => this.handleResign()}
                />
                </div>
            )
        }
    }
}


class Board extends React.Component {

   /*
    * function renderGridHexagon
    * parameters:
    *   i: integer with 0 <= i <= 10
    *   j: integer with 0 <= j <= 15
    * renders either one of the hexagons belonging to the 11x11 board
    * or an invisible (hidden) hexagon. The reason for including the
    * hidden hexagons is that it is easier like this to get the desired
    * arrangement in a parallelogram shape for the visible hexagons
    */
    renderGridHexagon(i,j) {
        var liClassName;
        if (i % 2 === 1) {
            liClassName="row-right"
        } else {
            liClassName="row-left"
        }
        const firstHexIndex = Math.floor(i/2)
        const key=[i,j].toString()
        if (firstHexIndex <= j && j <= firstHexIndex+10) {
            const actual_j = j - firstHexIndex;
            return (
                <li className={liClassName} key={key}>
                    <Hexagon
                        onClick = {() => this.props.onClick(i, actual_j)}
                        color = {this.props.squares[i][actual_j]}
                    />
                </li>
            )
        } else {
            return (
                <li className={liClassName} key={key}>
                    <div className="hexagon hidden"></div>
                </li>
            )
        }
    }

    render() {
        //create array of tuples [i,j] for 0<=i<=10, 0<=j<=15
        const indexGrid = []
        for (var i=0; i<11; i++) {
            for (var j=0; j<16; j++) {
                indexGrid.push([i,j])
            }
        }

        const hexagons_grid = indexGrid.map(
            (tup) => this.renderGridHexagon(tup[0], tup[1])
        )

        return (
            <div id="surrounding">
                <div className="parallelogram"></div>
                <ul id="grid" className="clear">
                    {hexagons_grid}
                </ul>
            </div>
        )
    }
}


class GameMenu extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        var readystring1, readystring2, readyButtonText, leaveButton
        if (this.props.player1_ready) {
            readystring1 = 'player1 is ready.'
        } else {
            readystring1 = 'player1 is not ready'
        }
        if (this.props.player2_ready) {
            readystring2 = 'player2 is ready.'
        } else {
            readystring2 = 'player2 is not ready'
        }
        if ((this.props.my_player_num == 1 && player1_ready) ||
           (this.props.my_player_num == 2 && player2_ready)) {
            readyButtonText = 'Not ready'
        } else {
            readyButtonText = "Ready"
        }

        if (this.props.my_player_num == 2) {
            leaveButton = <button onClick={this.props.onLeaveClick}>
                            Leave Game
                          </button>
        }

        return (
            <div>
                <div>
                    Game has not started yet.
                </div>
                <div>
                    {readystring1}
                </div>
                <div>
                    {readystring2}
                </div>
                <div>
                    <button onClick={this.props.onReadyClick}>
                        {readyButtonText}
                    </button>
                </div>
                <div>
                    player1: {this.props.player1_name}
                </div>
                <div>
                    player2: {this.props.player2_name}
                </div>
                {leaveButton}
            </div>
        )
    }
}


function Hexagon(props) {
        var colorStyle;
        if (props.color === 1) {
            colorStyle = { backgroundColor : 'red' }
        } else if (props.color === 2) {
            colorStyle = { backgroundColor: 'blue' }
        } else {
            colorStyle = {}
        }
        return (
            <div
                className="hexagon"
                style={colorStyle}
                onClick={props.onClick}
            >
            </div>
        )
}


function ResignButton(props) {
    return (
        <button onClick={props.onClick}>
            Resign
        </button>
    )
}


/*
* function copy_squares
* parameters:
*   squares: an array of arrays. In other words, a two dimensional array
* returns:
*   new_squares: a deep copy of squares
*/
function copy_squares(squares) {
    const dim = squares.length
    const new_squares = new Array(dim);
    for (var i=0; i<dim; i++) {
        new_squares[i] = squares[i].slice()
    }
    return new_squares
}


/*
* function checkWinCondition
* parameters:
*   squares: array of arrays representing the 11x11 board. 1=red, 2=blue,0=empty
*   color: an integer in [1,2] representing the color for which we want to
*   check whether it satisfies the win condition. 1=red, 2=blue
* returns:
    if color has a path connecting its two sides, returns an array of tuples [x,y]
    representing a shortest such path.
    otherwise, returns null
*/
function checkWinCondition(squares, color) {
    // use breadth first search
    var distances = new Array(11);
    for (var i=0; i<11; i++) {
        distances[i] = new Array(11);
        for (var j=0; j<11; j++) {
            distances[i][j] = null;
        }
    }

    const q = [] // queue
    if (color === 1) {
        for (var i=0; i<11; i++) {
            if (squares[0][i] === color) {
                q.push([0, i]);
                distances[0][i] = 1;
            }
        }
    } else if (color === 2) {
        for (var i=0; i<11; i++) {
            if (squares[i][0] === color) {
                q.push([i, 0])
                distances[i][0] = 1
            }
        }
    } else {
        console.log('invalid color in checkWinCondition')
        return null
    }

    var current_dist
    var current_tup, neighbors, neighbor, x, y
    while (q.length > 0) {
        current_tup = q.shift()
        current_dist = distances[current_tup[0]][current_tup[1]]
        neighbors = getNeighbors(current_tup)
        for (var neighbor of neighbors) {
            x = neighbor[0];
            y = neighbor[1];
            if (squares[x][y] === color && distances[x][y] === null) {
                distances[x][y] = current_dist + 1
                if ((color === 1 && x === 10) || (color === 2 && y === 10)) {
                    // found path. now backtrack path and build array of the
                    // squares belonging to the path. Then return that array
                    console.log('distances is');
                    console.log(distances);
                    console.log('neighbor is');
                    console.log(neighbor);
                    console.log('starting build_path');
                    return build_path(neighbor, distances)
                } else {
                    q.push(neighbor)
                }
            }
        }
    }
    return null
}


// a helper function for checkWinCondition. Returns the shortest path
function build_path(goal_vertex, distances) {
    var current_dist = distances[goal_vertex[0]][goal_vertex[1]];
    var current_vertex = goal_vertex;
    var neighbor, neighbors
    const path_arr = [goal_vertex]
    while(current_dist>1) {
        current_dist = current_dist - 1;
        neighbors = getNeighbors(current_vertex);
        for (neighbor of neighbors) {
            if (distances[neighbor[0]][neighbor[1]] == current_dist) {
                current_vertex = neighbor
            }
        }
        path_arr.push(current_vertex)
    }
    return path_arr
}


/*
* function getNeighbors
* parameters:
*   tup: a tuple [i,j] with 0<=i,j<=10
* returns:
*   neighbors: a list of all tuples that are adjacent to tup on the hex board
*/
function getNeighbors(tup) {
    const i = tup[0];
    const j = tup[1];
    const neighbors = []
    if (i<10) {
        neighbors.push([i+1, j])
        if (j>0) {
            neighbors.push([i+1, j-1])
        }
    }
    if (i>0) {
        neighbors.push([i-1, j])
        if (j<10) {
            neighbors.push([i-1, j+1])
        }
    }
    if (j>0) {
        neighbors.push([i, j-1])
    }
    if (j<10) {
        neighbors.push([i, j+1])
    }
    return neighbors
}


//getCookie function copied from django documentation https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

