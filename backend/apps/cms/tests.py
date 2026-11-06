import base64
import os
import shutil
import tempfile
from datetime import datetime, timedelta
from unittest import mock

from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, transaction
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User

from apps.audit.models import AuditEntry

from .blocks import MAX_ITEMS, MAX_LENGTH
from .models import PageCopy, PublishStatus, Faq, MediaItem, Post, PressArticle, Publication, SiteImage
from .serializers import PostSerializer


def token_for( user ):
    from rest_framework_simplejwt.tokens import RefreshToken

    return f"Bearer { RefreshToken.for_user( user ).access_token }"


PNG_PIXEL = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


class PostTestsBase( APITestCase ):
    """One admin and two posts, shared by every test that works with the blog."""

    @classmethod
    def setUpTestData( cls ):
        cls.admin = User.objects.create_user( email = "admin@example.com", password = "consultation-room-7", is_staff = True )
        cls.live = Post.objects.create(
            title = "What healthy ageing actually means",
            topic = "Ageing and everyday care",
            excerpt = "Keeping people able to do the things they value.",
            minutes = 6,
            body = "Healthy ageing means supporting people to do the things they value as they grow older, which changes what a clinic measures.",
            status = PublishStatus.PUBLISHED,
            order = 2,
        )
        cls.hidden = Post.objects.create(
            title = "Draft clinic notes",
            topic = "Work in progress",
            excerpt = "Not ready yet.",
            minutes = 3,
            body = "A short draft that the public site must not show until the doctor signs it off for publication.",
            status = PublishStatus.DRAFT,
            order = 1,
        )


class PostTests( PostTestsBase ):
    def test_anonymous_traffic_sees_only_published_posts( self ):
        response = self.client.get( reverse( "post-list" ) )
        self.assertEqual( response.status_code, status.HTTP_200_OK )
        self.assertEqual( [ row[ "slug" ] for row in response.data[ "results" ] ], [ self.live.slug ] )

    def test_staff_also_see_drafts( self ):
        response = self.client.get( reverse( "post-list" ), HTTP_AUTHORIZATION = token_for( self.admin ) )
        self.assertEqual( response.data[ "count" ], 2 )

    def test_staff_can_narrow_the_list_to_drafts( self ):
        response = self.client.get( reverse( "post-list" ), { "status": "draft" }, HTTP_AUTHORIZATION = token_for( self.admin ) )
        self.assertEqual( [ row[ "slug" ] for row in response.data[ "results" ] ], [ self.hidden.slug ] )

    def test_a_draft_is_invisible_by_slug_to_the_public( self ):
        self.assertEqual( self.client.get( f"/api/cms/posts/{ self.hidden.slug }/" ).status_code, status.HTTP_404_NOT_FOUND )
        self.assertEqual( self.client.get( f"/api/cms/posts/{ self.live.slug }/" ).status_code, status.HTTP_200_OK )

    def test_creating_a_post_builds_a_slug_from_the_title( self ):
        response = self.client.post(
            reverse( "post-list" ),
            {
                "title": "Falls in older people: what families can change",
                "topic": "Falls",
                "excerpt": "Small home changes that cut the risk.",
                "minutes": 4,
                "body": "Most falls happen at home, and most of the fixes are ordinary things: lighting, footwear, a grab rail and a review of sedating medicines.",
                "status": PublishStatus.PUBLISHED,
            },
            HTTP_AUTHORIZATION = token_for( self.admin ),
            format = "json",
        )
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )
        self.assertEqual( response.data[ "slug" ], "falls-in-older-people-what-families-can-change" )
        self.assertIsNotNone( response.data[ "published_at" ] )

    def test_the_second_copy_of_a_title_is_refused( self ):
        """A double click on Save must not put the same article on the blog twice."""

        for title in ( "What healthy ageing actually means", "WHAT HEALTHY AGEING ACTUALLY MEANS " ):
            response = self.client.post(
                reverse( "post-list" ),
                {
                    "title": title,
                    "topic": "Ageing and everyday care",
                    "excerpt": "Keeping people able to do the things they value.",
                    "minutes": 6,
                    "body": "The same words as the article already in the store, which is the mistake this test is about.",
                    "status": PublishStatus.DRAFT,
                },
                HTTP_AUTHORIZATION = token_for( self.admin ),
                format = "json",
            )
            self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST, response.data )
            self.assertIn( "title", response.data )
        self.assertEqual( Post.objects.count(), 2 )

    def test_two_different_titles_that_share_a_slug_both_get_in( self ):
        """The title is the identity, so two genuinely different articles are never merged, even
        when their slugs would land on the same address."""

        first = self.client.post(
            reverse( "post-list" ),
            { "title": "Care at home", "topic": "Care", "excerpt": "One.", "minutes": 3,
              "body": "An article about what changes in the house when a parent comes back from hospital.",
              "status": PublishStatus.DRAFT },
            HTTP_AUTHORIZATION = token_for( self.admin ), format = "json",
        )
        second = self.client.post(
            reverse( "post-list" ),
            { "title": "Care-at-home", "topic": "Care", "excerpt": "Two.", "minutes": 3,
              "body": "A different article whose title squashes down to the same address as the one above it.",
              "status": PublishStatus.DRAFT },
            HTTP_AUTHORIZATION = token_for( self.admin ), format = "json",
        )
        self.assertEqual( first.status_code, status.HTTP_201_CREATED, first.data )
        self.assertEqual( second.status_code, status.HTTP_201_CREATED, second.data )
        self.assertEqual( second.data[ "slug" ], "care-at-home-2" )
        self.assertEqual( Post.objects.count(), 4 )

    def test_the_public_cannot_write( self ):
        response = self.client.post( reverse( "post-list" ), { "title": "Spam" }, format = "json" )
        self.assertEqual( response.status_code, status.HTTP_401_UNAUTHORIZED )

    def test_a_thin_article_cannot_be_saved( self ):
        response = self.client.put(
            f"/api/cms/posts/{ self.live.slug }/",
            {
                "title": self.live.title,
                "topic": self.live.topic,
                "excerpt": self.live.excerpt,
                "minutes": self.live.minutes,
                "body": "Too short to publish.",
                "status": PublishStatus.PUBLISHED,
            },
            HTTP_AUTHORIZATION = token_for( self.admin ),
            format = "json",
        )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "body", response.data )

    def test_moving_a_post_back_to_draft_clears_the_published_stamp( self ):
        response = self.client.patch(
            f"/api/cms/posts/{ self.live.slug }/",
            { "status": PublishStatus.DRAFT },
            HTTP_AUTHORIZATION = token_for( self.admin ),
            format = "json",
        )
        self.assertEqual( response.status_code, status.HTTP_200_OK, response.data )
        self.assertIsNone( response.data[ "published_at" ] )

    def test_ordering_is_respected_for_public_traffic( self ):
        Post.objects.create(
            title = "Pinned first", topic = "Care", excerpt = "Top of the list", minutes = 2,
            body = "This article has a negative order on purpose so it should come out first in the public listing.",
            status = PublishStatus.PUBLISHED, order = -1,
        )
        response = self.client.get( reverse( "post-list" ), { "ordering": "order" } )
        self.assertEqual( [ row[ "title" ] for row in response.data[ "results" ] ], [ "Pinned first", self.live.title ] )


class PostPictureTests( PostTestsBase ):
    """The picture on an article card. An upload from a computer arrives as a path on this API's
    own disk, so a field that only accepts web addresses refuses every photo he adds."""

    def save_picture( self, value ):
        return self.client.post(
            reverse( "post-list" ),
            {
                "title": "The morning walk",
                "topic": "Ageing and everyday care",
                "excerpt": "Why a daily walk is the cheapest medicine there is.",
                "minutes": 3,
                "body": "A daily walk keeps legs, balance and mood working together, and it asks for no equipment at all.",
                "photo_url": value,
                "status": PublishStatus.DRAFT,
            },
            HTTP_AUTHORIZATION = token_for( self.admin ),
            format = "json",
        )

    def test_an_uploaded_picture_path_saves( self ):
        response = self.save_picture( "/media/site-images/2026/11/waiting-room.png" )
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )
        self.assertEqual( response.data[ "photo_url" ], "/media/site-images/2026/11/waiting-room.png" )

    def test_a_link_to_a_picture_elsewhere_saves_too( self ):
        response = self.save_picture( "https://example.com/clinic.jpg" )
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )
        self.assertEqual( response.data[ "photo_url" ], "https://example.com/clinic.jpg" )

    def test_a_picture_that_is_not_a_picture_is_refused_in_editors_words( self ):
        for value in ( "javascript:alert(1)", "ftp://example.com/clinic.jpg", "not a picture" ):
            response = self.save_picture( value )
            self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST, value )
            self.assertIn( "photo_url", response.data )
        self.assertEqual( Post.objects.count(), 2 )


class PostBlocksTests( PostTestsBase ):
    """An article is headings, paragraphs, lists and quotes, not one long text box."""

    BLOCKS = [
        { "type": "h2", "text": "Why falls happen at home" },
        { "type": "p", "text": "Most of the risk is built by ordinary rooms: loose rugs, low light and a night trip to the bathroom." },
        { "type": "ul", "items": [ "A rail by the stairs.", "A light in the hallway.", "Shoes with a grip." ] },
        { "type": "h3", "text": "What a clinic should ask" },
        { "type": "ol", "items": [ "How many times have you fallen?", "Which medicines make you dizzy?" ] },
        { "type": "quote", "text": "The fall is rarely the problem. The stillness after it is." },
    ]

    def article( self, blocks, extra = None ):
        return self.client.post(
            reverse( "post-list" ),
            {
                "title": "Falls, at home",
                "topic": "Falls",
                "excerpt": "Small changes in the house that cut the risk.",
                "minutes": 4,
                "blocks": blocks,
                "status": PublishStatus.DRAFT,
            } | ( extra or {} ),
            HTTP_AUTHORIZATION = token_for( self.admin ),
            format = "json",
        )

    def test_the_blocks_he_types_are_the_blocks_the_site_gets( self ):
        response = self.article( self.BLOCKS )
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )
        self.assertEqual( response.data[ "blocks" ], self.BLOCKS )

    def test_the_plain_words_are_kept_from_the_blocks( self ):
        """Search, the article length check and anything that only reads paragraphs need them."""

        response = self.article( self.BLOCKS )
        body = response.data[ "body" ]
        for phrase in ( "Why falls happen at home", "A rail by the stairs.", "Shoes with a grip.", "The stillness after it is." ):
            self.assertIn( phrase, body )
        self.assertEqual( Post.objects.get( slug = response.data[ "slug" ] ).body, body )

    def test_an_article_written_in_blocks_only_is_still_long_enough( self ):
        """One short paragraph is not an article, whether or not it arrived in the right shape."""

        response = self.article( [ { "type": "p", "text": "Too short." } ] )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "body", response.data )

    def test_a_block_the_site_cannot_lay_out_is_refused( self ):
        response = self.article( [ { "type": "h2", "text": "A heading" }, { "type": "table", "text": "No." } ] )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "does not know how to lay out", str( response.data[ "blocks" ] ) )

    def test_an_empty_block_names_the_block_to_fix( self ):
        response = self.article( [ { "type": "p", "text": "A paragraph long enough to read on its own line." }, { "type": "ul", "items": [] } ] )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "block 2", str( response.data[ "blocks" ] ) )

    def test_a_long_article_keeps_every_word( self ):
        """A long read is what the blog is for; a paragraph is not trimmed to fit a box on the way in."""

        words = ( "Frailty is measured by what a person can still do, not by the number on the scale. " * 120 ).strip()
        response = self.article( [ { "type": "h2", "text": "A long read" }, { "type": "p", "text": words } ] )
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )
        self.assertEqual( response.data[ "blocks" ][ 1 ][ "text" ], words )
        self.assertIn( words, Post.objects.get( slug = response.data[ "slug" ] ).body )

    def test_a_block_past_the_limit_is_refused_rather_than_cut( self ):
        """His words either reach the site whole or stop the save; they never arrive half written."""

        over = "a" * ( MAX_LENGTH[ "p" ] + 500 )
        response = self.article( [ { "type": "p", "text": "A paragraph long enough to read on its own line." }, { "type": "p", "text": over } ] )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "block 2", str( response.data[ "blocks" ] ) )
        self.assertIn( str( MAX_LENGTH[ "p" ] ), str( response.data[ "blocks" ] ) )
        self.assertEqual( Post.objects.count(), 2, "a refused article stores nothing" )

    def test_a_list_past_the_line_limit_is_refused( self ):
        response = self.article(
            [ { "type": "p", "text": "A paragraph long enough to read on its own line." },
              { "type": "ul", "items": [ f"Line { n } of the checklist." for n in range( MAX_ITEMS + 1 ) ] } ]
        )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "lines", str( response.data[ "blocks" ] ) )

    def test_markup_typed_into_a_block_is_not_stored( self ):
        response = self.article(
            [ { "type": "h2", "text": "Lighting <script>alert(1)</script> and footwear" },
              { "type": "p", "text": "A paragraph long enough to satisfy the article length check on its own." } ]
        )
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )
        self.assertNotIn( "<", response.data[ "blocks" ][ 0 ][ "text" ] )

    def test_the_site_payload_carries_the_blocks( self ):
        self.article( self.BLOCKS, { "status": PublishStatus.PUBLISHED } )
        post = self.client.get( reverse( "site-content" ) ).data[ "posts" ][ 0 ]
        self.assertEqual( [ block[ "type" ] for block in post[ "blocks" ] ], [ "h2", "p", "ul", "h3", "ol", "quote" ] )
        self.assertEqual( len( post[ "body" ] ), 6, "the same article in one paragraph per block" )

    def test_the_article_feed_carries_the_blocks( self ):
        created = self.article( self.BLOCKS, { "status": PublishStatus.PUBLISHED } )
        detail = self.client.get( f"/api/cms/posts/{ created.data[ 'slug' ] }/" )
        self.assertEqual( detail.data[ "blocks" ], self.BLOCKS )

    def test_an_older_article_with_only_a_body_still_reads( self ):
        """Nothing rewrites the posts already on the blog; they simply have no blocks yet."""

        self.assertEqual( self.client.get( f"/api/cms/posts/{ self.live.slug }/" ).data[ "blocks" ], [] )


class OtherContentTests( APITestCase ):
    @classmethod
    def setUpTestData( cls ):
        cls.admin = User.objects.create_user( email = "admin@example.com", password = "consultation-room-7", is_staff = True )
        cls.header = token_for( cls.admin )

    def create( self, url_name, data ):
        return self.client.post( reverse( url_name ), data, HTTP_AUTHORIZATION = self.header, format = "json" )

    def test_a_video_can_be_added_and_shows_its_kind( self ):
        response = self.create(
            "media-item-list",
            { "title": "Health Station with Binisha Thapa", "kind": "tv_interview", "url": "https://www.youtube.com/watch?v=rSY9I1-c5Ig", "source": "Himalaya TV", "status": PublishStatus.PUBLISHED },
        )
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )
        self.assertEqual( response.data[ "kind_display" ], "TV interview" )

    def test_a_plain_word_is_not_accepted_as_a_video_link( self ):
        response = self.create(
            "media-item-list",
            { "title": "Broken link", "kind": "talk", "url": "youtube watching later", "status": PublishStatus.DRAFT },
        )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "url", response.data )

    def test_a_press_feature_can_be_published( self ):
        response = self.create(
            "press-article-list",
            {
                "title": "डिमेन्सिया रोक्न सकिन्छ?",
                "topic": "Feature article",
                "source": "Swasthya Khabarpatrika",
                "url": "https://swasthyakhabar.com/story/63850",
                "blurb": "A Nepali-language article on what lowers dementia risk.",
                "status": PublishStatus.PUBLISHED,
            },
        )
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )

    def test_publication_rows_need_a_sane_year( self ):
        response = self.create(
            "publication-list",
            { "title": "Frailty in community care", "authors": "Kandel R, Sharma P", "venue": "Nepalese Journal of Health Sciences", "year": 1900, "status": PublishStatus.PUBLISHED },
        )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "year", response.data )

    def test_publications_filter_by_year_and_tag( self ):
        Publication.objects.create( title = "Geriatric problems in Nepal", authors = "Kandel R", venue = "Health Journal", year = 2018, tag = "geriatrics", status = PublishStatus.PUBLISHED )
        Publication.objects.create( title = "Dementia awareness survey", authors = "Kandel R", venue = "Aging Memory", year = 2024, tag = "dementia", status = PublishStatus.PUBLISHED )
        by_year = self.client.get( reverse( "publication-list" ), { "year": "2024" } )
        self.assertEqual( [ row[ "title" ] for row in by_year.data[ "results" ] ], [ "Dementia awareness survey" ] )
        by_tag = self.client.get( reverse( "publication-list" ), { "tag": "geriatrics" } )
        self.assertEqual( by_tag.data[ "count" ], 1 )

    def test_a_publication_carries_the_type_the_panel_chose( self ):
        Publication.objects.create(
            title = "Unusual presentation of tuberculosis in an elderly male", authors = "Kandel R",
            venue = "Clinical Case Reports", year = 2015, kind = Publication.Kind.CASE, status = PublishStatus.PUBLISHED,
        )
        Publication.objects.create(
            title = "Grip strength in older people", authors = "Kandel R",
            venue = "Health Journal", year = 2014, status = PublishStatus.PUBLISHED,
        )
        by_kind = self.client.get( reverse( "publication-list" ), { "kind": "case" } )
        self.assertEqual( [ row[ "title" ] for row in by_kind.data[ "results" ] ], [ "Unusual presentation of tuberculosis in an elderly male" ] )
        self.assertEqual( by_kind.data[ "results" ][ 0 ][ "kind_display" ], "Case report" )
        whole = self.client.get( reverse( "publication-list" ) )
        self.assertEqual(
            [ row[ "kind" ] for row in whole.data[ "results" ] if row[ "title" ].startswith( "Grip" ) ], [ "research" ],
            "a row saved without a type is still a paper, not something the site has to guess at",
        )

    def test_faq_items_round_trip( self ):
        response = self.create(
            "faq-list",
            { "question": "Where is the clinic?", "answer": "Rapti Academy of Health Sciences, Dang.", "status": PublishStatus.PUBLISHED, "order": 3 },
        )
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )
        self.assertEqual( response.data[ "order" ], 3 )

    def test_staff_can_delete_content( self ):
        item = MediaItem.objects.create( title = "Old clip", url = "https://youtu.be/abcdefghijk", status = PublishStatus.DRAFT )
        response = self.client.delete( reverse( "media-item-detail", args = [ item.pk ] ), HTTP_AUTHORIZATION = self.header )
        self.assertEqual( response.status_code, status.HTTP_204_NO_CONTENT )
        self.assertFalse( MediaItem.objects.filter( pk = item.pk ).exists() )


class SiteContentTests( APITestCase ):
    @classmethod
    def setUpTestData( cls ):
        cls.published = Post.objects.create(
            title = "Published piece", topic = "Notes", excerpt = "Live copy", minutes = 4,
            body = "First paragraph here.\n\nSecond paragraph after a blank line.\n\nThird one last.",
            photo = "checkup",
            status = PublishStatus.PUBLISHED,
            published_at = timezone.make_aware( datetime( 2026, 10, 28, 12 ), timezone.get_current_timezone() ),
        )
        cls.draft = Post.objects.create(
            title = "Unfinished piece", topic = "Notes", excerpt = "Hidden", minutes = 4,
            body = "Nothing worth publishing yet, but the body has to clear the minimum length check.",
            status = PublishStatus.DRAFT,
        )
        Faq.objects.create( group = "teaching", question = "How much notice?", answer = "Four to six weeks.", status = PublishStatus.PUBLISHED )
        MediaItem.objects.create( title = "A talk", kind = MediaItem.Kind.TALK, url = "https://youtu.be/abcdefghijk", source = "Nepal TV", status = PublishStatus.PUBLISHED )

    def test_the_bundle_shape_holds_only_published_rows( self ):
        response = self.client.get( reverse( "site-content" ) )
        self.assertEqual( response.status_code, status.HTTP_200_OK )
        self.assertEqual( [ row[ "slug" ] for row in response.data[ "posts" ] ], [ self.published.slug ] )
        self.assertEqual( len( response.data[ "faqs" ] ), 1 )
        self.assertEqual( response.data[ "videos" ][ 0 ][ "kind" ], "Talk" )

    def test_the_body_arrives_as_paragraphs_and_the_date_reads_like_the_site( self ):
        response = self.client.get( reverse( "site-content" ) )
        post = response.data[ "posts" ][ 0 ]
        self.assertEqual( post[ "body" ], [ "First paragraph here.", "Second paragraph after a blank line.", "Third one last." ] )
        self.assertEqual( post[ "date" ], "October 28, 2026" )
        self.assertEqual( post[ "photo" ], "checkup" )

    def test_a_photo_name_the_site_does_not_ship_is_rejected( self ):
        admin = User.objects.create_user( email = "admin@example.com", password = "consultation-room-7", is_staff = True )
        response = self.client.patch(
            reverse( "post-detail", args = [ self.published.slug ] ),
            { "photo": "holiday-snapshot" },
            content_type = "application/json",
            HTTP_AUTHORIZATION = token_for( admin ),
        )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "bundled with the site", response.data[ "photo" ][ 0 ] )


class PublishingHelperTests( APITestCase ):
    def test_publishing_sets_the_stamp_once_and_republishing_keeps_it( self ):
        first = timezone.now() - timedelta( days = 4 )
        post = Post.objects.create(
            title = "Keeps its date", topic = "Notes", excerpt = "Stable date", minutes = 3,
            body = "This article tests that republishing does not move the original publication date forward.",
            status = PublishStatus.PUBLISHED, published_at = first,
        )
        post.order = 5
        post.save()
        post.refresh_from_db()
        self.assertEqual( post.published_at.replace( microsecond = 0 ), first.replace( microsecond = 0 ) )
        self.assertEqual( post.order, 5 )


class PageCopyTests( APITestCase ):
    @classmethod
    def setUpTestData( cls ):
        cls.admin = User.objects.create_user( email = "admin@example.com", password = "consultation-room-7", is_staff = True )
        cls.header = token_for( cls.admin )
        cls.home = PageCopy.objects.create(
            key = "home", label = "Home page",
            data = {
                "hero": { "kicker": "Geriatric medicine", "title": "Caring for ageing parents" },
                "buttons": [ { "label": "Book a visit", "href": "/contact" } ],
            },
        )
        cls.hidden = PageCopy.objects.create( key = "draftpage", label = "Held back page", data = { "title": "Not live yet" }, published = False )

    def test_the_public_only_ever_reads_published_pages( self ):
        response = self.client.get( reverse( "page-copy-list" ) )
        self.assertEqual( [ row[ "key" ] for row in response.data[ "results" ] ], [ "home" ] )
        staff = self.client.get( reverse( "page-copy-list" ), HTTP_AUTHORIZATION = self.header )
        self.assertEqual( [ row[ "key" ] for row in staff.data[ "results" ] ], [ "draftpage", "home" ] )

    def test_the_site_content_endpoint_carries_the_copy_blob( self ):
        response = self.client.get( reverse( "site-content" ) )
        self.assertEqual( response.data[ "copy" ][ "home" ][ "hero" ][ "title" ], "Caring for ageing parents" )
        self.assertNotIn( "draftpage", response.data[ "copy" ] )

    def test_an_editors_change_is_stored_and_audited( self ):
        response = self.client.patch(
            reverse( "page-copy-detail", args = [ self.home.key ] ),
            { "data": { "hero": { "kicker": "Geriatric medicine", "title": "Care that keeps parents capable" } } },
            HTTP_AUTHORIZATION = self.header,
            format = "json",
        )
        self.assertEqual( response.status_code, status.HTTP_200_OK, response.data )
        self.home.refresh_from_db()
        self.assertEqual( self.home.data[ "hero" ][ "title" ], "Care that keeps parents capable" )
        self.assertNotIn( "buttons", self.home.data )
        self.assertEqual( self.home.updated_by, self.admin )
        entry = AuditEntry.objects.get( action = "copy.updated" )
        self.assertEqual( entry.target_type, "cms.PageCopy" )
        self.assertEqual( entry.detail[ "hero.title" ][ "from" ], "Caring for ageing parents" )
        self.assertEqual( entry.detail[ "hero.title" ][ "to" ], "Care that keeps parents capable" )
        self.assertNotIn( "hero.kicker", entry.detail )
        self.assertNotIn( "hero", entry.detail )

    def test_a_page_cannot_be_deleted_through_the_api( self ):
        response = self.client.delete( reverse( "page-copy-detail", args = [ self.home.key ] ), HTTP_AUTHORIZATION = self.header )
        self.assertEqual( response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED )
        self.assertTrue( PageCopy.objects.filter( key = "home" ).exists() )

    def test_the_public_cannot_write_copy( self ):
        response = self.client.patch( reverse( "page-copy-detail", args = [ self.home.key ] ), { "label": "Hijacked" }, format = "json" )
        self.assertEqual( response.status_code, status.HTTP_401_UNAUTHORIZED )

    def test_copy_has_to_be_named_sections( self ):
        response = self.client.patch(
            reverse( "page-copy-detail", args = [ self.home.key ] ),
            { "data": [ "just", "a", "list" ] },
            HTTP_AUTHORIZATION = self.header,
            format = "json",
        )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "data", response.data )


class SanitisingTests( APITestCase ):
    @classmethod
    def setUpTestData( cls ):
        cls.admin = User.objects.create_user( email = "admin@example.com", password = "consultation-room-7", is_staff = True )
        cls.header = token_for( cls.admin )

    def article( self ):
        return {
            "title": "Falls at home",
            "topic": "Falls",
            "excerpt": "What families can change.",
            "minutes": 4,
            "body": "Most falls happen at home and most fixes are ordinary: lighting, footwear, a grab rail.",
            "status": PublishStatus.DRAFT,
        }

    def test_markup_typed_into_an_article_is_stripped_before_it_is_saved( self ):
        payload = self.article()
        payload[ "title" ] = "Falls <script>alert(1)</script> at home"
        payload[ "body" ] = "Most falls happen at home and <img src=x onerror=alert(1)> most fixes are ordinary things."
        response = self.client.post( reverse( "post-list" ), payload, HTTP_AUTHORIZATION = self.header, format = "json" )
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )
        self.assertEqual( response.data[ "title" ], "Falls alert(1) at home" )
        self.assertNotIn( "<", response.data[ "body" ] )

    def test_markup_in_page_copy_is_stripped( self ):
        page = PageCopy.objects.create( key = "about", label = "About page", data = { "title": "Plain" } )
        response = self.client.patch(
            reverse( "page-copy-detail", args = [ page.key ] ),
            { "data": { "title": "<b onclick=steal()>Bold claim</b>", "note": "A line with  tab" } },
            HTTP_AUTHORIZATION = self.header,
            format = "json",
        )
        self.assertEqual( response.status_code, status.HTTP_200_OK, response.data )
        self.assertEqual( response.data[ "data" ][ "title" ], "Bold claim" )

    def test_a_script_link_in_page_copy_is_refused( self ):
        page = PageCopy.objects.create( key = "contact", label = "Contact page", data = { "title": "Plain" } )
        response = self.client.patch(
            reverse( "page-copy-detail", args = [ page.key ] ),
            { "data": { "buttons": [ { "label": "Write", "href": "javascript:alert(1)" } ] } },
            HTTP_AUTHORIZATION = self.header,
            format = "json",
        )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "https", str( response.data ) )

    def test_an_mailto_and_relative_link_survive_the_filter( self ):
        page = PageCopy.objects.create( key = "teaching", label = "Teaching page", data = { "title": "Plain" } )
        response = self.client.patch(
            reverse( "page-copy-detail", args = [ page.key ] ),
            { "data": { "email": "mailto:desk@example.com", "more": "/media", "clip": "https://youtu.be/abcdefghijk" } },
            HTTP_AUTHORIZATION = self.header,
            format = "json",
        )
        self.assertEqual( response.status_code, status.HTTP_200_OK, response.data )
        self.assertEqual( response.data[ "data" ][ "email" ], "mailto:desk@example.com" )
        self.assertEqual( response.data[ "data" ][ "more" ], "/media" )


class SeedPageCopyTests( APITestCase ):
    """The bundle the site ships is what the panel starts from, so seeding must be safe to re-run."""

    @classmethod
    def setUpTestData( cls ):
        cls.bundle = {
            "global": { "label": "Global wording", "brand": { "name": "Dr. Ramesh Kandel." } },
            "about": { "label": "About page", "hero": { "title": "Dr. Ramesh Kandel." } },
        }

    def write_bundle( self, **extra ):
        import json
        import tempfile
        from pathlib import Path

        payload = dict( self.bundle )
        payload.update( extra )
        handle = tempfile.NamedTemporaryFile( "w", suffix = ".json", delete = False, encoding = "utf-8" )
        json.dump( payload, handle )
        handle.close()
        return Path( handle.name )

    def test_seeding_creates_a_row_per_page_and_can_be_re_run( self ):
        from django.core.management import call_command

        path = self.write_bundle()
        call_command( "seed_page_copy", file = str( path ) )
        self.assertEqual( list( PageCopy.objects.values_list( "key", flat = True ) ), [ "about", "global" ] )
        self.assertEqual( PageCopy.objects.get( key = "about" ).label, "About page" )
        self.assertTrue( PageCopy.objects.get( key = "global" ).published )

        call_command( "seed_page_copy", file = str( path ) )
        self.assertEqual( PageCopy.objects.count(), 2 )

    def test_seeded_copy_reaches_the_site_endpoint( self ):
        from django.core.management import call_command

        call_command( "seed_page_copy", file = str( self.write_bundle() ) )
        response = self.client.get( reverse( "site-content" ) )
        self.assertEqual( response.data[ "copy" ][ "about" ][ "hero" ][ "title" ], "Dr. Ramesh Kandel." )

    def test_draft_seeding_holds_the_words_back( self ):
        from django.core.management import call_command

        call_command( "seed_page_copy", file = str( self.write_bundle() ), draft = True )
        self.assertFalse( PageCopy.objects.get( key = "about" ).published )
        response = self.client.get( reverse( "site-content" ) )
        self.assertNotIn( "about", response.data[ "copy" ] )

    def test_prune_clears_pages_that_are_no_longer_in_the_bundle( self ):
        from django.core.management import call_command

        PageCopy.objects.create( key = "oldpage", label = "Old page" )
        call_command( "seed_page_copy", file = str( self.write_bundle() ), prune = True )
        self.assertEqual( list( PageCopy.objects.values_list( "key", flat = True ) ), [ "about", "global" ] )

    def test_only_seeds_the_pages_named_and_leaves_his_own_words_alone( self ):
        from django.core.management import call_command

        PageCopy.objects.create( key = "about", label = "About page", data = { "hero": { "title": "Words he typed himself" } } )
        call_command( "seed_page_copy", file = str( self.write_bundle() ), only = [ "global" ] )
        self.assertEqual( PageCopy.objects.get( key = "about" ).data[ "hero" ][ "title" ], "Words he typed himself" )
        self.assertTrue( PageCopy.objects.filter( key = "global" ).exists() )

    def test_only_and_prune_together_are_refused( self ):
        from django.core.management import call_command
        from django.core.management.base import CommandError

        with self.assertRaises( CommandError ):
            call_command( "seed_page_copy", file = str( self.write_bundle() ), only = [ "global" ], prune = True )

    def test_a_key_that_is_not_in_the_bundle_is_refused( self ):
        from django.core.management import call_command
        from django.core.management.base import CommandError

        with self.assertRaises( CommandError ):
            call_command( "seed_page_copy", file = str( self.write_bundle() ), only = [ "nonesuch" ] )
        self.assertEqual( PageCopy.objects.count(), 0 )

    def test_a_bundle_that_is_not_an_object_of_objects_is_refused( self ):
        from django.core.management import call_command
        from django.core.management.base import CommandError

        path = self.write_bundle( broken = "just a string" )
        with self.assertRaises( CommandError ):
            call_command( "seed_page_copy", file = str( path ) )
        self.assertFalse( PageCopy.objects.filter( key = "broken" ).exists() )

    def test_the_command_finds_the_bundle_the_site_ships_without_being_told_where_it_is( self ):
        """Render runs this with no --file, and the path went stale once when backend moved inside the
        repository. A boot that cannot find the bundle is a panel with no wording, so pin it here."""
        from pathlib import Path

        from django.conf import settings
        from django.core.management import call_command

        from .management.commands.seed_page_copy import BUNDLE

        self.assertEqual( BUNDLE, Path( settings.BASE_DIR ).parent / "src" / "pages" / "site" / "copy.json" )
        self.assertTrue( BUNDLE.is_file(), f"The site's copy bundle is not where the command looks: { BUNDLE }" )

        call_command( "seed_page_copy" )
        self.assertTrue( PageCopy.objects.filter( key = "home" ).exists() )


class FeedTests( APITestCase ):
    @classmethod
    def setUpTestData( cls ):
        cls.admin = User.objects.create_user( email = "admin@example.com", password = "consultation-room-7", is_staff = True )
        cls.header = token_for( cls.admin )
        base = timezone.now() - timedelta( days = 1 )
        cls.posts = [
            Post.objects.create(
                title = f"Article number { n }", topic = "Notes", excerpt = "A line for the card.", minutes = 3,
                body = "Body long enough to clear the minimum length that an article needs before it can be published.",
                status = PublishStatus.PUBLISHED, published_at = base - timedelta( days = n ),
            )
            for n in range( 1, 8 )
        ]
        cls.draft = Post.objects.create(
            title = "Held back article", topic = "Notes", excerpt = "Not live.", minutes = 3,
            body = "A draft article that the public feed must never hand out to anonymous traffic.",
            status = PublishStatus.DRAFT, published_at = None,
        )
        for n in range( 1, 5 ):
            MediaItem.objects.create( title = f"Clip { n }", kind = MediaItem.Kind.TALK, url = f"https://youtu.be/clip{n}", status = PublishStatus.PUBLISHED, order = n )

    def walk( self, url, pages = 3 ):
        seen, next_url = [], url
        for _ in range( pages ):
            response = self.client.get( next_url )
            self.assertEqual( response.status_code, status.HTTP_200_OK )
            seen.extend( row[ "title" ] for row in response.data[ "results" ] )
            next_url = response.data[ "next" ]
            if not next_url:
                break
        return seen, next_url

    def test_the_blog_feed_walks_the_list_with_a_cursor( self ):
        titles, nxt = self.walk( "/api/cms/feed/posts/?page_size=3", 4 )
        self.assertEqual( titles, [ post.title for post in self.posts ] )
        self.assertIsNone( nxt )
        first = self.client.get( "/api/cms/feed/posts/?page_size=3" )
        self.assertIn( "cursor=", first.data[ "next" ] )

    def test_the_cursor_never_repeats_or_skips_a_row( self ):
        first = self.client.get( "/api/cms/feed/posts/?page_size=4" )
        second = self.client.get( first.data[ "next" ] )
        self.assertEqual( len( first.data[ "results" ] ), 4 )
        self.assertEqual( [ row[ "title" ] for row in second.data[ "results" ] ][ 0 ], "Article number 5" )
        self.assertEqual( len( second.data[ "results" ] ), 3 )

    def test_a_draft_never_reaches_the_public_feed( self ):
        titles, _ = self.walk( "/api/cms/feed/posts/?page_size=30", 1 )
        self.assertNotIn( self.draft.title, titles )
        staff = self.client.get( "/api/cms/feed/posts/?page_size=30", HTTP_AUTHORIZATION = self.header )
        self.assertEqual( len( staff.data[ "results" ] ), 8 )

    def test_the_draft_article_detail_is_invisible_but_the_live_one_reads_like_the_site( self ):
        self.assertEqual( self.client.get( f"/api/cms/feed/posts/{ self.draft.slug }/" ).status_code, 404 )
        response = self.client.get( f"/api/cms/feed/posts/{ self.posts[ 0 ].slug }/" )
        self.assertEqual( response.data[ "title" ], "Article number 1" )
        self.assertEqual( response.data[ "body" ], [ "Body long enough to clear the minimum length that an article needs before it can be published." ] )
        self.assertRegex( response.data[ "date" ], r"^[A-Z][a-z]+ \d{1,2}, \d{4}$" )

    def test_the_media_feed_pages_too( self ):
        response = self.client.get( "/api/cms/feed/media/?page_size=2" )
        self.assertEqual( [ row[ "title" ] for row in response.data[ "results" ] ], [ "Clip 1", "Clip 2" ] )
        self.assertIn( "cursor=", response.data[ "next" ] )
        rest = self.client.get( response.data[ "next" ] )
        self.assertEqual( [ row[ "title" ] for row in rest.data[ "results" ] ], [ "Clip 3", "Clip 4" ] )
        self.assertIsNone( rest.data[ "next" ] )

    def test_an_edit_is_written_into_the_audit_history( self ):
        self.client.patch(
            reverse( "post-detail", args = [ self.posts[ 0 ].slug ] ),
            { "excerpt": "A truer line for the card." },
            HTTP_AUTHORIZATION = self.header,
            format = "json",
        )
        entry = AuditEntry.objects.get( action = "cms.updated" )
        self.assertEqual( entry.target_type, "cms.Post" )
        self.assertEqual( entry.detail[ "excerpt" ][ "from" ], "A line for the card." )
        self.assertEqual( entry.actor, self.admin )

    def test_creating_and_deleting_are_audited( self ):
        created = self.client.post(
            reverse( "faq-list" ),
            { "question": "Do you see people by video?", "answer": "Yes, most families do.", "status": PublishStatus.PUBLISHED },
            HTTP_AUTHORIZATION = self.header,
            format = "json",
        )
        self.assertEqual( created.status_code, status.HTTP_201_CREATED, created.data )
        self.client.delete( reverse( "faq-detail", args = [ created.data[ "id" ] ] ), HTTP_AUTHORIZATION = self.header )
        self.assertEqual( list( AuditEntry.objects.order_by( "id" ).values_list( "action", flat = True ) ), [ "cms.created", "cms.deleted" ] )
        self.assertEqual( AuditEntry.objects.get( action = "cms.deleted" ).target_label, "Do you see people by video?" )


def a_post( **over ):
    data = {
        "title": "How to keep a fall from starting a decline",
        "topic": "Falls",
        "excerpt": "What a family can change in the week after a fall.",
        "minutes": 4,
        "photo": "checkup",
        "body": "Most decline after a fall is not the fall itself. It is the stillness that follows, and the fixes are ordinary: lighting, footwear, a rail by the stairs and standing up again early.",
    }
    data.update( over )
    return data


def a_clip( **over ):
    data = {
        "title": "Caring for a parent who is forgetting",
        "kind": MediaItem.Kind.TV,
        "url": "https://www.youtube.com/watch?v=rSY9I1-c5Ig",
        "source": "Himalaya TV",
    }
    data.update( over )
    return data


def a_feature( **over ):
    data = {
        "title": "What a geriatric clinic actually changes",
        "topic": "Feature article",
        "source": "Ekantipur",
        "url": "https://ekantipur.com/health/what-ageing-needs",
        "blurb": "A report on the first clinics built for older people in the western hills.",
        "photo": "press",
    }
    data.update( over )
    return data


def a_publication( **over ):
    data = {
        "title": "Frailty in community care",
        "authors": "Kandel R, Sharma P",
        "venue": "Nepalese Journal of Health Sciences",
        "year": 2021,
        "link": "https://doi.org/10.3126/njhs.v12i1.45210",
        "tag": "geriatrics",
    }
    data.update( over )
    return data


def a_question( **over ):
    data = {
        "group": Faq.Group.HOME,
        "question": "Where is the clinic?",
        "answer": "Rapti Academy of Health Sciences, Gharhinghor, Dang.",
    }
    data.update( over )
    return data


# One description per editable table: where its rows are created, what names a row in the
# panel, the wording a second row takes so the two can be told apart, and a word only the
# second row carries for the search check.
RESOURCES = [
    {
        "name": "blog post", "model": Post, "list": "post-list", "detail": "post-detail",
        "lookup": "slug", "field": "title", "payload": a_post, "search": "capable",
        "renamed": "Noticing a fall before it starts a decline",
        "over": { "title": "What families can change at home", "excerpt": "Small fixes that keep people capable.", "minutes": 7, "photo": "portrait" },
    },
    {
        "name": "media item", "model": MediaItem, "list": "media-item-list", "detail": "media-item-detail",
        "lookup": "id", "field": "title", "payload": a_clip, "search": "national",
        "renamed": "A short interview on memory loss",
        "over": { "title": "Ageing well on a national panel", "kind": MediaItem.Kind.TALK, "url": "https://www.youtube.com/watch?v=Zxy987QweRt", "source": "Image Channel" },
    },
    {
        "name": "press article", "model": PressArticle, "list": "press-article-list", "detail": "press-article-detail",
        "lookup": "id", "field": "title", "payload": a_feature, "search": "tribune",
        "renamed": "Notes from a village clinic",
        "over": { "title": "Caring for ageing parents in Nepal", "url": "https://dhakatribune.com/life/ageing-parents", "source": "Dhaka Tribune" },
    },
    {
        "name": "publication", "model": Publication, "list": "publication-list", "detail": "publication-detail",
        "lookup": "id", "field": "title", "payload": a_publication, "search": "Matters",
        "renamed": "Frailty in community care, reviewed",
        "over": { "title": "Frailty in community care: a review", "venue": "Journal of Aging Matters", "tag": "frailty" },
    },
    {
        "name": "FAQ item", "model": Faq, "list": "faq-list", "detail": "faq-detail",
        "lookup": "id", "field": "question", "payload": a_question, "search": "video",
        "renamed": "Where exactly is the clinic?",
        "over": { "question": "Can we speak by video?", "answer": "Yes, when travel is the hard part of the plan.", "group": Faq.Group.TEACHING },
    },
]


POST_ROW, CLIP_ROW, FEATURE_ROW, PAPER_ROW, QUESTION_ROW = RESOURCES


class CrudMatrixTests( APITestCase ):
    """Every editable table is walked through the same path, so a resource that behaves
    differently from its siblings fails here instead of surprising the doctor in the panel."""

    @classmethod
    def setUpTestData( cls ):
        cls.admin = User.objects.create_user( email = "admin@example.com", password = "consultation-room-7", is_staff = True )
        cls.header = token_for( cls.admin )
        cls.editor = User.objects.create_user( email = "editor@example.com", password = "consultation-room-7" )
        cls.editor_header = token_for( cls.editor )

    def create_row( self, resource, data = None, header = None ):
        response = self.client.post(
            reverse( resource[ "list" ] ),
            resource[ "payload" ]() if data is None else data,
            HTTP_AUTHORIZATION = self.header if header is None else header,
            format = "json",
        )
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )
        return response.data

    def detail_url( self, resource, row ):
        return reverse( resource[ "detail" ], args = [ row[ resource[ "lookup" ] ] ] )

    def test_a_row_can_be_created_read_edited_replaced_published_and_deleted( self ):
        for resource in RESOURCES:
            with self.subTest( table = resource[ "name" ] ):
                model, field = resource[ "model" ], resource[ "field" ]
                row = self.create_row( resource )
                url = self.detail_url( resource, row )
                self.assertEqual( row[ "status" ], PublishStatus.DRAFT )
                self.assertIsNone( row[ "published_at" ], "a new row is held back until someone publishes it" )

                self.assertEqual( self.client.get( url ).status_code, status.HTTP_404_NOT_FOUND, "a draft is not handed to visitors" )
                staff_read = self.client.get( url, HTTP_AUTHORIZATION = self.header )
                self.assertEqual( staff_read.data[ field ], resource[ "payload" ]()[ field ] )

                patched = self.client.patch( url, { field: resource[ "renamed" ], "order": 7 }, HTTP_AUTHORIZATION = self.header, format = "json" )
                self.assertEqual( patched.status_code, status.HTTP_200_OK, patched.data )
                stored = model.objects.get( pk = row[ "id" ] )
                self.assertEqual( getattr( stored, field ), resource[ "renamed" ] )
                self.assertEqual( stored.order, 7 )

                replaced = self.client.put( url, { **resource[ "payload" ](), **resource[ "over" ] }, HTTP_AUTHORIZATION = self.header, format = "json" )
                self.assertEqual( replaced.status_code, status.HTTP_200_OK, replaced.data )
                stored.refresh_from_db()
                self.assertEqual( getattr( stored, field ), resource[ "over" ][ field ] )
                self.assertEqual( stored.order, 7, "a whole-row save must not reset a column it was not given" )
                self.assertEqual( stored.status, PublishStatus.DRAFT )

                published = self.client.patch( url, { "status": PublishStatus.PUBLISHED }, HTTP_AUTHORIZATION = self.header, format = "json" )
                self.assertEqual( published.status_code, status.HTTP_200_OK, published.data )
                self.assertIsNotNone( published.data[ "published_at" ] )
                self.assertEqual( self.client.get( url ).data[ field ], resource[ "over" ][ field ] )

                held_back = self.client.patch( url, { "status": PublishStatus.DRAFT }, HTTP_AUTHORIZATION = self.header, format = "json" )
                self.assertIsNone( held_back.data[ "published_at" ], "unpublishing clears the stamp so republishing dates it afresh" )
                self.assertEqual( self.client.get( url ).status_code, status.HTTP_404_NOT_FOUND )

                deleted = self.client.delete( url, HTTP_AUTHORIZATION = self.header )
                self.assertEqual( deleted.status_code, status.HTTP_204_NO_CONTENT )
                self.assertFalse( model.objects.filter( pk = row[ "id" ] ).exists() )
                self.assertEqual( self.client.get( url ).status_code, status.HTTP_404_NOT_FOUND )

                trail = list(
                    AuditEntry.objects.filter( target_type = f"cms.{ model.__name__ }", target_id = str( row[ "id" ] ) )
                    .order_by( "id" ).values_list( "action", flat = True )
                )
                self.assertEqual( trail[ 0 ], "cms.created" )
                self.assertEqual( trail[ -1 ], "cms.deleted" )
                self.assertEqual( len( trail ), 6 )
                self.assertEqual( set( trail[ 1: -1 ] ), { "cms.updated" } )
                self.assertEqual( AuditEntry.objects.filter( target_type = f"cms.{ model.__name__ }", action = "cms.updated" ).count(), 4 )

    def test_a_new_row_carries_the_words_the_form_asked_for( self ):
        for resource in RESOURCES:
            with self.subTest( table = resource[ "name" ] ):
                row = self.create_row( resource )
                for key, value in resource[ "payload" ]().items():
                    self.assertEqual( row[ key ], value )
                self.assertEqual( resource[ "model" ].objects.get( pk = row[ "id" ] ).status, PublishStatus.DRAFT )

    def test_visitors_and_signed_in_staff_may_not_write_any_table( self ):
        for resource in RESOURCES:
            with self.subTest( table = resource[ "name" ] ):
                row = self.create_row( resource )
                url = self.detail_url( resource, row )
                for method, target in [ ( "post", reverse( resource[ "list" ] ) ), ( "patch", url ), ( "put", url ), ( "delete", url ) ]:
                    anonymous = getattr( self.client, method )( target, resource[ "payload" ](), format = "json" )
                    self.assertEqual( anonymous.status_code, status.HTTP_401_UNAUTHORIZED, f"{ method } on { resource[ 'name' ] }" )
                    outsider = getattr( self.client, method )(
                        target, resource[ "payload" ](), HTTP_AUTHORIZATION = self.editor_header, format = "json"
                    )
                    self.assertEqual( outsider.status_code, status.HTTP_403_FORBIDDEN, f"{ method } on { resource[ 'name' ] }" )

                self.assertEqual( self.client.get( reverse( resource[ "list" ] ) ).data[ "count" ], 0, "a visitor sees no drafts" )
                staff_list = self.client.get( reverse( resource[ "list" ] ), HTTP_AUTHORIZATION = self.header )
                self.assertEqual( staff_list.data[ "count" ], 1 )
                stored = resource[ "model" ].objects.get( pk = row[ "id" ] )
                self.assertEqual( stored.order, 0, "a refused write leaves the row exactly as it was" )

    def test_fields_the_panel_should_not_control_are_ignored( self ):
        for resource in RESOURCES:
            with self.subTest( table = resource[ "name" ] ):
                forged = {
                    **resource[ "payload" ](),
                    "id": 4242,
                    "status_display": "Published",
                    "published_at": ( timezone.now() - timedelta( days = 30 ) ).isoformat(),
                    "created_at": "1999-01-01T00:00:00Z",
                    "updated_at": "1999-01-01T00:00:00Z",
                }
                if resource[ "lookup" ] == "slug":
                    forged[ "slug" ] = "someone-elses-address"
                row = self.create_row( resource, forged )

                self.assertNotEqual( row[ "id" ], 4242 )
                self.assertIsNone( row[ "published_at" ] )
                self.assertEqual( row[ "status_display" ], "Draft" )
                if "slug" in row:
                    self.assertEqual( row[ "slug" ], slugify( forged[ "title" ] ) )

                changed = self.client.patch(
                    self.detail_url( resource, row ),
                    { "slug": "hijacked", "published_at": "2030-01-01T00:00:00Z", "id": 7 },
                    HTTP_AUTHORIZATION = self.header, format = "json",
                )
                self.assertEqual( changed.status_code, status.HTTP_200_OK, changed.data )
                stored = resource[ "model" ].objects.get( pk = row[ "id" ] )
                self.assertEqual( stored.id, row[ "id" ] )
                self.assertIsNone( stored.published_at )
                if resource[ "lookup" ] == "slug":
                    self.assertEqual( stored.slug, slugify( forged[ "title" ] ) )

    def test_the_panel_list_searches_and_orders_on_the_columns_it_advertises( self ):
        for resource in RESOURCES:
            with self.subTest( table = resource[ "name" ] ):
                base = self.create_row( resource, { **resource[ "payload" ](), "order": 11 } )
                other = self.create_row( resource, { **resource[ "payload" ](), **resource[ "over" ], "order": 22 } )
                listed = reverse( resource[ "list" ] )

                found = self.client.get( listed, { "search": resource[ "search" ] }, HTTP_AUTHORIZATION = self.header )
                self.assertEqual( found.data[ "count" ], 1, found.data )
                self.assertEqual( found.data[ "results" ][ 0 ][ "id" ], other[ "id" ] )

                last_first = self.client.get( listed, { "ordering": "-order" }, HTTP_AUTHORIZATION = self.header )
                self.assertEqual( [ row[ "id" ] for row in last_first.data[ "results" ] ], [ other[ "id" ], base[ "id" ] ] )
                first_last = self.client.get( listed, { "ordering": "order" }, HTTP_AUTHORIZATION = self.header )
                self.assertEqual( [ row[ "id" ] for row in first_last.data[ "results" ] ], [ base[ "id" ], other[ "id" ] ] )

                drafts_only = self.client.get( listed, { "status": "draft" }, HTTP_AUTHORIZATION = self.header )
                self.assertEqual( drafts_only.data[ "count" ], 2 )
                published_only = self.client.get( listed, { "status": "published" }, HTTP_AUTHORIZATION = self.header )
                self.assertEqual( published_only.data[ "count" ], 0 )

    def test_the_list_pages_do_not_lose_a_row_or_hand_out_the_same_twice( self ):
        for number in range( 1, 6 ):
            self.create_row( QUESTION_ROW, a_question( question = f"Which number is the desk on, { number }?" ) )
        first = self.client.get( reverse( "faq-list" ), { "page_size": 2 }, HTTP_AUTHORIZATION = self.header )
        self.assertEqual( len( first.data[ "results" ] ), 2 )
        second = self.client.get( first.data[ "next" ], HTTP_AUTHORIZATION = self.header )
        third = self.client.get( second.data[ "next" ], HTTP_AUTHORIZATION = self.header )
        seen = [ row[ "id" ] for row in first.data[ "results" ] + second.data[ "results" ] + third.data[ "results" ] ]
        self.assertEqual( len( seen ), 5 )
        self.assertEqual( len( seen ), len( set( seen ) ) )
        self.assertIsNone( third.data[ "next" ] )

    def test_each_editors_filter_narrows_the_list_it_belongs_to( self ):
        Faq.objects.create( group = Faq.Group.TEACHING, question = "How much notice do you need?", answer = "Four to six weeks for a session." )
        self.create_row( QUESTION_ROW )
        teaching = self.client.get( reverse( "faq-list" ), { "group": "teaching" }, HTTP_AUTHORIZATION = self.header )
        self.assertEqual( [ row[ "question" ] for row in teaching.data[ "results" ] ], [ "How much notice do you need?" ] )

        Publication.objects.create( title = "Geriatric problems in Nepal", authors = "Kandel R", venue = "Health Journal", year = 2018, tag = "geriatrics" )
        self.create_row( PAPER_ROW, a_publication( tag = "dementia" ) )
        by_year = self.client.get( reverse( "publication-list" ), { "year": "2018" }, HTTP_AUTHORIZATION = self.header )
        self.assertEqual( by_year.data[ "count" ], 1 )
        by_tag = self.client.get( reverse( "publication-list" ), { "tag": "geriatrics" }, HTTP_AUTHORIZATION = self.header )
        self.assertEqual( [ row[ "title" ] for row in by_tag.data[ "results" ] ], [ "Geriatric problems in Nepal" ] )

    def test_page_copy_is_edited_in_place_and_can_never_be_created_or_deleted( self ):
        page = PageCopy.objects.create(
            key = "contact", label = "Contact page",
            data = { "title": "Book a visit", "note": "Bring a list of the medicines being taken." },
        )
        url = reverse( "page-copy-detail", args = [ page.key ] )
        replaced = self.client.put(
            url, { "label": "Contact page", "data": { "title": "Talk to the clinic" }, "published": True },
            HTTP_AUTHORIZATION = self.header, format = "json",
        )
        self.assertEqual( replaced.status_code, status.HTTP_200_OK, replaced.data )
        page.refresh_from_db()
        self.assertEqual( page.data, { "title": "Talk to the clinic" }, "a whole-page save drops the sections it was not given" )

        added = self.client.post( reverse( "page-copy-list" ), { "key": "newpage", "label": "A new page", "data": {} }, HTTP_AUTHORIZATION = self.header, format = "json" )
        self.assertEqual( added.status_code, status.HTTP_405_METHOD_NOT_ALLOWED )
        removed = self.client.delete( url, HTTP_AUTHORIZATION = self.header )
        self.assertEqual( removed.status_code, status.HTTP_405_METHOD_NOT_ALLOWED )
        self.assertTrue( PageCopy.objects.filter( key = "contact" ).exists() )
        self.assertFalse( PageCopy.objects.filter( key = "newpage" ).exists() )

    def test_the_site_bundle_only_ever_carries_published_rows( self ):
        for resource in RESOURCES:
            self.create_row( resource )
        for key in [ "posts", "videos", "press", "publications", "faqs" ]:
            self.assertEqual( self.client.get( reverse( "site-content" ) ).data[ key ], [], f"{ key } is still a draft" )
            self.assertEqual(
                self.client.get( reverse( "site-content" ), HTTP_AUTHORIZATION = self.header ).data[ key ], [],
                "the bundle is what a visitor gets, so it holds no drafts for a staff browser either",
            )

        for resource in RESOURCES:
            listing = self.client.get( reverse( resource[ "list" ] ), HTTP_AUTHORIZATION = self.header )
            self.assertEqual( listing.data[ "count" ], 1, "the panel still reads its own drafts" )

        for resource in RESOURCES:
            for row in resource[ "model" ].objects.all():
                self.client.patch(
                    reverse( resource[ "detail" ], args = [ getattr( row, resource[ "lookup" ] ) ] ),
                    { "status": PublishStatus.PUBLISHED },
                    HTTP_AUTHORIZATION = self.header, format = "json",
                )
        after = self.client.get( reverse( "site-content" ) )
        self.assertEqual( [ len( after.data[ key ] ) for key in [ "posts", "videos", "press", "publications", "faqs" ] ], [ 1, 1, 1, 1, 1 ] )
        self.assertEqual( after.data[ "videos" ][ 0 ][ "kind" ], "TV interview" )
        self.assertEqual( after.data[ "publications" ][ 0 ][ "kind" ], "research" )
        self.assertEqual( after.data[ "faqs" ][ 0 ][ "q" ], a_question()[ "question" ] )
        self.assertEqual( after.data[ "posts" ][ 0 ][ "body" ], [ a_post()[ "body" ] ] )


class DuplicateContentTests( APITestCase ):
    """The panel has one save button and it gets double-clicked. Nothing the doctor can
    submit twice may put a second copy of the same thing on the site."""

    @classmethod
    def setUpTestData( cls ):
        cls.admin = User.objects.create_user( email = "admin@example.com", password = "consultation-room-7", is_staff = True )
        cls.header = token_for( cls.admin )

    def create( self, url_name, data ):
        return self.client.post( reverse( url_name ), data, HTTP_AUTHORIZATION = self.header, format = "json" )

    def test_the_second_copy_of_a_title_never_reaches_the_blog( self ):
        first = self.create( "post-list", a_post() )
        self.assertEqual( first.status_code, status.HTTP_201_CREATED, first.data )
        for title in [ a_post()[ "title" ], a_post()[ "title" ].upper(), f"  { a_post()['title'] }  " ]:
            again = self.create( "post-list", a_post( title = title ) )
            self.assertEqual( again.status_code, status.HTTP_400_BAD_REQUEST, again.data )
            self.assertIn( "title", again.data )
            self.assertIn( "An article with that title is already on the blog.", str( again.data[ "title" ] ) )
        self.assertEqual( Post.objects.count(), 1 )

    def test_every_refusal_is_written_for_the_editor_and_not_the_database( self ):
        """Django answers a unique violation with 'media item with this url already exists',
        which names a model and a column. An editor should only ever read which box to fix."""

        for url_name, payload in [ ( "post-list", a_post() ), ( "media-item-list", a_clip() ),
                                  ( "press-article-list", a_feature() ), ( "publication-list", a_publication() ),
                                  ( "faq-list", a_question() ) ]:
            self.assertEqual( self.create( url_name, payload ).status_code, status.HTTP_201_CREATED, payload )

        refusals = [
            ( "post-list", a_post( excerpt = "A different summary under the same headline" ), "title",
              "An article with that title is already on the blog." ),
            ( "media-item-list", a_clip( title = "A wholly different headline" ), "url",
              "That recording is already on the media page. Edit it instead of adding it again." ),
            ( "press-article-list", a_feature( title = "A wholly different headline" ), "url",
              "That article is already in the press list. Edit it instead of adding it again." ),
            ( "publication-list", a_publication( venue = "A different journal" ), "title",
              "That work is already listed for that year." ),
            ( "faq-list", a_question( answer = "The clinic sits in Baneshwor, Kathmandu." ), "question",
              "That question is already answered on this page." ),
        ]
        for url_name, payload, field, message in refusals:
            again = self.create( url_name, payload )
            self.assertEqual( again.status_code, status.HTTP_400_BAD_REQUEST, again.data )
            self.assertIn( message, str( again.data[ field ] ) )
            self.assertNotIn( "with this", str( again.data ), "the internal unique message leaked to the panel" )

    def test_a_different_title_that_shares_an_address_still_gets_its_own_page( self ):
        self.assertEqual( self.create( "post-list", a_post( title = "Care at home" ) ).status_code, status.HTTP_201_CREATED )
        second = self.create( "post-list", a_post( title = "Care-at-home", body = "Two articles whose titles turn into the same web address." ) )
        self.assertEqual( second.status_code, status.HTTP_201_CREATED, second.data )
        self.assertNotEqual( second.data[ "slug" ], "care-at-home" )
        self.assertEqual( Post.objects.count(), 2 )

    def test_the_same_recording_cannot_be_added_or_moved_onto_an_existing_link( self ):
        first = self.create( "media-item-list", a_clip() )
        second = self.create( "media-item-list", a_clip( title = "A second clip", url = "https://www.youtube.com/watch?v=Secon45678a" ) )
        self.assertEqual( first.status_code, status.HTTP_201_CREATED, first.data )
        self.assertEqual( second.status_code, status.HTTP_201_CREATED, second.data )

        added_again = self.create( "media-item-list", a_clip( title = "Renamed copy" ) )
        self.assertEqual( added_again.status_code, status.HTTP_400_BAD_REQUEST, added_again.data )
        self.assertIn( "url", added_again.data )
        self.assertIn(
            "That recording is already on the media page. Edit it instead of adding it again.",
            str( added_again.data[ "url" ] ),
        )

        moved = self.client.patch(
            reverse( "media-item-detail", args = [ second.data[ "id" ] ] ),
            { "url": a_clip()[ "url" ] }, HTTP_AUTHORIZATION = self.header, format = "json",
        )
        self.assertEqual( moved.status_code, status.HTTP_400_BAD_REQUEST, moved.data )
        self.assertIn( "url", moved.data )
        self.assertEqual( MediaItem.objects.get( pk = second.data[ "id" ] ).url, "https://www.youtube.com/watch?v=Secon45678a" )
        self.assertEqual( MediaItem.objects.count(), 2 )

    def test_editing_a_row_onto_its_own_words_is_allowed( self ):
        row = self.create( "media-item-list", a_clip() )
        same_link = self.client.patch(
            reverse( "media-item-detail", args = [ row.data[ "id" ] ] ),
            { "url": a_clip()[ "url" ], "title": "Caring for a parent who is forgetting, part two" },
            HTTP_AUTHORIZATION = self.header, format = "json",
        )
        self.assertEqual( same_link.status_code, status.HTTP_200_OK, same_link.data )
        self.assertEqual( MediaItem.objects.count(), 1 )

    def test_a_press_feature_is_listed_once_per_link( self ):
        self.assertEqual( self.create( "press-article-list", a_feature() ).status_code, status.HTTP_201_CREATED )
        again = self.create( "press-article-list", a_feature( title = "The same story, retitled" ) )
        self.assertEqual( again.status_code, status.HTTP_400_BAD_REQUEST, again.data )
        self.assertIn( "url", again.data )
        self.assertEqual( PressArticle.objects.count(), 1 )

    def test_a_publication_appears_once_in_each_year_it_was_listed( self ):
        self.assertEqual( self.create( "publication-list", a_publication() ).status_code, status.HTTP_201_CREATED )
        for title in [ a_publication()[ "title" ], a_publication()[ "title" ].upper() ]:
            again = self.create( "publication-list", a_publication( title = title ) )
            self.assertEqual( again.status_code, status.HTTP_400_BAD_REQUEST, again.data )
            self.assertIn( "title", again.data )
        later = self.create( "publication-list", a_publication( year = 2023 ) )
        self.assertEqual( later.status_code, status.HTTP_201_CREATED, later.data )
        self.assertEqual( Publication.objects.count(), 2 )

    def test_a_question_is_answered_once_per_page( self ):
        self.assertEqual( self.create( "faq-list", a_question() ).status_code, status.HTTP_201_CREATED )
        for question in [ a_question()[ "question" ], a_question()[ "question" ].upper(), f" { a_question()['question'] } " ]:
            again = self.create( "faq-list", a_question( question = question ) )
            self.assertEqual( again.status_code, status.HTTP_400_BAD_REQUEST, again.data )
            self.assertIn( "question", again.data )
        on_another_page = self.create( "faq-list", a_question( group = Faq.Group.TEACHING ) )
        self.assertEqual( on_another_page.status_code, status.HTTP_201_CREATED, on_another_page.data )
        self.assertEqual( Faq.objects.count(), 2 )

    def test_deleting_a_row_frees_its_place_for_the_next_one( self ):
        row = self.create( "media-item-list", a_clip() )
        self.client.delete( reverse( "media-item-detail", args = [ row.data[ "id" ] ] ), HTTP_AUTHORIZATION = self.header )
        self.assertEqual( MediaItem.objects.count(), 0 )
        again = self.create( "media-item-list", a_clip() )
        self.assertEqual( again.status_code, status.HTTP_201_CREATED, again.data )
        self.assertEqual( MediaItem.objects.count(), 1 )

    def test_the_database_stops_a_duplicate_even_when_the_api_is_bypassed( self ):
        Post.objects.create( title = "Caring for ageing parents", topic = "Notes", excerpt = "Plain.", minutes = 3, body = "Body copy long enough to satisfy the article length check." )
        MediaItem.objects.create( title = "A talk", url = "https://youtu.be/abcdefghijk" )
        Publication.objects.create( title = "Frailty in community care", authors = "Kandel R", venue = "Health Journal", year = 2021 )
        Faq.objects.create( question = "Where is the clinic?", answer = "Dang.", group = "home" )

        with self.assertRaises( IntegrityError ):
            with transaction.atomic():
                MediaItem.objects.create( title = "The same talk again", url = "https://youtu.be/abcdefghijk" )
        with self.assertRaises( IntegrityError ):
            with transaction.atomic():
                Publication.objects.create( title = "FRAILTY IN COMMUNITY CARE", authors = "Kandel R", venue = "Health Journal", year = 2021 )
        with self.assertRaises( IntegrityError ):
            with transaction.atomic():
                Faq.objects.create( question = "WHERE IS THE CLINIC?", answer = "Dang.", group = "home" )
        with self.assertRaises( IntegrityError ):
            with transaction.atomic():
                Post.objects.create(
                    title = "CARING FOR AGEING PARENTS", slug = "a-quite-different-address",
                    topic = "Notes", excerpt = "Plain.", minutes = 3, body = "Body copy long enough to satisfy the article length check.",
                )
        self.assertEqual( [ Post.objects.count(), MediaItem.objects.count(), Publication.objects.count(), Faq.objects.count() ], [ 1, 1, 1, 1 ] )

    def test_two_tabs_that_save_at_once_are_answered_with_a_refusal_not_a_crash( self ):
        """The form checks before the database, but a second tab can win the race. The
        refusal still has to arrive as a message the panel can show."""

        with mock.patch.object( PostSerializer, "save", side_effect = IntegrityError( "duplicate key value" ) ):
            response = self.client.post( reverse( "post-list" ), a_post(), HTTP_AUTHORIZATION = self.header, format = "json" )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST, response.data )
        self.assertIn(
            "That entry is already in the site. Edit the one that is there instead of adding a second copy.",
            str( response.data ),
        )
        self.assertEqual( Post.objects.count(), 0 )
        self.assertEqual( AuditEntry.objects.filter( action = "cms.created" ).count(), 0 )

    def test_a_duplicate_is_refused_before_the_audit_history_sees_it( self ):
        self.create( "faq-list", a_question() )
        self.create( "faq-list", a_question() )
        self.assertEqual( Faq.objects.count(), 1 )
        self.assertEqual( list( AuditEntry.objects.values_list( "action", flat = True ) ), [ "cms.created" ] )


BUNDLE = {
    "posts": [ {
        "slug": "keeping-people-able", "title": "Keeping people able", "topic": "Ageing",
        "excerpt": "A line for the card.", "minutes": 4, "photo": "checkup", "date": "October 28, 2026",
        "body": [ "First paragraph of the article.", "A second paragraph that carries it along." ],
    } ],
    "videos": [ { "title": "An interview on ageing", "kind": "TV interview", "url": "https://www.youtube.com/watch?v=Imp0rt12345a", "source": "Himalaya TV" } ],
    "press": [ { "title": "What ageing needs", "topic": "Feature article", "source": "Ekantipur", "url": "https://ekantipur.com/health/ageing", "blurb": "A feature on clinics.", "photo": "press" } ],
    "publications": [ { "title": "Frailty in community care", "authors": "Kandel R", "venue": "Nepalese Journal of Health Sciences", "year": 2021, "link": "https://doi.org/10.3126/1", "tag": "geriatrics" } ],
    "faqs": [ { "question": "Where is the clinic?", "group": "home", "answer": "Rapti Academy of Health Sciences, Dang." } ],
}


class ImportSiteContentTests( APITestCase ):
    """The importer is how the doctor's existing words get in. Re-running it is the normal
    thing to do, so it must never leave a second copy behind."""

    @classmethod
    def setUpTestData( cls ):
        cls.admin = User.objects.create_user( email = "admin@example.com", password = "consultation-room-7", is_staff = True )
        cls.header = token_for( cls.admin )

    def write_bundle( self, **over ):
        import json
        import tempfile
        from pathlib import Path

        payload = { key: [ dict( row ) for row in rows ] for key, rows in BUNDLE.items() }
        payload.update( over )
        handle = tempfile.NamedTemporaryFile( "w", suffix = ".json", delete = False, encoding = "utf-8" )
        json.dump( payload, handle )
        handle.close()
        return Path( handle.name )

    def import_( self, path, **options ):
        from django.core.management import call_command

        call_command( "import_site_content", file = str( path ), **options )

    def counts( self ):
        return [ Post.objects.count(), MediaItem.objects.count(), PressArticle.objects.count(), Publication.objects.count(), Faq.objects.count() ]

    def ids( self ):
        return [ list( model.objects.order_by( "id" ).values_list( "id", flat = True ) ) for model in [ Post, MediaItem, PressArticle, Publication, Faq ] ]

    def test_the_bundle_lands_in_the_tables_the_site_reads( self ):
        self.import_( self.write_bundle() )
        self.assertEqual( self.counts(), [ 1, 1, 1, 1, 1 ] )
        post = Post.objects.get()
        self.assertEqual( post.slug, "keeping-people-able" )
        self.assertEqual( post.body, "First paragraph of the article.\n\nA second paragraph that carries it along." )
        self.assertEqual( ( post.published_at.year, post.published_at.month, post.published_at.day ), ( 2026, 10, 28 ) )
        self.assertEqual( post.status, PublishStatus.PUBLISHED )
        self.assertEqual( MediaItem.objects.get().kind, MediaItem.Kind.TV )
        self.assertEqual( self.client.get( reverse( "site-content" ) ).data[ "posts" ][ 0 ][ "slug" ], "keeping-people-able" )

    def test_a_list_heading_in_the_bundle_becomes_the_right_type( self ):
        path = self.write_bundle( publications = [
            { "title": "Nepal's Geriatric Health Strategy", "authors": "Kandel R", "venue": "Journal of the Indian Academy of Geriatrics",
              "year": 2024, "link": "https://doi.org/10.1007/1", "tag": "Reviews and book chapters" },
            { "title": "Unusual presentation of tuberculosis", "authors": "Kandel R", "venue": "Clinical Case Reports",
              "year": 2015, "link": "https://doi.org/10.1002/ccr3.144", "tag": "Case reports" },
            { "title": "Grip strength as an alternative to densitometry", "authors": "Kandel R", "venue": "BMC Geriatrics",
              "year": 2014, "link": "https://doi.org/10.1186/1", "tag": "Something the site has never seen" },
        ] )
        self.import_( path )
        self.assertEqual(
            list( Publication.objects.order_by( "year" ).values_list( "kind", flat = True ) ),
            [ Publication.Kind.RESEARCH, Publication.Kind.CASE, Publication.Kind.REVIEW ],
            "a theme that is not one of the four headings stays a paper rather than disappearing from the list",
        )

    def test_importing_the_same_bundle_twice_changes_nothing( self ):
        self.import_( self.write_bundle() )
        before = self.ids()
        self.import_( self.write_bundle() )
        self.assertEqual( self.counts(), [ 1, 1, 1, 1, 1 ] )
        self.assertEqual( self.ids(), before, "rows are updated in place, never re-created" )

    def test_a_clip_renamed_in_the_bundle_edits_the_row_that_already_has_the_link( self ):
        self.import_( self.write_bundle() )
        moved = self.write_bundle( videos = [ { "title": "An interview renamed later", "kind": "TV interview", "url": "https://www.youtube.com/watch?v=Imp0rt12345a", "source": "Channel 9" } ] )
        self.import_( moved )
        self.assertEqual( MediaItem.objects.count(), 1 )
        self.assertEqual( MediaItem.objects.get().title, "An interview renamed later" )
        self.assertEqual( MediaItem.objects.get().source, "Channel 9" )

    def test_two_bundle_rows_that_share_one_link_become_one_row( self ):
        doubled = self.write_bundle( videos = [
            { "title": "First listing", "kind": "TV interview", "url": "https://www.youtube.com/watch?v=Imp0rt12345a", "source": "Himalaya TV" },
            { "title": "Second listing", "kind": "Talk", "url": "https://www.youtube.com/watch?v=Imp0rt12345a", "source": "Himalaya TV" },
        ] )
        self.import_( doubled )
        self.assertEqual( MediaItem.objects.count(), 1 )
        self.assertEqual( MediaItem.objects.get().title, "Second listing" )

    def test_a_draft_import_holds_the_words_back_until_the_doctor_publishes( self ):
        self.import_( self.write_bundle(), draft = True )
        self.assertEqual( self.counts(), [ 1, 1, 1, 1, 1 ] )
        self.assertEqual( Post.objects.get().status, PublishStatus.DRAFT )
        self.assertIsNone( Post.objects.get().published_at )
        self.assertEqual( self.client.get( reverse( "site-content" ) ).data[ "posts" ], [] )

    def test_a_bundle_that_would_create_a_duplicate_row_is_refused_and_changes_nothing( self ):
        from django.core.management.base import CommandError

        Post.objects.create( title = "Already on the blog", topic = "Notes", excerpt = "Held.", minutes = 3, body = "A body long enough to satisfy the length check for an article." )
        clashing = self.write_bundle( posts = [ {
            "slug": "a-new-address", "title": "Already on the blog", "topic": "Notes", "excerpt": "A line for the card.",
            "minutes": 4, "photo": "checkup", "date": "October 28, 2026", "body": [ "One paragraph.", "Another paragraph here." ],
        } ] )
        with self.assertRaises( CommandError ):
            self.import_( clashing )
        self.assertEqual( Post.objects.count(), 1, "the whole import rolls back, not only the row that clashed" )
        self.assertFalse( Post.objects.filter( slug = "a-new-address" ).exists() )

    def test_a_file_that_is_not_there_is_named_rather_than_guessing( self ):
        from django.conf import settings
        from django.core.management.base import CommandError

        with self.assertRaises( CommandError ):
            self.import_( settings.BASE_DIR / "db" / "no-such-bundle.json" )


class SiteImageTests( APITestCase ):
    """The pictures the panel uploads for a hero or a section."""

    @classmethod
    def setUpTestData( cls ):
        cls.admin = User.objects.create_user( email = "admin@example.com", password = "consultation-room-7", is_staff = True )
        cls.visitor = User.objects.create_user( email = "visitor@example.com", password = "some-passphrase-9" )
        cls.header = token_for( cls.admin )

    def setUp( self ):
        self.media_root = tempfile.mkdtemp()
        self.stored = override_settings( MEDIA_ROOT = self.media_root )
        self.stored.enable()

    def tearDown( self ):
        self.stored.disable()
        shutil.rmtree( self.media_root, ignore_errors = True )

    def picture( self, name = "waiting-room.png", body = PNG_PIXEL ):
        return SimpleUploadedFile( name, body, content_type = "image/png" )

    def test_a_staff_upload_lands_where_the_site_can_reach_it( self ):
        response = self.client.post(
            "/api/cms/images/",
            { "file": self.picture(), "label": "Waiting room", "alt": "Two chairs and a plant." },
            HTTP_AUTHORIZATION = self.header,
        )
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )
        self.assertTrue( response.data[ "url" ].startswith( "/media/site-images/" ), response.data[ "url" ] )
        row = SiteImage.objects.get()
        self.assertEqual( row.uploaded_by, self.admin )
        self.assertTrue( os.path.isfile( os.path.join( self.media_root, row.file.name ) ), "the file is on disk, not only in the database" )

    def test_anyone_may_read_the_list_but_only_staff_may_add_to_it( self ):
        SiteImage.objects.create( file = self.picture( "clinic.png" ), label = "Clinic", alt = "The clinic reception." )
        self.assertEqual( self.client.get( "/api/cms/images/" ).data[ "count" ], 1 )
        self.assertEqual( self.client.get( "/api/cms/images/", HTTP_AUTHORIZATION = token_for( self.visitor ) ).data[ "count" ], 1 )
        self.assertEqual(
            self.client.post( "/api/cms/images/", { "file": self.picture() }, HTTP_AUTHORIZATION = token_for( self.visitor ) ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual( self.client.post( "/api/cms/images/", { "file": self.picture() } ).status_code, status.HTTP_401_UNAUTHORIZED )

    def test_a_file_that_is_not_a_picture_is_refused( self ):
        response = self.client.post(
            "/api/cms/images/", { "file": self.picture( "notes.txt", b"not a picture at all" ) }, HTTP_AUTHORIZATION = self.header
        )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "file", response.data )
        self.assertEqual( SiteImage.objects.count(), 0 )

    def test_a_picture_bigger_than_the_limit_is_named_rather_than_saved( self ):
        with override_settings( UPLOAD_MAX_BYTES = 500 ):
            response = self.client.post( "/api/cms/images/", { "file": self.picture( "big.png", b"0" * 4000 ) }, HTTP_AUTHORIZATION = self.header )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "too big", str( response.data[ "file" ] ) )
        self.assertEqual( SiteImage.objects.count(), 0 )

    def test_changing_a_picture_means_uploading_another_one( self ):
        created = self.client.post( "/api/cms/images/", { "file": self.picture() }, HTTP_AUTHORIZATION = self.header )
        detail = f"/api/cms/images/{ created.data[ 'id' ] }/"
        self.assertEqual(
            self.client.put( detail, { "label": "A different name" }, format = "json", HTTP_AUTHORIZATION = self.header ).status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )
        self.assertEqual( self.client.delete( detail, HTTP_AUTHORIZATION = self.header ).status_code, status.HTTP_204_NO_CONTENT )
        self.assertEqual( SiteImage.objects.count(), 0 )


class UploadedPictureTests( APITestCase ):
    """A deployed API is the only thing that can answer a /media/ address, so the pictures the panel
    uploads depend on that route existing. Django tests run with DEBUG off, which is that branch."""

    def setUp( self ):
        self.media_root = tempfile.mkdtemp()
        self.stored = override_settings( MEDIA_ROOT = self.media_root )
        self.stored.enable()
        self.clerk = User.objects.create_user( email = "clerk@example.com", password = "consultation-room-7", is_staff = True )

    def tearDown( self ):
        self.stored.disable()
        shutil.rmtree( self.media_root, ignore_errors = True )

    def upload( self, name = "clinic.png" ):
        return self.client.post(
            "/api/cms/images/", { "file": SimpleUploadedFile( name, PNG_PIXEL, content_type = "image/png" ) },
            HTTP_AUTHORIZATION = token_for( self.clerk ),
        )

    def test_a_picture_uploaded_from_the_panel_is_readable_at_its_own_address( self ):
        url = self.upload().data[ "url" ]
        fetched = self.client.get( url )
        self.assertEqual( fetched.status_code, status.HTTP_200_OK )
        self.assertEqual( fetched[ "Content-Type" ], "image/png" )
        self.assertEqual( b"".join( fetched.streaming_content ), PNG_PIXEL )
        self.assertIn( "immutable", fetched[ "Cache-Control" ] )

    def test_an_address_that_climbs_out_of_the_uploads_folder_is_refused( self ):
        self.upload()
        for attempt in ( "/media/../settings.py", "/media/%2e%2e%2fmanage.py", "/media/site-images/", "/media/site-images/nothing.png" ):
            self.assertEqual( self.client.get( attempt ).status_code, status.HTTP_404_NOT_FOUND, attempt )


class EnsureFirstContentTests( APITestCase ):
    """A fresh production database arrives with tables and no rows, so the panel shows nothing while
    the site still renders from what it ships. The boot step fills that hole and then must never
    touch a database that has content in it, because that content is the doctor's own editing."""

    ROW_MODELS = [ Post, MediaItem, PressArticle, Publication, Faq ]

    def run_boot_seed( self ):
        from django.core.management import call_command

        call_command( "ensure_first_content" )

    def rows_are_untouched( self ):
        return [ list( model.objects.order_by( "id" ).values_list( "id", flat = True ) ) for model in self.ROW_MODELS ]

    def test_the_files_it_loads_are_the_ones_that_ship_in_this_repository( self ):
        """Render clones the repository and runs the boot seed with no arguments, so both sources have
        to be exactly where the two commands look for them."""
        from pathlib import Path

        from django.conf import settings

        from .management.commands.seed_page_copy import BUNDLE

        self.assertTrue( BUNDLE.is_file(), f"The copy bundle is not where the command looks: { BUNDLE }" )
        self.assertTrue( ( Path( settings.BASE_DIR ) / "db" / "site-content.json" ).is_file() )

    def test_an_empty_database_comes_up_with_the_whole_site( self ):
        self.run_boot_seed()

        self.assertTrue( PageCopy.objects.filter( key = "home" ).exists() )
        self.assertTrue( PageCopy.objects.filter( key = "global" ).exists() )
        for model in self.ROW_MODELS:
            self.assertTrue( model.objects.exists(), f"{ model.__name__ } stayed empty." )
        self.assertEqual( list( PageCopy.objects.filter( published = False ).values_list( "key", flat = True ) ), [] )

        response = self.client.get( reverse( "site-content" ) )
        self.assertIn( "home", response.data[ "copy" ] )
        self.assertTrue( response.data[ "posts" ] )

    def test_a_second_boot_leaves_his_own_words_alone( self ):
        self.run_boot_seed()
        home = PageCopy.objects.get( key = "home" )
        home.data[ "hero" ][ "title" ] = "Words he typed in the panel"
        home.save()
        before = self.rows_are_untouched()

        self.run_boot_seed()

        self.assertEqual( PageCopy.objects.get( key = "home" ).data[ "hero" ][ "title" ], "Words he typed in the panel" )
        self.assertEqual( self.rows_are_untouched(), before )

    def test_a_database_with_rows_but_no_wording_only_gets_the_wording( self ):
        from django.core.management import call_command

        call_command( "import_site_content" )
        before = self.rows_are_untouched()

        self.run_boot_seed()

        self.assertTrue( PageCopy.objects.filter( key = "home" ).exists() )
        self.assertEqual( self.rows_are_untouched(), before )
