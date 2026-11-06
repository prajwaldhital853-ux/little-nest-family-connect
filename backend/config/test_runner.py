"""The test runner the suite uses, so one thing can be said about a test process that is not true
of the deployed one."""

from django.conf import settings
from django.test.runner import DiscoverRunner


class EmailInlineRunner( DiscoverRunner ):
    """Wait for the mail instead of letting it leave on a thread.

    A confirmation sent in the background is the behaviour on the server, and it is a race inside a
    test that has to read the outbox the moment it presses Confirm. Any test that wants the
    background behaviour can switch it back on with override_settings.
    """

    def setup_test_environment( self, **kwargs ):
        super().setup_test_environment( **kwargs )
        settings.EMAIL_INLINE = True
