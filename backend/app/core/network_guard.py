"""Network security guards to defend against Server-Side Request Forgery (SSRF)."""
import ipaddress
import socket
from urllib.parse import urlparse
from app.core.errors import ValidationError


BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),          # Current network
    ipaddress.ip_network("10.0.0.0/8"),         # RFC 1918 Private
    ipaddress.ip_network("127.0.0.0/8"),        # Loopback
    ipaddress.ip_network("169.254.0.0/16"),     # Link-local / Cloud metadata (169.254.169.254)
    ipaddress.ip_network("172.16.0.0/12"),      # RFC 1918 Private
    ipaddress.ip_network("192.168.0.0/16"),     # RFC 1918 Private
    ipaddress.ip_network("224.0.0.0/4"),        # Multicast
    ipaddress.ip_network("240.0.0.0/4"),        # Reserved
    ipaddress.ip_network("::1/128"),            # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),           # IPv6 Unique Local
    ipaddress.ip_network("fe80::/10"),          # IPv6 Link-local
]


def validate_public_url(url: str) -> str:
    """
    Validates that a URL is a legitimate, publicly accessible HTTP/HTTPS URL.
    Rejects private IP ranges, loopbacks, cloud metadata endpoints, and non-HTTP protocols.
    """
    if not url or not isinstance(url, str):
        raise ValidationError("URL must be a non-empty string.")

    parsed = urlparse(url.strip())
    scheme = (parsed.scheme or "").lower()

    if scheme not in ("http", "https"):
        raise ValidationError(f"Invalid URL protocol '{scheme}': Only 'http' and 'https' are permitted.")

    hostname = parsed.hostname
    if not hostname:
        raise ValidationError("Invalid URL: Missing hostname.")

    # Block common local alias hostnames directly
    lowered_host = hostname.lower()
    if lowered_host in ("localhost", "local", "internal", "loopback"):
        raise ValidationError("Access to localhost or loopback domain is prohibited.")

    # Resolve hostname to IPv4/IPv6 addresses
    try:
        addr_info = socket.getaddrinfo(hostname, None)
    except socket.gaierror as exc:
        raise ValidationError(f"Could not resolve hostname '{hostname}': {exc}")

    # Check every resolved IP address against blocked networks
    for family, _, _, _, sockaddr in addr_info:
        ip_str = sockaddr[0]
        try:
            ip_obj = ipaddress.ip_address(ip_str)
            for blocked in BLOCKED_NETWORKS:
                if ip_obj in blocked:
                    raise ValidationError(
                        f"Access to private/internal network destination '{ip_str}' is forbidden by security guardrails."
                    )
        except ValueError:
            raise ValidationError(f"Invalid resolved IP format '{ip_str}'")

    return url.strip()
