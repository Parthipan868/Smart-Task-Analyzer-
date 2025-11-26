from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

class Task(models.Model):
    name = models.CharField(max_length=200)
    deadline = models.DateTimeField()
    importance = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Importance level from 1 (low) to 10 (high)"
    )
    effort = models.FloatField(
        validators=[MinValueValidator(0.5)],
        help_text="Estimated effort in hours"
    )
    score = models.FloatField(default=0, editable=False)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (Score: {self.score:.1f})"

    class Meta:
        ordering = ['-score', 'deadline']
        
    def save(self, *args, **kwargs):
        self.calculate_score()
        super().save(*args, **kwargs)
    
    def calculate_score(self):
        from django.conf import settings
        from datetime import datetime, timezone as tz
        
        now = datetime.now(tz=tz.utc)
        deadline = self.deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=tz.utc)
            
        time_until_deadline = (deadline - now).total_seconds() / 3600  # in hours
        
        # Normalize values (0-1 range)
        normalized_importance = self.importance / 10  # Already 1-10
        normalized_urgency = min(1, 1 / (time_until_deadline / 24 + 1))  # More urgent as deadline approaches
        normalized_effort = 1 - min(1, self.effort / 10)  # Lower effort is better
        
        # Weighted score based on settings
        self.score = (
            (normalized_importance * 0.5) +
            (normalized_urgency * 0.3) +
            (normalized_effort * 0.2)
        ) * 100
