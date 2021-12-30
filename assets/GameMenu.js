import { Component } from "react";

class GameMenu extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    var readystring1, readystring2, readyButtonText, leaveButton;
    if (this.props.player1_ready) {
      readystring1 = "player1 is ready.";
    } else {
      readystring1 = "player1 is not ready";
    }
    if (this.props.player2_ready) {
      readystring2 = "player2 is ready.";
    } else {
      readystring2 = "player2 is not ready";
    }
    if (
      (this.props.my_player_num == 1 && this.props.player1_ready) ||
      (this.props.my_player_num == 2 && this.props.player2_ready)
    ) {
      readyButtonText = "Not ready";
    } else {
      readyButtonText = "Ready";
    }

    if (this.props.my_player_num == 2) {
      leaveButton = (
        <button onClick={this.props.onLeaveClick}>Leave Game</button>
      );
    }

    return (
      <div className="container">
        <div>Game has not started yet.</div>
        <div>{readystring1}</div>
        <div>{readystring2}</div>
        <div>
          <button onClick={this.props.onReadyClick}>{readyButtonText}</button>
        </div>
        <div>player1: {this.props.player1_name}</div>
        <div>player2: {this.props.player2_name}</div>
        {leaveButton}
      </div>
    );
  }
}

export default GameMenu;
