"""
Google Identity Services (OAuth 2.0 / OpenID Connect) token verification module.
Verifies Google ID Tokens against Google's public JWKS certificates.
Supports offline mock tokens for automated integration tests and disconnected environments.
"""
import time
import jwt
from typing import Dict, Any, Optional
from jwt import PyJWKClient
from app.core.config import settings
from app.core.logging import logger
from app.core.errors import UnauthorizedError

GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
_jwks_client: Optional[PyJWKClient] = None


def get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(GOOGLE_JWKS_URL, cache_keys=True, max_cached_keys=10)
    return _jwks_client


async def verify_google_id_token(id_token: str) -> Dict[str, Any]:
    """
    Verifies a Google Identity Services (GIS) ID Token (JWT).
    Returns verified claims: email, name, email_verified, hd, sub, picture.
    """
    if not id_token or not id_token.strip():
        raise UnauthorizedError(message="Google ID Token is missing")

    # Automated Testing Mock Token Support
    # Format: mock-google-token:email@domain.com:Full Name:hosted_domain
    if id_token.startswith("mock-google-token:"):
        parts = id_token.split(":")
        mock_email = parts[1] if len(parts) > 1 else "student@kitcoek.in"
        mock_name = parts[2] if len(parts) > 2 else "Test Google User"
        mock_hd = parts[3] if len(parts) > 3 else ("kitcoek.in" if mock_email.endswith("kitcoek.in") else None)
        return {
            "email": mock_email.lower().strip(),
            "name": mock_name,
            "email_verified": True,
            "hd": mock_hd,
            "sub": f"google-sub-{mock_email}",
            "picture": "https://lh3.googleusercontent.com/mock-avatar",
        }

    try:
        # Inspect token header to ensure key ID is present
        unverified_header = jwt.get_unverified_header(id_token)
        kid = unverified_header.get("kid")
        if not kid:
            raise UnauthorizedError(message="Google ID Token is missing 'kid' key identifier in header")

        client = get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(id_token)

        # Decode and verify against Google Client ID and trusted Google issuers
        audience = settings.GOOGLE_CLIENT_ID
        payload = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=audience if audience else None,
            issuer=["accounts.google.com", "https://accounts.google.com"],
            options={"verify_aud": bool(audience)},
        )

        email = payload.get("email")
        if not email:
            raise UnauthorizedError(message="Google token does not contain an email claim")

        if not payload.get("email_verified", False):
            raise UnauthorizedError(message="Google email address has not been verified by Google")

        return {
            "email": email.lower().strip(),
            "name": payload.get("name", ""),
            "email_verified": True,
            "hd": payload.get("hd"),
            "sub": payload.get("sub"),
            "picture": payload.get("picture"),
        }
    except jwt.ExpiredSignatureError:
        raise UnauthorizedError(message="Google authentication token has expired. Please sign in again.")
    except jwt.InvalidAudienceError:
        raise UnauthorizedError(message="Google authentication token audience mismatch.")
    except (jwt.InvalidTokenError, Exception) as exc:
        logger.warning(f"Google token verification failed: {exc}")
        raise UnauthorizedError(message=f"Google authentication failed: {str(exc)}")

