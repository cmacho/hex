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
        game_object = Game.objects.get(pk=game_id)
        return render(request, 'game/game.html', {
            'game_id': game_object.id,
            'game_has_started': game_object.game_has_started,
            'player1': game_object.player1,
            'player2': game_object.player2,
            'player1color': game_object.player1color,
            'color_selection_mode': game_object.color_selection_mode,
            'moves': game_object.moves.order_by('move_num'),
        })
    except Exception as e:
        return HttpResponse(f'Could not find game {e}') #TODO: make 404

def games(request):
    return HttpResponseRedirect(reverse('index'))

def create_game(request):
    return render(request, 'game/create_game.html')

def get_status(request, game_id):
    game_object = Game.objects.get(pk=game_id)
    return JsonResponse({
        'game_has_started': game_object.game_has_started
    })

def make_move(request, game_id):
    if request.method != 'PUT':
        return JsonResponse({"error": "PUT request required"}, status = 400)
    data = json.loads(request.body)
    print("data is:")
    print(data)
    game = Game.objects.get(pk=game_id)
    if not game.game_has_started:
        return JsonResponse({"error": "cannot make move. game has not started"})
    if game.player1 == request.user:
        player_id_request = 1
    elif game.player2 == request.user:
        player_id_request = 2
    else:
        return JsonResponse({"error": "not authorized to make a move in this game"})
    if game.player1color is not None:
        color_to_move = game.latest_move_num % 2 + 1
        color_player_request = 2 - (player_id_request + game.player1color + 1) % 2
        if color_to_move == color_player_request:
            if data['player'] != player_id_request:
                return JsonResponse({"error": "wrong player id"})
            if data['move_num'] != game.latest_move_num + 1:
                return JsonResponse({"error": "wrong move_num"})
            new_board = game.board.copy()
            if new_board[data['x']][data['y']] != 0:
                return JsonResponse({"error": 'illegal move. hexagon already colored.'})
            new_board[data['x']][data['y']] = color_to_move
            new_move = Move(move_num=data['move_num'], player=data['player'], game=game,
                            x=data['x'], y=data['y'])
            print(f"new_move is {new_move}")
            print(f"new_move.game is {new_move.game}")
            new_move.save()
            game.latest_move_num = data['move_num']
            game.latest_move_datetime = new_move.timestamp
            game.board = new_board
            print(f"new_board is {new_board}")
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
    else:
        if game.latest_move_num == 0 and player_id_request == game.cake_cutter:
            color_to_move = 1
            if data['player'] != player_id_request:
                return JsonResponse({"error": "wrong player id"})
            if data['move_num'] != game.latest_move_num + 1:
                return JsonResponse({"error": "wrong move_num"})
            new_board = game.board.copy()
            if new_board[data['x'], data['y']] != 0:
                return JsonResponse({"error": 'illegal move. hexagon already colored.'})
            new_board[data['x'], data['y']] = color_to_move
            new_move = Move(move_num=data['move_num'], player=data['player'], game=game,
                            x=data['x'], y=data['y'])
            new_move.save()
            game.latest_move_num = data['move_num']
            game.latest_move_datetime = new_move.timestamp
            game.board = new_board
            return JsonResponse({
                                 "status": "ok",
                                 "new_latest_move_num": game.latest_move_num
                                })
        elif game_latest_move_num > 0:
            print(f'integrity error in game. player1color is None but latest_move_num>0.')
            return JsonResponse({"error": "it is not your turn",
                                 "player1color": game.player1color,
                                 "game_latest_move_num": game_latest_move_num})
        else:
            return JsonResponse({"error": "it is not your turn.",
                                 "cake_cutter": game.cake_cutter,
                                 "player1color": game.player1color,
                                 "game_latest_move_num": game_latest_move_num})

@login_required
def get_moves(request, game_id):
    game = Game.objects.get(pk=game_id)
    if request.user not in [game.player1, game.player2]:
        return JsonResponse({'error': 'not authorized'})
    move = game.moves.get(pk=game.latest_move_num)
    response = {
        'move_num': move.move_num,
        'x': move.x,
        'y': move.y,
        'player': move.player,
        'timestamp': move.timestamp
    }
    return JsonResponse(response)
