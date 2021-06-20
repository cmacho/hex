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
    path("<int:game_id>/get_status", views.get_status, name='get_status'),

]
