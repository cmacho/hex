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

        var interval = setInterval(this.perhapsGetUpdate,1000)

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
        var my_color;
        if (player1color === null) {
            my_color = null;
            if (squares_history.length === 1 &&
                my_player_num === props.cake_cutter) {
                is_my_turn = true;
            } else {
                is_my_turn = false;
            }
        } else {
            if (my_player_num === 1) {
                my_color = props.player1color;
            } else if (my_player_num === 2) {
                my_color = 3 - props.player1color;
            } else {
                my_color = null
            }
            console.log('my_color:')
            console.log(my_color)
            if (my_color === null) {
                is_my_turn = false;
            } else {
                is_my_turn =  (squares_history.length % 2 === my_color % 2)
            }
            console.log('is_my_turn:')
            console.log(is_my_turn)
        }

        this.state = {
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
            player2_ready: props.player2_ready
        }
    }

    squareIsEmpty(i,j) {
        const s_hist = this.state.squares_history
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
        const new_squares = copy_squares(squares)
        new_squares[move.x][move.y]= 2 - (move.move_num % 2)
        return new_squares
    }

    perhapsGetUpdate = () => {
        console.log('should I get updates?');
        if (!this.state.is_my_turn &&
            (this.state.stage === 3 || this.state.stage === 1) &&
            this.state.my_user_id !== null) {
            console.log('getting updates');
            this.getUpdate();
        } else if ((this.state.stage === 2) &&
                   (this.state.my_player_num == this.state.cake_cutter) &&
                   (this.state.my_user_id !== null)) {
            console.log('getting update on player colors');
            this.getColorUpdate();
        } else if (this.state.stage == 0) {
            console.log('getting update on players');
            this.getPlayersUpdate();
        }
    }

    getUpdate = async () => {
        const url = `/game/get_moves/${this.props.game_id}`;
        const latest_move_num = this.state.squares_history.length - 1;
        const res = await fetch(url);
        const data = await res.json();
        console.log(data);
        console.log(`latest_move_num is ${latest_move_num}`);
        if (data.latest_move === null) {
            console.log('latest_move received is null')
        } else if (data.latest_move['move_num'] === latest_move_num + 1) {
            const move = data.latest_move;
            const squares_history = this.state.squares_history.slice();
            const current_squares = (
                squares_history[squares_history.length - 1]
            );
            const squares_new = this.execute_move(move, current_squares);
            this.setState({
                squares_history: squares_history.concat([squares_new]),
                is_my_turn: true,
                stage: data.stage,
                winner: data.winner,
                player1color: data.player1color
            })
        } else if (data['move_num'] > latest_move_num + 1) {
            // TODO handle error
        }
    }

    getColorUpdate = async () => {
        const url = `/get_colors/${this.props.game_id}`;
        const res = await fetch(url);
        const data = await res.json();
        console.log(data)
        if (data.stage === 3) {
            //determine whose turn it is
            var blueplayer;
            var my_turn;
            if (data.player1color === 1) {
                blueplayer = 2
            } else if (data.player1color === 2) {
                blueplayer = 1
            } else {
                console.log('invalid server response')
            }

            if (this.state.my_player_num === blueplayer) {
                my_turn = true;
            } else {
                my_turn = false;
            }
            this.setState({
                is_my_turn: my_turn,
                stage: data.stage,
                player1color: data.player1color
            })
        }
    }

    getPlayersUpdate = async () => {
        const url = `/get_player_info/${this.props.game_id}`;
        const res = await fetch(url);
        const data = await res.json();
        console.log(data)
        if (data.stage === 0) {
            this.setState({
                stage: data.stage,
                player1_ready: data.player1_ready,
                player2_ready: data.player2_ready,
                player1_id: data.player1_id,
                player2_id: data.player2_id,
                player1_name: data.player1_name,
                player2_name: data.player2_name
            })
        } else if (data.stage === 1) {
            var is_my_turn
            if (this.state.my_player_num === data.cake_cutter) {
                is_my_turn = true
            } else {
                is_my_turn = false
            }
            this.setState({
                stage: data.stage,
                player1_ready: data.player1_ready,
                player2_ready: data.player2_ready,
                player1_id: data.player1_id,
                player2_id: data.player2_id,
                player1_name: data.player1_name,
                player2_name: data.player2_name,
                player1color: data.player1color,
                cake_cutter: data.cake_cutter,
                is_my_turn: is_my_turn
            })
        } else if (data.stage === 3) {
            var is_my_turn
            if (this.state.my_player_num === data.player1color) {
                is_my_turn = true
            } else {
                is_my_turn = false
            }
            this.setState({
                stage: data.stage,
                player1_ready: data.player1_ready,
                player2_ready: data.player2_ready,
                player1_id: data.player1_id,
                player2_id: data.player2_id,
                player1_name: data.player1_name,
                player2_name: data.player2_name,
                player1color: data.player1color,
                cake_cutter: data.cake_cutter,
                is_my_turn: is_my_turn
            })
        }
    }

    handleClick(i,j) {
        console.log(`(${i},${j}) was clicked`)
        if (this.state.stage === 3 && this.state.is_my_turn
            && this.squareIsEmpty(i,j)) {
            console.log('hello there?'); //TODO remove this
            const move = {
                player: this.state.my_player_num,
                move_num: this.state.squares_history.length,
                x: i,
                y: j
            };
            const squares_history = this.state.squares_history.slice();
            const current_squares = squares_history[squares_history.length - 1];
            const squares_new = this.execute_move(move, current_squares);
            this.setState({
                squares_history: squares_history.concat([squares_new]),
                is_my_turn: false
            })

            const color = 2 - move.move_num % 2;
            const winning_path = checkWinCondition(squares_new, color);
            const is_win = (winning_path !== null);
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

            if (is_win) {
                this.setState({
                    stage: 4,
                    winner: move.player
                })
            }

        } else if (this.state.stage === 1 && this.state.is_my_turn) {
            const move = {
                player: this.state.my_player_num,
                move_num: this.state.squares_history.length,
                x: i,
                y: j
            };
            const squares_history = this.state.squares_history.slice();
            const current_squares = squares_history[squares_history.length - 1];
            const squares_new = this.execute_move(move, current_squares);
            this.setState({
                squares_history: squares_history.concat([squares_new]),
                is_my_turn: false,
                stage: 2
            })
            const csrftoken = getCookie('csrftoken');
            const is_win = false;
            const winning_path = null;
            fetch(`/make_move/${this.props.game_id}`, {
                method: 'PUT',
                headers: {'X-CSRFToken': csrftoken},
                body: JSON.stringify({
                    move: move,
                    win: is_win,
                    winning_path: winning_path
                })
            })
        }
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
            if (data['status'] === 'ok') {
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
        .then(res => {
            window.location.href = '/games'
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
            if (data.status === 'ok') {
                //determine whose turn it is
                console.log('the status is ok');
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
                    is_my_turn: my_turn
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
            var squares = this.state.squares_history[this.state.squares_history.length - 1]
            var top_div;
            var winner_name;
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
                        to play the first move. Afterwards you get to choose a color.
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
            return (
                <div>
                {top_div}
                    <Board
                        onClick={(i,j) => this.handleClick(i,j)}
                        squares={squares}
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
                distances[i][0] == 1
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
        console.log(`current_dist is ${current_dist}`)
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

