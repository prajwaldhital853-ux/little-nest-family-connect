from django.conf import settings
from rest_framework import serializers

from .blocks import blocks_to_text, clean_blocks
from .models import Faq, MediaItem, PageCopy, Post, PressArticle, Publication, SITE_PHOTOS, SiteImage
from .validate import clean_payload, photo_link, strip_markup

SHARED_FIELDS = [ "id", "status", "status_display", "published_at", "order", "created_at", "updated_at" ]


class CleanModelSerializer( serializers.ModelSerializer ):
    """Nothing typed into the CMS is trusted as markup, whatever field it arrives in."""

    def to_internal_value( self, data ):
        if isinstance( data, dict ):
            data = { key: ( strip_markup( value ) if isinstance( value, str ) else value ) for key, value in data.items() }
        return super().to_internal_value( data )


class BundledPhotoValidator:
    """A row's picture: either a name the site ships with, or a file the panel uploaded, or a link."""

    def validate_photo( self, value ):
        if value and value not in SITE_PHOTOS:
            raise serializers.ValidationError(
                f"Use one of the images bundled with the site: { ', '.join( SITE_PHOTOS ) }."
            )
        return value

    def validate_photo_url( self, value ):
        # An upload arrives as a path on this API's own disk, so a plain URL field would refuse
        # every picture the doctor adds from his computer.
        try:
            return photo_link( value )
        except ValueError as error:
            raise serializers.ValidationError( str( error ) ) from None


def refuse_duplicate( queryset, field, message, instance ):
    """Say which box to fix, rather than let the database answer with a 500 or store a second copy."""

    if instance is not None:
        queryset = queryset.exclude( pk = instance.pk )
    if queryset.exists():
        raise serializers.ValidationError( { field: message } )


class PostSerializer( BundledPhotoValidator, CleanModelSerializer ):
    status_display = serializers.CharField( source = "get_status_display", read_only = True )
    slug = serializers.SlugField( read_only = True )
    # Declared rather than generated: an article now arrives as the blocks he typed, and a plain
    # JSONField is the only thing that will carry them through without a model field guessing.
    blocks = serializers.JSONField( required = False )

    class Meta:
        model = Post
        fields = SHARED_FIELDS + [
            "title", "slug", "topic", "excerpt", "minutes", "blocks", "body", "photo", "photo_url", "photo_alt",
        ]
        read_only_fields = [ "id", "slug", "published_at", "created_at", "updated_at" ]

    def validate_minutes( self, value ):
        if not 1 <= value <= 120:
            raise serializers.ValidationError( "Reading time should be between 1 and 120 minutes." )
        return value

    def validate_blocks( self, value ):
        try:
            return clean_blocks( value )
        except ValueError as error:
            raise serializers.ValidationError( str( error ) ) from None

    def validate( self, attrs ):
        if "blocks" in attrs:
            # The blocks are the article; the plain text is kept from them so search, the reader's
            # length check and any renderer that only knows paragraphs still have words to work with.
            attrs[ "body" ] = blocks_to_text( attrs[ "blocks" ] )
        body = attrs.get( "body", getattr( self.instance, "body", "" ) )
        if len( body.strip() ) < 40:
            raise serializers.ValidationError( { "body": "An article needs more than a few lines before it can be published." } )
        title = attrs.get( "title", getattr( self.instance, "title", "" ) )
        refuse_duplicate( Post.objects.filter( title__iexact = title ), "title", "An article with that title is already on the blog.", self.instance )
        return attrs


class MediaItemSerializer( CleanModelSerializer ):
    status_display = serializers.CharField( source = "get_status_display", read_only = True )
    kind_display = serializers.CharField( source = "get_kind_display", read_only = True )
    # Declared so DRF does not bolt the model's own uniqueness wording onto the field: that
    # message names a database column. The wording below is what an editor is meant to read,
    # and the unique index still stops a race.
    url = serializers.URLField( max_length = 500, validators = [] )

    class Meta:
        model = MediaItem
        fields = SHARED_FIELDS + [ "title", "kind", "kind_display", "url", "source", "poster_url" ]
        read_only_fields = [ "id", "published_at", "created_at", "updated_at" ]

    def validate_url( self, value ):
        if not value.startswith( "https://" ):
            raise serializers.ValidationError( "Use a full https link to the recording." )
        return value

    def validate( self, attrs ):
        url = attrs.get( "url", getattr( self.instance, "url", "" ) )
        refuse_duplicate(
            MediaItem.objects.filter( url = url ),
            "url",
            "That recording is already on the media page. Edit it instead of adding it again.",
            self.instance,
        )
        return attrs


class PressArticleSerializer( BundledPhotoValidator, CleanModelSerializer ):
    status_display = serializers.CharField( source = "get_status_display", read_only = True )
    url = serializers.URLField( max_length = 500, validators = [] )

    class Meta:
        model = PressArticle
        fields = SHARED_FIELDS + [ "title", "topic", "source", "url", "blurb", "photo", "photo_url", "photo_alt" ]
        read_only_fields = [ "id", "published_at", "created_at", "updated_at" ]

    def validate( self, attrs ):
        url = attrs.get( "url", getattr( self.instance, "url", "" ) )
        refuse_duplicate(
            PressArticle.objects.filter( url = url ),
            "url",
            "That article is already in the press list. Edit it instead of adding it again.",
            self.instance,
        )
        return attrs


class PublicationSerializer( CleanModelSerializer ):
    status_display = serializers.CharField( source = "get_status_display", read_only = True )
    kind_display = serializers.CharField( source = "get_kind_display", read_only = True )

    class Meta:
        model = Publication
        fields = SHARED_FIELDS + [ "title", "authors", "venue", "year", "link", "tag", "kind", "kind_display" ]
        read_only_fields = [ "id", "published_at", "created_at", "updated_at" ]

    def validate_year( self, value ):
        if not 1950 <= value <= 2100:
            raise serializers.ValidationError( "Check the publication year." )
        return value

    def validate( self, attrs ):
        title = attrs.get( "title", getattr( self.instance, "title", "" ) )
        year = attrs.get( "year", getattr( self.instance, "year", "" ) )
        refuse_duplicate(
            Publication.objects.filter( title__iexact = title, year = year ),
            "title",
            "That work is already listed for that year.",
            self.instance,
        )
        return attrs


class FaqSerializer( CleanModelSerializer ):
    status_display = serializers.CharField( source = "get_status_display", read_only = True )
    group_display = serializers.CharField( source = "get_group_display", read_only = True )

    class Meta:
        model = Faq
        fields = SHARED_FIELDS + [ "group", "group_display", "question", "answer" ]
        read_only_fields = [ "id", "published_at", "created_at", "updated_at" ]

    def validate( self, attrs ):
        question = attrs.get( "question", getattr( self.instance, "question", "" ) )
        group = attrs.get( "group", getattr( self.instance, "group", "" ) )
        refuse_duplicate(
            Faq.objects.filter( question__iexact = question, group = group ),
            "question",
            "That question is already answered on this page.",
            self.instance,
        )
        return attrs


class PageCopySerializer( serializers.ModelSerializer ):
    """The whole wording of one page, edited as a single blob."""

    class Meta:
        model = PageCopy
        fields = [ "id", "key", "label", "data", "published", "updated_at", "updated_by_email" ]
        read_only_fields = [ "id", "key", "updated_at" ]

    updated_by_email = serializers.CharField( source = "updated_by.email", read_only = True, default = "" )

    def validate_data( self, value ):
        if not isinstance( value, dict ):
            raise serializers.ValidationError( "Page copy has to be a set of named sections." )
        try:
            return clean_payload( value )
        except ValueError as error:
            raise serializers.ValidationError( str( error ) ) from error

    def validate_label( self, value ):
        label = strip_markup( value )
        if not label:
            raise serializers.ValidationError( "Give the page a name." )
        return label


class SiteImageSerializer( serializers.ModelSerializer ):
    """One uploaded picture. The file arrives as multipart, the rest is words about it."""

    url = serializers.SerializerMethodField()
    bytes = serializers.SerializerMethodField()

    class Meta:
        model = SiteImage
        fields = [ "id", "file", "url", "label", "alt", "bytes", "created_at" ]
        read_only_fields = [ "id", "url", "bytes", "created_at" ]

    def get_url( self, instance ):
        return instance.file.url if instance.file else ""

    def get_bytes( self, instance ):
        return instance.file.size if instance.file else 0

    def validate_file( self, value ):
        limit = settings.UPLOAD_MAX_BYTES
        if value.size > limit:
            raise serializers.ValidationError(
                f"That file is too big. Keep a picture under { max( 1, limit // ( 1024 * 1024 ) ) } MB so it still loads on a phone."
            )
        return value

    def validate_label( self, value ):
        return strip_markup( value )

    def validate_alt( self, value ):
        return strip_markup( value )
