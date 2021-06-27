from django.contrib.auth.models import AbstractUser
from django.db import models
import datetime

# Create your models here.

class User(AbstractUser):
    rating = models.IntegerField(default = 1000)


class Game(models.Model):
    class Color(models.IntegerChoices):
        RED = 1, 'Red'
        BLUE = 2, 'Blue'

        __empty__ = 'No color'

    class ColorSelectionMode(models.IntegerChoices):
        CAKE_RAND = 1, 'Cake Rule - random player slices cake'
        CAKE_1 = 2, 'Cake Rule - player 1 slices cake'
        CAKE_2 = 3, 'Cake Rule - player 2 slices cale'
        RED = 4, 'Player 1 is red'
        BLUE = 5, 'Player 2 is red'
        RAND = 6, 'Random Colors'

    class Stage(models.IntegerChoices):
        NOT_STARTED = 0, 'Game has not started'
        CUTTING_CAKE = 1, 'Waiting for cake_cutter to make the first move (cake rule)'
        CHOOSING_PIECE = 2, ('Waiting for the player who is ' +
                             'not cake_cutter to choose a color (cake rule)')
        NORMAL_PLAY = 3, 'Each player has a color, red or blue, and the game is ongoing'
        GAME_HAS_ENDED = 4, 'The game has ended'

    def board_default():
        return [[0]*11]*11

    player1 = models.ForeignKey("User", on_delete=models.PROTECT, related_name='games_p1')
    player2 = models.ForeignKey("User", on_delete=models.PROTECT, related_name='games_p2', blank=True, null=True)
    player1color = models.IntegerField(choices=Color.choices, blank=True, null=True)
    latest_move_num = models.IntegerField(blank=True, null=True, default=0)
    latest_move_datetime = models.DateTimeField(blank=True, null=True)
    board = models.JSONField(blank=True, null=True, default=board_default)
    time_used_p1 = models.DurationField(default = datetime.timedelta()) #default is 0
    time_used_p2 = models.DurationField(default = datetime.timedelta()) #default is 0
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    stage = models.IntegerField(choices=Stage.choices, default=0)
    game_started_at = models.DateTimeField(blank=True, null=True)
    color_selection_mode = models.IntegerField(choices=ColorSelectionMode.choices)
    time_per_player = models.DurationField()
    time_increment_per_move = models.DurationField()
    last_ping_player1 = models.DateTimeField(blank=True, null=True)
    last_ping_player2 = models.DateTimeField(blank=True, null=True)
    cake_cutter = models.IntegerField(blank=True, null=True)
    winner = models.IntegerField(blank=True, null=True)
    player1_ready = models.BooleanField(default=False)
    player2_ready = models.BooleanField(default=False)

    def __str__(self):
        return f"game {self.id} created by {self.player1} at {self.created_at}"


class Move(models.Model):
    game = models.ForeignKey('Game', on_delete=models.CASCADE, related_name='moves')
    x = models.IntegerField()
    y = models.IntegerField()
    player = models.IntegerField() # player 1 or 2
    timestamp = models.DateTimeField(auto_now_add=True)
    move_num = models.IntegerField() # TODO make move_num together with game unique

    def __str__(self):
        return f"move number {self.move_num} at ({self.x},{self.y}) at {self.timestamp}"

