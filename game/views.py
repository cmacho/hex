from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.contrib.auth import authenticate, login, logout
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
        email = request.POST['email']

        # ensure password matches confirmation
        password = request.POST['password']
        confirmation = request.POST['confirmation']
        if password != confirmation:
            return render(request, 'game/register.html', {
                'message': 'Passwords must match.'
            })

        # attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
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
