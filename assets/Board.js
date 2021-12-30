import { Component } from "react";
import Hexagon from "./Hexagon";

class Board extends Component {
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
  renderGridHexagon(i, j) {
    var liClassName;
    if (i % 2 === 1) {
      liClassName = "row-right";
    } else {
      liClassName = "row-left";
    }
    const firstHexIndex = Math.floor(i / 2);
    const key = [i, j].toString();
    if (firstHexIndex <= j && j <= firstHexIndex + 10) {
      const actual_j = j - firstHexIndex;
      return (
        <li className={liClassName} key={key}>
          <Hexagon
            onClick={() => this.props.onClick(i, actual_j)}
            color={this.props.squares[i][actual_j]}
          />
        </li>
      );
    } else {
      return (
        <li className={liClassName} key={key}>
          <div className="hexagon hidden"></div>
        </li>
      );
    }
  }

  render() {
    //create array of tuples [i,j] for 0<=i<=10, 0<=j<=15
    const indexGrid = [];
    for (var i = 0; i < 11; i++) {
      for (var j = 0; j < 16; j++) {
        indexGrid.push([i, j]);
      }
    }

    const hexagons_grid = indexGrid.map((tup) =>
      this.renderGridHexagon(tup[0], tup[1])
    );

    return (
      <div id="surrounding">
        <div className="parallelogram"></div>
        <ul id="grid" className="clear">
          {hexagons_grid}
        </ul>
      </div>
    );
  }
}

export default Board;
