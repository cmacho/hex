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
    path("choose_color/<int:game_id>", views.choose_color,
         name='choose_color'),
    path("get_colors/<int:game_id>", views.get_colors, name='get_colors'),
    path("toggle_rdy/<int:game_id>", views.toggle_rdy, name='toggle_rdy'),
    path("leave_game", views.leave_game, name="leave_game"),
    path("get_player_info", views.get_player_info, name="get_player_info")
]
