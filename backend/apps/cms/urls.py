from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (
    FaqViewSet,
    MediaFeedView,
    MediaItemViewSet,
    PageCopyViewSet,
    PostDetailFeedView,
    PostFeedView,
    PostViewSet,
    PressArticleViewSet,
    PublicationViewSet,
    SiteContentView,
    SiteImageViewSet,
)

router = SimpleRouter()
router.register( "posts", PostViewSet, basename = "post" )
router.register( "media", MediaItemViewSet, basename = "media-item" )
router.register( "press", PressArticleViewSet, basename = "press-article" )
router.register( "publications", PublicationViewSet, basename = "publication" )
router.register( "faqs", FaqViewSet, basename = "faq" )
router.register( "pages", PageCopyViewSet, basename = "page-copy" )
router.register( "images", SiteImageViewSet, basename = "site-image" )

urlpatterns = [
    path( "site/", SiteContentView.as_view(), name = "site-content" ),
    path( "feed/posts/", PostFeedView.as_view(), name = "feed-posts" ),
    path( "feed/posts/<slug:slug>/", PostDetailFeedView.as_view(), name = "feed-post-detail" ),
    path( "feed/media/", MediaFeedView.as_view(), name = "feed-media" ),
    *router.urls,
]
