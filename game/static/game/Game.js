'use strict';

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            game_has_started: props.game_has_started,
            player1_id: props.player1_id,
            player1_name: props.player1_name,
        }
    }

    render() {
        if (this.state.game_has_started) {
            return (
                <div>
                    <div>The game has started!</div>
                    <Board />
                </div>
            )
        } else {
            return <GameMenu />
        }
    }
}


class Board extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <div>TODO implent Board</div>
    }
}


class Hexagon extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return <div>Hello World</div> //TODO
    }
}


class GameMenu extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return <div>Game has not started yet.</div>
    }
}
