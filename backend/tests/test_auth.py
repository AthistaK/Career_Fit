import pytest
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token


def test_password_hashing():
    password = "MySecurePassword2026!"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_generation_and_decoding():
    user_id = 42
    token = create_access_token(subject=user_id)
    assert token is not None
    assert isinstance(token, str)

    payload = decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == str(user_id)
