import { Component, StrictMode } from "react";
import ReactDOM from "react-dom";
import { copy_squares, checkWinCondition, getCookie } from "./util";
import Board from "./Board";
import GameMenu from "./GameMenu";
import GameStatusBar from "./GameStatusBar";

class Game extends Component {
  constructor(props) {
    super(props);
    const game_id = JSON.parse(
      document.getElementById("game_id").textContent
    ).game_id;
    this.state = {
      game_id: game_id, //TODO: perhaps do not include in state because should never change
      loaded: false,
      out_of_sync: false,
      squares_history: null,
      stage: null,
      my_user_id: null,
      my_player_num: null,
      player1_id: null,
      player1_name: null,
      player2_id: null,
      player2_name: null,
      player1color: null,
      color_selection_mode: null,
      cake_cutter: null,
      is_my_turn: null,
      winner: null,
      player1_ready: null,
      player2_ready: null,
      seconds_used_p1: null,
      seconds_used_p2: null,
      total_time_player1: null,
      total_time_player2: null,
      resigned: null,
      out_of_time: null,
    };
  }

  async componentDidMount() {
    const gameData = await fetch(`/get_state/${this.state.game_id}`);
    const data = await gameData.json();

    var squares = new Array(11);
    for (var i = 0; i < 11; i++) {
      squares[i] = new Array(11);
      for (var j = 0; j < 11; j++) {
        squares[i][j] = 0;
      }
    }

    const squares_history = [];
    squares_history.push(squares);
    console.log(data.moves);
    for (const move of data.moves) {
      squares = this.execute_move(move, squares);
      squares_history.push(squares);
    }

    var my_player_num;
    if (data.request_user_id === data.player1_id) {
      my_player_num = 1;
    } else if (data.request_user_id === data.player2_id) {
      my_player_num = 2;
    } else {
      my_player_num = null;
    }
    console.log("my_player_num:");
    console.log(my_player_num);

    var is_my_turn;
    const playerToMove = this.determinePlayerToMove(
      data.stage,
      data.player1color,
      data.cake_cutter,
      squares_history.length
    );
    if (playerToMove === my_player_num) {
      is_my_turn = true;
    } else {
      is_my_turn = false;
    }

    var seconds_used_p1 = data.seconds_used_p1;
    var seconds_used_p2 = data.seconds_used_p2;
    if (playerToMove === 1) {
      seconds_used_p1 = seconds_used_p1 + data.seconds_current_move;
    } else if (playerToMove === 2) {
      seconds_used_p2 = seconds_used_p2 + data.seconds_current_move;
    }

    this.setState({
      out_of_sync: false,
      squares_history: squares_history,
      stage: data.stage,
      my_user_id: data.my_user_id,
      my_player_num: my_player_num,
      player1_id: data.player1_id,
      player1_name: data.player1_name,
      player2_id: data.player2_id,
      player2_name: data.player2_name,
      player1color: data.player1color,
      color_selection_mode: data.color_selection_mode,
      cake_cutter: data.cake_cutter,
      is_my_turn: is_my_turn,
      winner: data.winner,
      player1_ready: data.player1_ready,
      player2_ready: data.player2_ready,
      seconds_used_p1: seconds_used_p1,
      seconds_used_p2: seconds_used_p2,
      total_time_player1: data.total_time_player1,
      total_time_player2: data.total_time_player2,
      resigned: data.resigned,
      out_of_time: data.out_of_time,
      use_time_control: data.use_time_control,
      loaded: true,
    });

    this.updateInterval = setInterval(() => this.perhapsGetUpdate(), 500);
    if (this.state.use_time_control) {
      this.tickInterval = setInterval(() => this.tick(), 1000);
    }
  }

  componentWillUnmount() {
    clearInterval(this.updateInterval);
    if (this.state.use_time_control) {
      clearInterval(this.tickInterval);
    }
  }

  tick() {
    console.log("tick");
    const playerToMove = this.determinePlayerToMove(
      this.state.stage,
      this.state.player1color,
      this.state.cake_cutter,
      this.state.squares_history.length
    );
    console.log(`playerToMove is ${playerToMove}`);
    if (playerToMove === 1) {
      console.log("adding one sec for p1");
      this.setState((state) => ({
        seconds_used_p1: state.seconds_used_p1 + 1,
      }));
    } else if (playerToMove === 2) {
      console.log("adding one sec for p2");
      this.setState((state) => ({
        seconds_used_p2: state.seconds_used_p2 + 1,
      }));
    }
  }

  determinePlayerToMove(stage, player1color, cake_cutter, squares_hist_length) {
    var playerToMove, colorToMove;
    if (stage === 1) {
      playerToMove = cake_cutter;
    } else if (stage === 2) {
      playerToMove = 3 - cake_cutter;
    } else if (stage === 3) {
      colorToMove = 2 - (squares_hist_length % 2);
      playerToMove = 2 - ((colorToMove + player1color + 1) % 2);
    } else {
      playerToMove = null;
    }
    return playerToMove;
  }

  squareIsEmpty(i, j) {
    const s_hist = this.state.squares_history;
    const squares = s_hist[s_hist.length - 1];
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
    new_squares[move.x][move.y] = 2 - (move.move_num % 2);
    return new_squares;
  }

  perhapsGetUpdate = () => {
    if (this.state.stage !== 4) {
      this.getUpdate();
    }
  };

  getUpdate = async () => {
    const url = `/get_update/${this.state.game_id}`;
    const latest_move_num = this.state.squares_history.length - 1;
    const res = await fetch(url);
    const data = await res.json();
    console.log(data);

    if ([0, 1, 2, 3, 4].includes(data.stage)) {
      const update_obj = {
        stage: data.stage,
        total_time_player1: data.total_time_player1,
        total_time_player2: data.total_time_player2,
        player1_name: data.player1_name,
        player2_name: data.player2_name,
      };
      const squares_history = this.state.squares_history.slice();
      if (this.state.stage === 0) {
        update_obj["player1_id"] = data.player1_id;
        update_obj["player2_id"] = data.player2_id;
        update_obj["player1_ready"] = data.player1_ready;
        update_obj["player2_ready"] = data.player2_ready;
        update_obj["cake_cutter"] = data.cake_cutter;
      }

      if ([0, 1, 2].includes(this.state.stage)) {
        update_obj["player1color"] = data.player1color;
      }

      if (data.stage === 4) {
        update_obj["winner"] = data.winner;
        update_obj["resigned"] = data.resigned;
        update_obj["out_of_time"] = data.out_of_time;
        update_obj["seconds_used_p1"] = data.seconds_used_p1;
        update_obj["seconds_used_p2"] = data.seconds_used_p2;
      }

      if (data.latest_move) {
        console.log(`latest_move_num = ${latest_move_num}`);
        console.log(
          `data.latest_move['move_num'] is ${data.latest_move["move_num"]}`
        );
      }

      if (
        data.latest_move !== null &&
        data.latest_move["move_num"] === latest_move_num + 1
      ) {
        //update move history
        const move = data.latest_move;
        const current_squares = squares_history[squares_history.length - 1];
        const squares_new = this.execute_move(move, current_squares);
        console.log(update_obj);
        update_obj["squares_history"] = squares_history.concat([squares_new]);
        console.log(update_obj);
      }

      if ([1, 2, 3].includes(data.stage)) {
        //update is_my_turn
        var is_my_turn;
        var len_squares_hist;
        if (data.latest_move !== null) {
          len_squares_hist = data.latest_move["move_num"] + 1;
        } else {
          len_squares_hist = 1;
        }
        const playerToMove = this.determinePlayerToMove(
          data.stage,
          data.player1color,
          data.cake_cutter,
          len_squares_hist
        );
        if (this.state.my_player_num === playerToMove) {
          is_my_turn = true;
        } else {
          is_my_turn = false;
        }
        update_obj["is_my_turn"] = is_my_turn;
      }
      this.setState(update_obj);
    } else {
      // received some error TODO
    }
  };

  handleClick(i, j) {
    console.log(`(${i},${j}) was clicked`);
    if (!this.state.is_my_turn || !this.squareIsEmpty(i, j)) {
      console.log("not my turn or square not empty.");
      return;
    }
    if (![1, 3].includes(this.state.stage)) {
      console.log("not expecting move to be played at this stage");
      return;
    }
    const move = {
      player: this.state.my_player_num,
      move_num: this.state.squares_history.length,
      x: i,
      y: j,
    };
    const squares_history = this.state.squares_history.slice();
    const current_squares = squares_history[squares_history.length - 1];
    const squares_new = this.execute_move(move, current_squares);
    const update_obj = {
      squares_history: squares_history.concat([squares_new]),
      is_my_turn: false,
    };
    if (this.state.stage === 1) {
      update_obj["stage"] = 2;
    }
    this.setState(update_obj);

    const color = 2 - (move.move_num % 2);
    var winning_path, is_win;
    if (this.state.stage === 3) {
      winning_path = checkWinCondition(squares_new, color);
      is_win = winning_path !== null;
    } else {
      is_win = false;
    }
    if (is_win) {
      this.setState({
        stage: 4,
        winner: move.player,
      });
    }

    const csrftoken = getCookie("csrftoken");
    fetch(`/make_move/${this.state.game_id}`, {
      method: "PUT",
      headers: { "X-CSRFToken": csrftoken },
      body: JSON.stringify({
        move: move,
        win: is_win,
        winning_path: winning_path,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data["accepted"]) {
          this.setState({
            seconds_used_p1: data.seconds_used_p1,
            seconds_used_p2: data.seconds_used_p2,
          });
        } else {
          this.setState({
            out_of_sync: true,
          });
        }
      });
  }

  handleReadyClick() {
    const data_to_send = {};
    if (
      (this.state.my_player_num === 1 && this.state.player1_ready) ||
      (this.state.my_player_num === 2 && this.state.player2_ready)
    ) {
      console.log("case 1");
      data_to_send["ready"] = 0;
    } else {
      console.log("case 2");
      data_to_send["ready"] = 1;
    }

    console.log("data_to_send");
    console.log(data_to_send);
    const csrftoken = getCookie("csrftoken");
    fetch(`/toggle_rdy/${this.state.game_id}`, {
      method: "PUT",
      headers: { "X-CSRFToken": csrftoken },
      body: JSON.stringify(data_to_send),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data["accepted"]) {
          console.log("changing state");
          this.setState({
            player1_ready: data.player1_ready,
            player2_ready: data.player2_ready,
            player2_id: data.player2_id,
            player2_name: data.player2_name,
          });
        }
      });
  }

  handleLeaveClick() {
    const csrftoken = getCookie("csrftoken");
    fetch(`/leave_game/${this.state.game_id}`, {
      method: "PUT",
      headers: { "X-CSRFToken": csrftoken },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.accepted) {
          window.location.href = "/games";
        } else {
          this.setState({
            out_of_sync: true,
          });
        }
      });
  }

  handleResign() {
    console.log("resign button pressed");
    const csrftoken = getCookie("csrftoken");
    fetch(`/resign/${this.state.game_id}`, {
      method: "PUT",
      headers: { "X-CSRFToken": csrftoken },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.accepted) {
          this.setState({
            winner: data.winner,
            resigned: data.resigned,
            stage: data.stage,
            seconds_used_p1: data.seconds_used_p1,
            seconds_used_p2: data.seconds_used_p2,
            total_time_player1: data.total_time_player1,
            total_time_player2: data.total_time_player2,
          });
        }
      });
  }

  chooseColor(i) {
    var player1color;
    if (this.state.my_player_num === 1) {
      player1color = i;
    } else {
      player1color = 3 - i;
    }

    const csrftoken = getCookie("csrftoken");
    fetch(`/choose_color/${this.state.game_id}`, {
      method: "PUT",
      headers: { "X-CSRFToken": csrftoken },
      body: JSON.stringify({
        player1color: player1color,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
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
            seconds_used_p2: data.seconds_used_p2,
          });
        }
      });
  }

  render() {
    if (!this.state.loaded) {
      return <div>Loading</div>;
    }

    if (this.state.stage === 0) {
      return (
        <GameMenu
          player1_name={this.state.player1_name}
          player2_name={this.state.player2_name}
          player1_ready={this.state.player1_ready}
          player2_ready={this.state.player2_ready}
          my_player_num={this.state.my_player_num}
          onReadyClick={() => this.handleReadyClick()}
          onLeaveClick={() => this.handleLeaveClick()}
        />
      );
    } else {
      var idx = this.state.squares_history.length - 1;
      var squares = this.state.squares_history[idx];
      var remaining_sec_p1 = Math.max(
        this.state.total_time_player1 - this.state.seconds_used_p1,
        0
      );
      var remaining_sec_p2 = Math.max(
        this.state.total_time_player2 - this.state.seconds_used_p2,
        0
      );

      if (this.state.out_of_sync) {
        return (
          <div class="container">
            Local game state out of sync with server. Please refresh the page.
          </div>
        );
      }
      return (
        <div className="container-md">
          <GameStatusBar
            use_time_control={this.state.use_time_control}
            remaining_sec_p1={remaining_sec_p1}
            remaining_sec_p2={remaining_sec_p2}
            stage={this.state.stage}
            winner={this.state.winner}
            resigned={this.state.resigned}
            out_of_time={this.state.out_of_time}
            my_player_num={this.state.my_player_num}
            cake_cutter={this.state.cake_cutter}
            player1_name={this.state.player1_name}
            player2_name={this.state.player2_name}
            player1color={this.state.player1color}
            chooseColor={(i) => this.chooseColor(i)}
          />

          <Board onClick={(i, j) => this.handleClick(i, j)} squares={squares} />

          <div className="row resign-bar">
            <div
              className="col-sm-2 col-5 resign"
              onClick={() => this.handleResign()}
            >
              Resign
            </div>
          </div>
        </div>
      );
    }
  }
}

ReactDOM.render(
  <StrictMode>
    <Game />
  </StrictMode>,
  document.getElementById("game-div")
);
