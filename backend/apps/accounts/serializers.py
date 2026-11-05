from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import User
from .security import revoke_every_session


def check_password_strength( password, user = None ):
    """Turn Django's password validators into a DRF field error."""

    try:
        validate_password( password, user )
    except DjangoValidationError as error:
        raise serializers.ValidationError( { "password": list( error.messages ) } ) from error


class UserSerializer( serializers.ModelSerializer ):
    class Meta:
        model = User
        fields = [ "id", "email", "username", "full_name", "job_title", "is_staff", "is_active", "date_joined", "last_login" ]
        read_only_fields = [ "id", "username", "date_joined", "last_login", "is_superuser", "is_staff", "is_active" ]


class LoginInputSerializer( serializers.Serializer ):
    email = serializers.EmailField()
    password = serializers.CharField( write_only = True, style = { "input_type": "password" } )

    def validate_email( self, value ):
        return value.strip().lower()


class OtpInputSerializer( serializers.Serializer ):
    code = serializers.CharField( max_length = 12 )

    def validate_code( self, value ):
        digits = "".join( character for character in value if character.isdigit() )
        if len( digits ) != 6:
            raise serializers.ValidationError( "Enter the six digits from the email." )
        return digits


class ForgotPasswordSerializer( serializers.Serializer ):
    email = serializers.EmailField()

    def validate_email( self, value ):
        return value.strip().lower()


class ResetPasswordSerializer( serializers.Serializer ):
    email = serializers.EmailField()
    token = serializers.CharField( write_only = True )
    password = serializers.CharField( write_only = True, style = { "input_type": "password" } )

    def validate_email( self, value ):
        return value.strip().lower()

    def validate_password( self, value ):
        check_password_strength( value )
        return value


class PasswordChangeSerializer( serializers.Serializer ):
    current_password = serializers.CharField( write_only = True, style = { "input_type": "password" } )
    new_password = serializers.CharField( write_only = True, style = { "input_type": "password" } )

    def validate_new_password( self, value ):
        check_password_strength( value, self.context[ "request" ].user )
        return value

    def validate( self, attrs ):
        user = self.context[ "request" ].user
        if not user.check_password( attrs[ "current_password" ] ):
            raise serializers.ValidationError( { "current_password": [ "This password is not correct." ] } )
        return attrs

    def save( self, **kwargs ):
        user = self.context[ "request" ].user
        user.set_password( self.validated_data[ "new_password" ] )
        user.save( update_fields = [ "password" ] )
        revoke_every_session( user )
        return user


class StaffUserSerializer( serializers.ModelSerializer ):
    password = serializers.CharField( write_only = True, required = False, style = { "input_type": "password" } )

    class Meta:
        model = User
        fields = [ "id", "email", "full_name", "job_title", "password", "is_staff", "is_active", "date_joined", "last_login" ]
        read_only_fields = [ "id", "date_joined", "last_login" ]

    def create( self, validated_data ):
        password = validated_data.pop( "password", None )
        if not password:
            raise serializers.ValidationError( { "password": [ "A password is required for a new account." ] } )
        check_password_strength( password )
        return User.objects.create_user( password = password, **validated_data )

    def update( self, instance, validated_data ):
        password = validated_data.pop( "password", None )
        for field, value in validated_data.items():
            setattr( instance, field, value )
        if password:
            check_password_strength( password, instance )
            instance.set_password( password )
            revoke_every_session( instance )
        instance.save()
        return instance
