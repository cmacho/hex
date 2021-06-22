from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name="index"),
    path('login', views.login_view, name="login"),
    path('logout', views.logout_view, name="logout"),
    path('register', views.register, name="register"),
    path('games', views.games, name='games'),
    path('game/<int:game_id>', views.game, name='game'),
    path('create_game', views.create_game, name='create_game'),

    #API Routes
    path("make_move/<int:game_id>", views.make_move, name='make_move'),
    path("game/get_moves/<int:game_id>", views.get_moves, name='get_moves'),
]
