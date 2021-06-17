from django.contrib.auth.models import AbstractUser
from django.db import models
import datetime

# Create your models here.

class User(AbstractUser):
    rating = models.IntegerField(default = 1000)

class Game(models.Model):
    COLORS = [('R', 'Red'), ('B','Blue'), ('N', 'No color')]
    player1 = models.ForeignKey("User", on_delete=models.PROTECT, related_name='games_p1')
    player2 = models.ForeignKey("User", on_delete=models.PROTECT, related_name='games_p2')
    player1color = models.CharField(max_length=2, choices=COLORS, default='N')
    latest_move_num = models.IntegerField()
    latest_move_datetime = models.DateTimeField()
    board = models.JSONField()
    time_used_p1 = models.DurationField(default = datetime.timedelta()) #default is 0
    time_used_p2 = models.DurationField(default = datetime.timedelta()) #default is 0
    created_at = models.DateTimeField(auto_now_add=True)
    game_started_at = models.DateTimeField()
    time_per_player = models.DurationField()
    time_increment_per_move = models.DurationField()

    def __str__(self):
        return f"game {self.id} created by {self.player1} at {self.created_at}"

class Move(models.Model):
    COLORS = [('R', 'Red'), ('B','Blue')]
    game = models.ForeignKey('Game', on_delete=models.CASCADE, related_name='moves')
    x = models.IntegerField()
    y = models.IntegerField()
    color = models.CharField(max_length=1, choices=COLORS)
    player = models.IntegerField() # player 1 or 2
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.color} at ({self.x},{self.y}) at {self.timestamp}"
