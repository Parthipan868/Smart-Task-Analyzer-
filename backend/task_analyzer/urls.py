from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tasks.urls')),  # Changed from 'api/tasks/' to 'api/'
    
    # Serve static files in development
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# This should be the last URL pattern
urlpatterns += [
    # Frontend catch-all pattern - only match if the URL doesn't start with /api/ or /admin/ or /static/
    re_path(r'^(?!api/|static/|admin/).*$', TemplateView.as_view(template_name='index.html')),
]
