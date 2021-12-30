/*
 * function copy_squares
 * parameters:
 *   squares: an array of arrays. In other words, a two dimensional array
 * returns:
 *   new_squares: a deep copy of squares
 */
function copy_squares(squares) {
  const dim = squares.length;
  const new_squares = new Array(dim);
  for (var i = 0; i < dim; i++) {
    new_squares[i] = squares[i].slice();
  }
  return new_squares;
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
  for (var i = 0; i < 11; i++) {
    distances[i] = new Array(11);
    for (var j = 0; j < 11; j++) {
      distances[i][j] = null;
    }
  }

  const q = []; // queue
  if (color === 1) {
    for (var i = 0; i < 11; i++) {
      if (squares[0][i] === color) {
        q.push([0, i]);
        distances[0][i] = 1;
      }
    }
  } else if (color === 2) {
    for (var i = 0; i < 11; i++) {
      if (squares[i][0] === color) {
        q.push([i, 0]);
        distances[i][0] = 1;
      }
    }
  } else {
    console.log("invalid color in checkWinCondition");
    return null;
  }

  var current_dist;
  var current_tup, neighbors, neighbor, x, y;
  while (q.length > 0) {
    current_tup = q.shift();
    current_dist = distances[current_tup[0]][current_tup[1]];
    neighbors = getNeighbors(current_tup);
    for (var neighbor of neighbors) {
      x = neighbor[0];
      y = neighbor[1];
      if (squares[x][y] === color && distances[x][y] === null) {
        distances[x][y] = current_dist + 1;
        if ((color === 1 && x === 10) || (color === 2 && y === 10)) {
          // found path. now backtrack path and build array of the
          // squares belonging to the path. Then return that array
          console.log("distances is");
          console.log(distances);
          console.log("neighbor is");
          console.log(neighbor);
          console.log("starting build_path");
          return build_path(neighbor, distances);
        } else {
          q.push(neighbor);
        }
      }
    }
  }
  return null;
}

// a helper function for checkWinCondition. Returns the shortest path
function build_path(goal_vertex, distances) {
  var current_dist = distances[goal_vertex[0]][goal_vertex[1]];
  var current_vertex = goal_vertex;
  var neighbor, neighbors;
  const path_arr = [goal_vertex];
  while (current_dist > 1) {
    current_dist = current_dist - 1;
    neighbors = getNeighbors(current_vertex);
    for (neighbor of neighbors) {
      if (distances[neighbor[0]][neighbor[1]] == current_dist) {
        current_vertex = neighbor;
      }
    }
    path_arr.push(current_vertex);
  }
  return path_arr;
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
  const neighbors = [];
  if (i < 10) {
    neighbors.push([i + 1, j]);
    if (j > 0) {
      neighbors.push([i + 1, j - 1]);
    }
  }
  if (i > 0) {
    neighbors.push([i - 1, j]);
    if (j < 10) {
      neighbors.push([i - 1, j + 1]);
    }
  }
  if (j > 0) {
    neighbors.push([i, j - 1]);
  }
  if (j < 10) {
    neighbors.push([i, j + 1]);
  }
  return neighbors;
}

//getCookie function copied from django documentation https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export { copy_squares, checkWinCondition, getNeighbors, getCookie };
