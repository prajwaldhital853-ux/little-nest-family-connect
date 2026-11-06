from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone
from django.utils.text import slugify


class PublishStatus( models.TextChoices ):
    DRAFT = "draft", "Draft"
    PUBLISHED = "published", "Published"


# Images that ship inside the public site bundle, so they are referenced by key rather
# than by link. Kept in step with src/pages/site/media.ts in little-nest-family-connect.
SITE_PHOTOS = [
    "portrait", "ageingCouple", "teaching", "caregiver",
    "research", "checkup", "clinic", "press",
]


class ContentManager( models.Manager ):
    def published( self ):
        return self.filter( status = PublishStatus.PUBLISHED )


class Content( models.Model ):
    """Shared publishing state for every editable block on the public site."""

    status = models.CharField( max_length = 12, choices = PublishStatus.choices, default = PublishStatus.DRAFT )
    published_at = models.DateTimeField( null = True, blank = True, editable = False )
    order = models.IntegerField( default = 0, help_text = "Lower numbers come first. Use a negative number to pin near the top." )
    created_at = models.DateTimeField( auto_now_add = True )
    updated_at = models.DateTimeField( auto_now = True )

    objects = ContentManager()

    class Meta:
        abstract = True
        ordering = [ "order", "-published_at" ]

    def save( self, *args, **kwargs ):
        if self.status == PublishStatus.PUBLISHED and self.published_at is None:
            self.published_at = timezone.now()
        if self.status != PublishStatus.PUBLISHED:
            self.published_at = None
        super().save( *args, **kwargs )


class Post( Content ):
    """A blog article. The blocks are what the doctor writes; the body is the same words as plain
    text, kept so an older row still reads and the length check has something to count."""

    title = models.CharField( max_length = 200 )
    slug = models.SlugField( max_length = 90, unique = True )
    topic = models.CharField( max_length = 80 )
    excerpt = models.CharField( max_length = 300 )
    minutes = models.PositiveSmallIntegerField( default = 5 )
    blocks = models.JSONField(
        default = list,
        blank = True,
        help_text = "Headings, paragraphs, lists and quotes, in the order the article reads.",
    )
    body = models.TextField( blank = True )
    photo = models.CharField(
        max_length = 40,
        blank = True,
        help_text = "Name of an image bundled with the site. Left blank, the photo link below is used.",
    )
    photo_url = models.CharField(
        max_length = 500,
        blank = True,
        help_text = "A picture uploaded from the panel, or a full https link to one.",
    )
    photo_alt = models.CharField( max_length = 200, blank = True )

    class Meta:
        ordering = [ "order", "-published_at" ]
        verbose_name_plural = "blog posts"
        indexes = [
            # Every list the panel and the site ask for filters by state and then sorts by the
            # editorial order, so that pair is the one index worth keeping here.
            models.Index( fields = [ "status", "order", "-published_at" ], name = "post_list_idx" ),
        ]
        constraints = [
            # The slug is built from the title, so two articles named alike would be the same article
            # twice on the blog page. A double click on Save is the usual cause.
            models.UniqueConstraint( Lower( "title" ), name = "unique_post_title" ),
        ]

    def __str__( self ):
        return self.title

    def save( self, *args, **kwargs ):
        if not self.slug:
            base = slugify( self.title )[:80] or "post"
            candidate = base
            suffix = 2
            while Post.objects.filter( slug = candidate ).exclude( pk = self.pk ).exists():
                candidate = f"{ base }-{ suffix }"
                suffix += 1
            self.slug = candidate
        super().save( *args, **kwargs )


class MediaItem( Content ):
    """A video or recording shown on the media page."""

    class Kind( models.TextChoices ):
        INTERVIEW = "interview", "Interview"
        TV = "tv_interview", "TV interview"
        TALK = "talk", "Talk"
        REEL = "reel", "Reel"
        LOCAL = "local", "Uploaded video"

    title = models.CharField( max_length = 200 )
    kind = models.CharField( max_length = 16, choices = Kind.choices, default = Kind.INTERVIEW )
    url = models.URLField( max_length = 500, unique = True )
    source = models.CharField( max_length = 120, blank = True, help_text = "Channel, programme or outlet." )
    poster_url = models.URLField( blank = True )

    class Meta:
        ordering = [ "order", "title" ]
        indexes = [ models.Index( fields = [ "status", "order", "title" ], name = "mediaitem_list_idx" ) ]

    def __str__( self ):
        return self.title


class PressArticle( Content ):
    """A written feature about or by the doctor, linked out to the publisher."""

    title = models.CharField( max_length = 200 )
    topic = models.CharField( max_length = 80, default = "Feature article" )
    source = models.CharField( max_length = 120 )
    url = models.URLField( max_length = 500, unique = True )
    blurb = models.CharField( max_length = 400 )
    photo = models.CharField(
        max_length = 40,
        blank = True,
        help_text = "Name of an image bundled with the site. Left blank, the photo link below is used.",
    )
    photo_url = models.CharField(
        max_length = 500,
        blank = True,
        help_text = "A picture uploaded from the panel, or a full https link to one.",
    )
    photo_alt = models.CharField( max_length = 200, blank = True )

    class Meta:
        ordering = [ "order", "-published_at" ]
        indexes = [ models.Index( fields = [ "status", "order", "-published_at" ], name = "pressarticle_list_idx" ) ]

    def __str__( self ):
        return self.title


class Publication( Content ):
    """One row of the publication list, linked to its landing page."""

    class Kind( models.TextChoices ):
        RESEARCH = "research", "Original research"
        REVIEW = "review", "Review or book chapter"
        CASE = "case", "Case report"
        ABSTRACT = "abstract", "Conference abstract or editorial"
        OTHER = "other", "Other writing"

    title = models.CharField( max_length = 300 )
    authors = models.CharField( max_length = 500 )
    venue = models.CharField( max_length = 200, help_text = "Journal, conference or book." )
    year = models.PositiveSmallIntegerField()
    link = models.URLField( blank = True, max_length = 500 )
    tag = models.CharField( max_length = 60, blank = True, help_text = "Theme used to filter the list." )
    kind = models.CharField(
        max_length = 12,
        choices = Kind.choices,
        default = Kind.RESEARCH,
        help_text = "Decides which part of the list this appears in and how it is laid out.",
    )

    class Meta:
        ordering = [ "-year", "order", "title" ]
        indexes = [
            models.Index( fields = [ "status", "-year", "order" ], name = "publication_list_idx" ),
            # The research page splits the list by type and by theme, both inside a year.
            models.Index( fields = [ "kind", "-year" ], name = "publication_kind_year_idx" ),
            models.Index( fields = [ "tag", "-year" ], name = "publication_tag_year_idx" ),
        ]
        constraints = [
            # Listing the same paper twice is a mistake the doctor should not be able to save.
            models.UniqueConstraint( Lower( "title" ), "year", name = "unique_publication_per_year" ),
        ]

    def __str__( self ):
        return f"{ self.title } ({ self.year })"


# The four headings the site's own list was built under, before a row carried a type of its own.
# Kept here so the importer can fill the type in instead of leaving every paper as research.
PUBLICATION_KIND_BY_HEADING = {
    "original research": Publication.Kind.RESEARCH,
    "reviews and book chapters": Publication.Kind.REVIEW,
    "case reports": Publication.Kind.CASE,
    "conference abstracts and editorials": Publication.Kind.ABSTRACT,
}


class Faq( Content ):
    """A question and answer used in one of the site's FAQ blocks."""

    class Group( models.TextChoices ):
        HOME = "home", "Home page"
        HOW_IT_WORKS = "how-it-works", "How it works page"
        TEACHING = "teaching", "Teaching page"

    group = models.CharField( max_length = 20, choices = Group.choices, default = Group.HOME )
    question = models.CharField( max_length = 300 )
    answer = models.TextField()

    class Meta:
        ordering = [ "group", "order", "question" ]
        verbose_name = "FAQ item"
        verbose_name_plural = "FAQ items"
        indexes = [
            # The site asks for one heading's questions at a time, in the order they read.
            models.Index( fields = [ "status", "group", "order", "question" ], name = "faq_group_idx" ),
        ]
        constraints = [
            # Case is not a reason to answer the same question twice.
            models.UniqueConstraint( Lower( "question" ), Lower( "group" ), name = "unique_question_per_group" ),
        ]

    def __str__( self ):
        return self.question


class PageCopy( models.Model ):
    """Every word a page shows that is not an article: heroes, headings, labels, buttons, footers.

    The shape is deliberately free. A page keeps one JSON blob, and the panel builds a form
    out of the keys, so adding a line of copy never needs a migration.
    """

    key = models.SlugField( max_length = 64, unique = True, help_text = "The page this copy belongs to, for example about or contact." )
    label = models.CharField( max_length = 120, help_text = "Name shown in the panel." )
    data = models.JSONField( default = dict, blank = True )
    published = models.BooleanField( default = True )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null = True,
        blank = True,
        on_delete = models.SET_NULL,
        related_name = "page_copies_edited",
    )
    created_at = models.DateTimeField( auto_now_add = True )
    updated_at = models.DateTimeField( auto_now = True )

    class Meta:
        ordering = [ "key" ]
        verbose_name = "page copy"
        verbose_name_plural = "page copy"

    def __str__( self ):
        return self.label


class SiteImage( models.Model ):
    """A picture uploaded from the panel.

    Page copy stores its relative url, so the same file can serve several sections and a
    deleted upload never leaves a hole: the site falls back to the bundled photo it knew before.
    """

    file = models.FileField(
        upload_to = "site-images/%Y/%m/",
        validators = [ FileExtensionValidator( allowed_extensions = [ "jpg", "jpeg", "png", "webp", "gif" ] ) ],
    )
    label = models.CharField( max_length = 80, blank = True, help_text = "A short name to recognise it by in the panel." )
    alt = models.CharField( max_length = 200, blank = True, help_text = "What the picture shows, for people who cannot see it." )
    # The size is written once, at upload. Reading it back off the disk for every row of the
    # picture list is what made the gallery slow, and on a redeploy the disk may not even have it.
    byte_size = models.BigIntegerField( default = 0, help_text = "How big the file is, recorded when it arrives." )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null = True,
        blank = True,
        on_delete = models.SET_NULL,
        related_name = "site_images",
    )
    created_at = models.DateTimeField( auto_now_add = True )

    class Meta:
        ordering = [ "-created_at" ]
        verbose_name = "site image"
        verbose_name_plural = "site images"
        indexes = [ models.Index( fields = [ "-created_at" ], name = "siteimage_recent_idx" ) ]

    def __str__( self ):
        return self.label or self.file.name.rsplit( "/", 1 )[ -1 ]
