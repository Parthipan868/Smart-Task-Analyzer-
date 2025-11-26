from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')

# The API URLs are now determined automatically by the router
urlpatterns = [
    # API endpoints
    path('', include(router.urls)),
    
    # Include DRF's login and logout views for the browsable API
    path('auth/', include('rest_framework.urls')),
]
