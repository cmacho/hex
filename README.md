# hex
A web application for playing the game of hex over the internet. Hex is a turn based strategy game with simple rules. It was invented by mathematicians in the 1940s. See https://en.wikipedia.org/wiki/Hex_(board_game).

### Usage (how to run the application locally)

1. Make sure you have docker installed. Then build a docker image by running the following command from the directory where `Dockerfile` is located
```bash
docker build -t hex_app .
```
2. Run the docker image using the following command
```bash
docker run -dp 8000:8000 hex_app
```
3. Go to your localhost, usually at http://127.0.0.1:8000/, to interact with the app.

### Design
The backend is implemented in django, the frontend in React using Javascript.

To keep the game state between both players synchronous, we use Javascript to make a GET request to a route /get_update/<game_id> every 500 ms. This is not ideal from a performance perspective but it works well enough with a small number of users. I believe WebSockets are usually used to exchange this kind of game data.

For creating a grid of hexagons using HTML and CSS, this tutorial was helpful: https://www.codesmite.com/article/how-to-create-pure-css-hexagonal-grids.
