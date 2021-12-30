function GameStatusBar(props) {
  var top_div, player1_time_div, player2_time_div;
  var winner_name;
  var leftName, leftTimeDiv, rightName, rightTimeDiv;
  var leftColor, rightColor;

  if (props.use_time_control) {
    const minutes_p1 = Math.floor(props.remaining_sec_p1 / 60);
    const seconds_p1 = props.remaining_sec_p1 % 60;
    const minutes_p2 = Math.floor(props.remaining_sec_p2 / 60);
    const seconds_p2 = props.remaining_sec_p2 % 60;
    const minutes_p1_str = minutes_p1.toLocaleString(undefined, {
      minimumIntegerDigits: 2,
    });
    const seconds_p1_str = seconds_p1.toLocaleString(undefined, {
      minimumIntegerDigits: 2,
    });
    const minutes_p2_str = minutes_p2.toLocaleString(undefined, {
      minimumIntegerDigits: 2,
    });
    const seconds_p2_str = seconds_p2.toLocaleString(undefined, {
      minimumIntegerDigits: 2,
    });

    player1_time_div = (
      <div className="time-div">
        {minutes_p1_str}:{seconds_p1_str}
      </div>
    );
    player2_time_div = (
      <div className="time-div">
        {minutes_p2_str}:{seconds_p2_str}
      </div>
    );
  } else {
    player1_time_div = "";
    player2_time_div = "";
  }

  top_div = <div style={{ height: "15px", width: "5px" }}></div>;

  if (props.stage === 1 && props.my_player_num === props.cake_cutter) {
    top_div = (
      <div>
        Play the first move. Afterwards, your opponent gets to choose, which
        color to continue playing as.
      </div>
    );
  } else if (props.stage === 2 && props.my_player_num === props.cake_cutter) {
    top_div = (
      <div>
        Waiting for your opponent to choose who gets to play as which color.
      </div>
    );
  } else if (
    props.stage === 1 &&
    props.my_player_num === 3 - props.cake_cutter
  ) {
    top_div = (
      <div>
        Waiting for your opponent to play the first move. Afterwards you get to
        choose a color.
      </div>
    );
  } else if (
    props.stage === 2 &&
    props.my_player_num === 3 - props.cake_cutter
  ) {
    top_div = (
      <div>
        <div>Choose a color.</div>
        <div>
          <button onClick={() => props.chooseColor(1)}>Red</button>
          <button onClick={() => props.chooseColor(2)}>Blue</button>
        </div>
      </div>
    );
  } else if (props.stage === 4) {
    var firstSentence, secondSentence;
    if (props.resigned === 1) {
      firstSentence = `${props.player1_name} has resigned. `;
    } else if (props.resigned === 2) {
      firstSentence = `${props.player2_name} has resigned. `;
    } else {
      firstSentence = "The game has ended. ";
    }
    if (props.out_of_time === 1) {
      secondSentence = `${props.player1_name} has run out of time. `;
    } else if (props.out_of_time === 2) {
      secondSentence = `${props.player2_name} has run out of time. `;
    } else {
      secondSentence = "";
    }
    if (props.winner === 1) {
      winner_name = props.player1_name;
    } else {
      winner_name = props.player2_name;
    }
    top_div = (
      <div>
        {firstSentence}
        {secondSentence}
        {winner_name} has won.
      </div>
    );
  }

  if (props.my_player_num === 1) {
    leftName = props.player1_name;
    leftTimeDiv = player1_time_div;
    leftColor = props.player1color;
    rightName = props.player2_name;
    rightTimeDiv = player2_time_div;
    rightColor = 3 - props.player1color;
  } else {
    leftName = props.player2_name;
    leftTimeDiv = player2_time_div;
    leftColor = 3 - props.player1color;
    rightName = props.player1_name;
    rightTimeDiv = player1_time_div;
    rightColor = props.player1color;
  }

  function colorToStyle(color) {
    var colorWord;
    if (color === 1) {
      return {
        backgroundColor: "red",
      };
    } else if (color === 2) {
      return {
        backgroundColor: "blue",
      };
    } else {
      return {
        backgroundColor: "#959595",
      };
    }
  }

  return (
    <div className="row status-div">
      <div
        style={colorToStyle(leftColor)}
        className="col-sm-1 col-3 color-left"
      ></div>
      <div className="col-sm-2 col-5 player-left">
        <div className="playername">{leftName}</div>
        {leftTimeDiv}
      </div>
      <div className="col-sm">{top_div}</div>
      <div className="col-sm-2 col-5 player-right">
        <div className="playername">{rightName}</div>
        {rightTimeDiv}
      </div>
      <div
        style={colorToStyle(rightColor)}
        className="col-sm-1 col-3 color-right"
      ></div>
    </div>
  );
}

export default GameStatusBar;
