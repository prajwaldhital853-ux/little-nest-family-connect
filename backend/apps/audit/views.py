from datetime import timedelta

from django.utils import timezone
from rest_framework import mixins, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .models import AuditEntry


class AuditEntrySerializer( serializers.ModelSerializer ):
    class Meta:
        model = AuditEntry
        fields = [ "id", "created_at", "actor_label", "action", "target_type", "target_id", "target_label", "detail" ]
        read_only_fields = fields


class AuditEntryViewSet( mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet ):
    """Read only, which is the point: the panel can see history but cannot rewrite it."""

    permission_classes = [ IsAdminUser ]
    serializer_class = AuditEntrySerializer
    queryset = AuditEntry.objects.select_related( "actor" ).all()
    ordering_fields = [ "created_at" ]
    ordering = [ "-created_at", "-id" ]

    def get_queryset( self ):
        rows = super().get_queryset()
        params = self.request.query_params
        if params.get( "action" ):
            rows = rows.filter( action = params[ "action" ] )
        if params.get( "actor" ):
            rows = rows.filter( actor_label__iexact = params[ "actor" ] )
        if params.get( "target" ):
            rows = rows.filter( target_type = params[ "target" ] )
        if params.get( "search" ):
            rows = rows.filter( target_label__icontains = params[ "search" ] )
        if params.get( "days" ):
            rows = rows.filter( created_at__gte = timezone.now() - timedelta( days = int( params[ "days" ] or 30 ) ) )
        return rows

    @action( detail = False, methods = [ "get" ] )
    def facets( self, request ):
        """The names worth offering in the filter row, with how often each appears."""

        from django.db.models import Count

        rows = self.get_queryset().order_by().values( "action" ).annotate( total = Count( "id" ) ).order_by( "-total" )
        actors = self.get_queryset().order_by().values( "actor_label" ).annotate( total = Count( "id" ) ).order_by( "-total" )[: 12 ]
        return Response( { "actions": list( rows ), "actors": list( actors ) } )
