from rest_framework.pagination import CursorPagination, PageNumberPagination


class PanelPagination( PageNumberPagination ):
    """The panel asks for its own page size, capped so a list cannot pull the whole table."""

    page_size_query_param = "page_size"
    max_page_size = 100


class FeedPagination( CursorPagination ):
    """Blog cards load a few at a time, so a long list never costs a slow first paint.

    The cursor walks the same editorial order the site bundle uses, so a page
    cannot reshuffle simply because it started arriving a few at a time.
    """

    page_size = 9
    page_size_query_param = "page_size"
    max_page_size = 30
    ordering = [ "order", "id" ]


class MediaFeedPagination( FeedPagination ):
    page_size = 6
