from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import (
    CurrentUserView,
    DeviceAccessView,
    DeviceRequestDecisionView,
    DeviceRequestListView,
    ForgotPasswordView,
    LoginView,
    LogoutView,
    OtpVerifyView,
    PanelTokenRefreshView,
    PasswordChangeView,
    ResetPasswordView,
    StaffUserViewSet,
    TrustedDeviceDeleteView,
    TrustedDeviceListView,
)

router = SimpleRouter()
router.register( "users", StaffUserViewSet, basename = "staff-user" )

urlpatterns = [
    path( "login/", LoginView.as_view(), name = "login" ),
    path( "otp/verify/", OtpVerifyView.as_view(), name = "otp-verify" ),
    path( "refresh/", PanelTokenRefreshView.as_view(), name = "refresh" ),
    path( "logout/", LogoutView.as_view(), name = "logout" ),
    path( "me/", CurrentUserView.as_view(), name = "me" ),
    path( "devices/", TrustedDeviceListView.as_view(), name = "devices" ),
    path( "devices/<int:pk>/", TrustedDeviceDeleteView.as_view(), name = "device-detail" ),
    path( "access/", DeviceAccessView.as_view(), name = "device-access" ),
    path( "access/requests/", DeviceRequestListView.as_view(), name = "device-requests" ),
    path( "access/requests/<int:pk>/", DeviceRequestDecisionView.as_view(), name = "device-request-detail" ),
    path( "password/", PasswordChangeView.as_view(), name = "password" ),
    path( "password/forgot/", ForgotPasswordView.as_view(), name = "password-forgot" ),
    path( "password/reset/", ResetPasswordView.as_view(), name = "password-reset" ),
    path( "", include( router.urls ) ),
]
