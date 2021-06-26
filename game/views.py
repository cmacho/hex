import json
from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from .models import User, Game, Move

# Create your views here.
def index(request):
    return render(request, 'game/index.html')

def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse('index'))
        else:
            return render(request, 'game/login.html', {
                'message': 'Invalid username and/or password.'
            })
    else:
        return render(request, 'game/login.html')

def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse('index'))

def register(request):
    if request.method == 'POST':
        username = request.POST['username']

        # ensure password matches confirmation
        password = request.POST['password']
        confirmation = request.POST['confirmation']
        if password != confirmation:
            return render(request, 'game/register.html', {
                'message': 'Passwords must match.'
            })

        # attempt to create new user
        try:
            user = User.objects.create_user(username, password=password)
            user.save()
        except IntegrityError:
            return render(request, 'game/register.html', {
                'message': 'Username already taken.'
            })
        login(request, user)
        return HttpResponseRedirect(reverse('index'))
    else:
        return render(request, 'game/register.html')

def game(request, game_id):
    try:
        game = Game.objects.get(pk=game_id)
        return render(request, 'game/game.html', {
            'game_id': game.id,
            'stage': game.stage,
            'player1': game.player1,
            'player2': game.player2,
            'player1color': game.player1color,
            'color_selection_mode': game.color_selection_mode,
            'moves': game.moves.order_by('move_num'),
            'winner': game.winner
        })
    except Exception as e:
        return HttpResponse(f'Could not find game {e}') #TODO: make 404

def games(request):
    return HttpResponseRedirect(reverse('index'))

def create_game(request):
    return render(request, 'game/create_game.html')

def make_move(request, game_id):
    if request.method != 'PUT':
        return JsonResponse({"error": "PUT request required"}, status = 400)
    data = json.loads(request.body)
    print("data is:")
    print(data)
    move_data = data['move']
    game = Game.objects.get(pk=game_id)
    if game.player1 == request.user:
        player_id_request = 1
    elif game.player2 == request.user:
        player_id_request = 2
    else:
        return JsonResponse({
            "error": "not authorized to make a move in this game"
        })
    if game.stage == 0:
        return JsonResponse({
            "error": "cannot make move. game has not started"
        })
    elif game.stage == 1:
        if player_id_request == game.cake_cutter:
            color_to_move = 1
            if move_data['player'] != player_id_request:
                return JsonResponse({"error": "wrong player id"})
            if move_data['move_num'] != game.latest_move_num + 1:
                return JsonResponse({"error": "wrong move_num"})
            new_board = game.board.copy()
            if new_board[move_data['x'], move_data['y']] != 0:
                return JsonResponse({
                    "error": 'illegal move. hexagon already colored.'
                })
            new_board[move_data['x'], move_data['y']] = color_to_move
            new_move = Move(move_num=move_data['move_num'],
                            player=move_data['player'],
                            game=game, x=move_data['x'], y=move_data['y'])
            new_move.save()
            game.latest_move_num = move_data['move_num']
            game.latest_move_datetime = new_move.timestamp
            game.board = new_board
            return JsonResponse({
                                 "status": "ok",
                                 "new_latest_move_num": game.latest_move_num
                                })
        else:
            return JsonResponse({
                 "error": "it is not your turn.",
                 "cake_cutter": game.cake_cutter,
                 "player1color": game.player1color,
                 "game_latest_move_num": game_latest_move_num
            })
    elif game.stage == 2:
        not_cake_cutter = 3 - game.cake_cutter
        return JsonResponse({
            "error": (f"move cannot be played right now. waiting for"
                      f"player {not_cake_cutter} to choose a color")
        })
    elif game.stage == 3:
        color_to_move = game.latest_move_num % 2 + 1
        color_player_request = (
            2 - (player_id_request + game.player1color + 1) % 2
        )
        if color_to_move == color_player_request:
            if move_data['player'] != player_id_request:
                return JsonResponse({"error": "wrong player id"})
            if move_data['move_num'] != game.latest_move_num + 1:
                return JsonResponse({"error": "wrong move_num"})
            new_board = game.board.copy()
            if new_board[move_data['x']][move_data['y']] != 0:
                return JsonResponse(
                    {"error": 'illegal move. hexagon already colored.'
                })
            new_board[move_data['x']][move_data['y']] = color_to_move
            new_move = Move(move_num=move_data['move_num'],
                            player=move_data['player'],
                            game=game, x=move_data['x'], y=move_data['y'])
            print(f"new_move is {new_move}")
            print(f"new_move.game is {new_move.game}")
            new_move.save()
            game.latest_move_num = move_data['move_num']
            game.latest_move_datetime = new_move.timestamp
            game.board = new_board
            print(f"new_board is {new_board}")

            if data['win']:
                data_win_path = data['winning_path']

                verify = verify_winning_path(data_win_path,
                                            new_board,
                                            color_to_move)
                if not verify:
                    return JsonResponse({
                        "error": "the submitted winning path is incorrect"
                    })
                game.winner = player_id_request
                game.stage = 4

            game.save()
            return JsonResponse({
                                 "status": "ok",
                                 "new_latest_move_num": game.latest_move_num
                                })

        else:
            return JsonResponse({
                        "error": "it is not your turn",
                        "color_to_move": color_to_move,
                        "color_player_request": color_player_request
            })
    elif game.stage == 4:
        return JsonRespone({"error": "Game has already ended"})


def verify_winning_path(path, board, color):
    reached_0_end = False
    reached_10_end = False
    prev_square = None
    for square in path:
        if prev_square is not None:
            diff = (square[0] - prev_square[0], square[1] - prev_square[1])
            if diff not in [(1,0),(-1,0),(0,1),(0,-1),(1,-1),(-1,1)]:
                return False
        if board[square[0]][square[1]] != color:
            return False
        if (color == 1 and square[0] == 0) or (color == 2 and square[1] == 0):
            reached_0_end = True
        if (color == 1 and square[0] == 10) or (color == 2 and square[1] == 10):
            reached_10_end = True
    return reached_10_end and reached_0_end


@login_required
def get_moves(request, game_id):
    game = Game.objects.get(pk=game_id)
    if request.user not in [game.player1, game.player2]:
        return JsonResponse({'error': 'not authorized'})
    move = game.moves.get(move_num=game.latest_move_num)
    response = {
        'latest_move': {
            'move_num': move.move_num,
            'x': move.x,
            'y': move.y,
            'player': move.player,
            'timestamp': move.timestamp
        },
        'stage': game.stage,
        'winner': game.winner,
    }
    return JsonResponse(response)
