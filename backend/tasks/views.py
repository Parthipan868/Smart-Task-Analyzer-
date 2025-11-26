from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.http import HttpResponse
from .models import Task
from .serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows tasks to be viewed or edited.
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [AllowAny]  # For development only, restrict in production
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['completed']
    ordering_fields = ['deadline', 'importance', 'score', 'created_at']
    ordering = ['-score', 'deadline']

    def get_queryset(self):
        queryset = Task.objects.all()
        
        # Filter by completion status
        completed = self.request.query_params.get('completed', None)
        if completed is not None:
            queryset = queryset.filter(completed=completed.lower() == 'true')
            
        # Filter by overdue tasks
        overdue = self.request.query_params.get('overdue', None)
        if overdue is not None and overdue.lower() == 'true':
            queryset = queryset.filter(completed=False, deadline__lt=timezone.now())
            
        return queryset

    @action(detail=True, methods=['post'])
    def toggle_complete(self, request, pk=None):
        """Toggle the completion status of a task."""
        task = self.get_object()
        task.completed = not task.completed
        task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)

def home(request):
    return HttpResponse("""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Task Analyzer</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 20px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background-color: #f5f7fa;
                }
                .container {
                    text-align: center;
                    max-width: 600px;
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #4a6fa5;
                    margin-bottom: 20px;
                }
                p {
                    color: #666;
                    margin-bottom: 30px;
                }
                a {
                    display: inline-block;
                    background-color: #4a6fa5;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 4px;
                    font-weight: bold;
                    transition: background-color 0.3s;
                }
                a:hover {
                    background-color: #3a5a8c;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Welcome to Task Analyzer</h1>
                <p>Your intelligent task management system is running successfully!</p>
                <a href="/static/index.html">Go to Application</a>
                <div style="margin-top: 20px;">
                    <a href="/admin/" style="background-color: #6c757d;">Admin Panel</a>
                </div>
            </div>
        </body>
        </html>
    """)
