from django.urls import path

from .views import CollectView, SummaryView

urlpatterns = [
    path( "collect/", CollectView.as_view(), name = "analytics-collect" ),
    path( "summary/", SummaryView.as_view(), name = "analytics-summary" ),
]
