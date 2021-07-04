import json
import random
from django.utils import timezone
from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from .models import User, Game, Move
import datetime

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
    except Exception as e:
        return HttpResponse(f'Could not find game {e}') #TODO: make 404
    if request.user not in [game.player1, game.player2]:
        if game.player2 is None:
            game.player2=request.user
            game.save()
        else:
            return HttpResponse(f'Game already full')
    if game.stage == 1:
        time_on_current_move = timezone.now() - game.game_started_at
    elif game.stage == 2:
        time_on_current_move = timezone.now() - game.latest_move_datetime
    elif game.stage == 3 and game.latest_move_num > 0:
        time_on_current_move = timezone.now() - game.latest_move_datetime
    elif game.stage == 3 and game.latest_move_num == 0:
        time_on_current_move = timezone.now() - game.game_started_at
    else:
        time_on_current_move = datetime.timedelta() # 0 seconds
    return render(request, 'game/game.html', {
        'game_id': game.id,
        'stage': game.stage,
        'player1': game.player1,
        'player2': game.player2,
        'player1color': game.player1color,
        'color_selection_mode': game.color_selection_mode,
        'moves': game.moves.order_by('move_num'),
        'winner': game.winner,
        'cake_cutter': game.cake_cutter,
        'seconds_used_p1': int(game.time_used_p1.total_seconds()),
        'seconds_used_p2': int(game.time_used_p2.total_seconds()),
        'player1_ready': game.player1_ready,
        'player2_ready': game.player2_ready,
        'seconds_current_move': int(
            time_on_current_move.total_seconds()
        ),
        'use_time_control': game.use_time_control,
    })

def games(request):
    games = Game.objects.filter(stage=0).all()
    return render(request, 'game/games.html', {
        'games': games
    })

@login_required
def create_game(request):
    if request.method == 'POST':
        try:
            color_selection_mode = int(request.POST['color-assignment-rule'])
            if color_selection_mode not in (1,2,3,4,5,6):
                raise Exception()
        except:
            return HttpResponse("invalid color selection mode")
        cake_cutter = None
        player1color = None
        if color_selection_mode == 2:
            cake_cutter = 1
        elif color_selection_mode == 3:
            cake_cutter = 2
        elif color_selection_mode == 4:
            player1color = 1
        elif color_selection_mode == 5:
            player1color = 2

        use_time_control_str = request.POST['use_time_control']
        if use_time_control_str == 'yes':
            use_time_control = True
        else:
            use_time_control = False

        try:
            time_per_player_string = request.POST['time-per-player']
            time_increment_string = request.POST['time-increment']
            time_arr = [int(a) for a in time_per_player_string.split(',')]
            increment_arr = [int(a) for a in time_increment_string.split(',')]
            time_per_player = datetime.timedelta(days=time_arr[0],
                                                 hours=time_arr[1],
                                                 minutes=time_arr[2],
                                                 seconds=time_arr[3])
            time_increment = datetime.timedelta(days=increment_arr[0],
                                                hours=increment_arr[1],
                                                minutes=increment_arr[2],
                                                seconds=increment_arr[3])
        except:
            return HttpResponse('invalid time control options')
        try:
            game = Game(
                    player1=request.user,
                    color_selection_mode=color_selection_mode,
                    time_per_player=time_per_player,
                    time_increment_per_move=time_increment,
                    cake_cutter=cake_cutter,
                    player1color=player1color,
                    use_time_control=use_time_control
            )
            game.save()
        except:
            return HttpResponse("could not create game")

        return HttpResponseRedirect(reverse('game', kwargs={'game_id': game.id}))

    # if GET request:
    return render(request, 'game/create_game.html')


@login_required
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
            if new_board[move_data['x']][move_data['y']] != 0:
                return JsonResponse({
                    "error": 'illegal move. hexagon already colored.'
                })
            new_board[move_data['x']][move_data['y']] = color_to_move
            new_move = Move(move_num=move_data['move_num'],
                            player=move_data['player'],
                            game=game, x=move_data['x'], y=move_data['y'])
            new_move.save()
            game.latest_move_num = move_data['move_num']
            game.latest_move_datetime = new_move.timestamp
            game.board = new_board
            game.stage = 2

            current_time = timezone.now()
            time_diff = current_time - game.game_started_at

            if player_id_request == 1:
                game.time_used_p1 = game.time_used_p1 + time_diff
            else:
                game.time_used_p2 = game.time_used_p2 + time_diff

            game.save()
            return JsonResponse({
                                 "status": "ok",
                                 "new_latest_move_num": game.latest_move_num,
                                 "seconds_used_p1": int(game.time_used_p1.total_seconds()),
                                 "seconds_used_p2": int(game.time_used_p2.total_seconds()),
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
        print(f'game.latest_move_num is {game.latest_move_num}')
        print(f'color_to_move is {color_to_move}')
        color_player_request = (
            2 - (player_id_request + game.player1color + 1) % 2
        )
        print(f"color_player_request is {color_player_request}")
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
            if game.latest_move_datetime is not None:
                time_diff = new_move.timestamp - game.latest_move_datetime
            else:
                time_diff = new_move.timestamp - game.game_started_at

            if player_id_request == 1:
                game.time_used_p1 = game.time_used_p1 + time_diff
            else:
                game.time_used_p2 = game.time_used_p2 + time_diff

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
                                 "new_latest_move_num": game.latest_move_num,
                                 "seconds_used_p1": int(game.time_used_p1.total_seconds()),
                                 "seconds_used_p2": int(game.time_used_p2.total_seconds())
                                })

        else:
            return JsonResponse({
                        "error": "it is not your turn",
                        "color_to_move": color_to_move,
                        "color_player_request": color_player_request
            })
    elif game.stage == 4:
        return JsonRespone({"error": "Game has already ended"})


@login_required
def choose_color(request, game_id):
    if request.method != 'PUT':
        return JsonResponse({"error": "PUT request required"}, status = 400)
    data = json.loads(request.body)
    print("data is:")
    print(data)
    try:
        game = Game.objects.get(pk=game_id)
    except:
        return JsonResponse({"error": "could not find game"}, status = 404)
    if game.player1 == request.user:
        player_id_request = 1
    elif game.player2 == request.user:
        player_id_request = 2
    else:
        return JsonResponse({
            "error": "not authorized to make a move in this game"
        })
    if game.stage != 2:
        return JsonResponse({
            "error": "not expecting a player to choose a color at the moment"
        })
    if player_id_request == game.cake_cutter:
        return JsonResponse({
            "error": "the other player should choose a color"
        })
    game.player1color = data['player1color']
    game.stage = 3
    current_time = timezone.now()
    time_diff = current_time - game.latest_move_datetime

    if player_id_request == 1:
        game.time_used_p1 = game.time_used_p1 + time_diff
    else:
        game.time_used_p2 = game.time_used_p2 + time_diff

    game.save()
    return JsonResponse({
        "status": "ok",
        "stage": game.stage,
        "player1color": game.player1color,
        "seconds_used_p1": int(game.time_used_p1.total_seconds()),
        "seconds_used_p2": int(game.time_used_p2.total_seconds())
    })

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
    if game.latest_move_num is None or game.latest_move_num == 0:
        return JsonResponse({'latest_move': None})
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
        'seconds_used_p1': int(game.time_used_p1.total_seconds()),
        'seconds_used_p2': int(game.time_used_p2.total_seconds())
    }
    return JsonResponse(response)


@login_required
def get_colors(request, game_id):
    try:
        game = Game.objects.get(pk=game_id)
    except:
        return JsonResponse({"error": "game not found"})
    if request.user not in [game.player1, game.player2]:
        return JsonResponse({'error': 'not authorized'})
    if game.stage == 0:
        return JsonResponse({'error': 'game has not started yet'})
    response = {
        'player1color': game.player1color,
        'stage': game.stage,
        'seconds_used_p1': int(game.time_used_p1.total_seconds()),
        'seconds_used_p2': int(game.time_used_p2.total_seconds()),
    }
    return JsonResponse(response)


@login_required
def toggle_rdy(request, game_id):
    if request.method != 'PUT':
        return JsonResponse({"error": "PUT request required"}, status=400)
    try:
        game = Game.objects.get(pk=game_id)
    except:
        return JsonResponse({"error": "game not found"})
    if request.user not in [game.player1, game.player2]:
        return JsonResponse({'error': 'not authorized'})
    data = json.loads(request.body)
    try:
        if data['ready'] == 1 and game.player1 == request.user:
            game.player1_ready = True
        elif data['ready'] == 0 and game.player1 == request.user:
            game.player1_ready = False
        elif data['ready'] == 1 and game.player2 == request.user:
            game.player2_ready = True
        elif data['ready'] == 0 and game.player2 == request.user:
            game.player2_ready = False

        if game.player1_ready and game.player2_ready:
            start_game(game)
        else:
            game.save()
    except:
        return JsonResponse({'error': 'could not update game'})
    if game.player2 is None:
        player2_id = None
        player2_name = None
    else:
        player2_id = game.player2.id
        player2_name = game.player2.username
    return JsonResponse({
        'status': 'ok',
        'player1_ready': game.player1_ready,
        'player2_ready': game.player2_ready,
        'player2_id': player2_id,
        'player2_name': player2_name
    })


def start_game(game):
    if game.color_selection_mode == 1:
        game.cake_cutter = random.randrange(1,3)
    elif game.color_selection_mode == 6:
        game.player1color = random.randrange(1,3)
    if game.color_selection_mode in (1,2,3):
        game.stage = 1
    elif game.color_selection_mode in (4,5,6):
        game.stage = 3
    else:
        print('invalid colorSelectionMode')
    game.game_started_at = timezone.now()
    game.save()


@login_required
def leave_game(request, game_id):
    if request.method != 'PUT':
        return JsonResponse({"error": "PUT request required"}, status=400)
    try:
        game = Game.objects.get(pk=game_id)
    except:
        return JsonResponse({"error": "game not found"})
    if request.user != game.player2:
        return JsonResponse({'error': 'not authorized'})
    if game.stage != 0:
        return JsonResponse({'error': 'game has already started'})
    game.player2 = None
    game.player2_ready = False
    game.save()
    return JsonResponse({'status':'ok'})


@login_required
def get_player_info(request, game_id):
    try:
        game = Game.objects.get(pk=game_id)
    except:
        return JsonResponse({"error": "game not found"})
    if game.stage == 0:
        player1color_response = None
        cake_cutter_response = None
    else:
        player1color_response = game.player1color
        cake_cutter_response = game.cake_cutter
    if game.player2 is None:
        player2_id = None
        player2_name = None
    else:
        player2_id = game.player2.id
        player2_name = game.player2.username
    return JsonResponse({
        'status': 'ok',
        'stage': game.stage,
        'player1_ready': game.player1_ready,
        'player2_ready': game.player2_ready,
        'player1_id': game.player1.id,
        'player2_id': player2_id,
        'player1_name': game.player1.username,
        'player2_name': player2_name,
        'player1color': player1color_response,
        'cake_cutter': cake_cutter_response,
    })
