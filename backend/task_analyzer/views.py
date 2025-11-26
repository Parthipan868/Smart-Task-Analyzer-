from django.shortcuts import render
from django.views.generic import TemplateView

class FrontendAppView(TemplateView):
    """
    Serves the compiled frontend entry point.
    """
    def get(self, request):
        return render(request, 'index.html')
