from rest_framework import serializers
from .models import Task
from datetime import datetime, timezone

class TaskSerializer(serializers.ModelSerializer):
    time_remaining = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'name', 'deadline', 'importance', 'effort', 
            'score', 'completed', 'created_at', 'updated_at',
            'time_remaining', 'is_overdue'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'score']
    
    def get_time_remaining(self, obj):
        if obj.completed:
            return None
            
        now = datetime.now(timezone.utc)
        if obj.deadline.tzinfo is None:
            deadline = obj.deadline.replace(tzinfo=timezone.utc)
        else:
            deadline = obj.deadline
            
        delta = deadline - now
        if delta.total_seconds() <= 0:
            return "Overdue"
            
        days = delta.days
        hours = int(delta.seconds / 3600)
        
        if days > 0:
            return f"{days} day{'s' if days > 1 else ''} {hours} hour{'s' if hours != 1 else ''}"
        return f"{hours} hour{'s' if hours != 1 else ''}"
    
    def get_is_overdue(self, obj):
        if obj.completed:
            return False
            
        now = datetime.now(timezone.utc)
        if obj.deadline.tzinfo is None:
            deadline = obj.deadline.replace(tzinfo=timezone.utc)
        else:
            deadline = obj.deadline
            
        return now > deadline
    
    def validate_deadline(self, value):
        if value < datetime.now(timezone.utc):
            raise serializers.ValidationError("Deadline cannot be in the past")
        return value
    
    def validate_importance(self, value):
        if not (1 <= value <= 10):
            raise serializers.ValidationError("Importance must be between 1 and 10")
        return value
    
    def validate_effort(self, value):
        if value < 0.5:
            raise serializers.ValidationError("Effort must be at least 0.5 hours")
        return value
