"""Minimal boto3 stub for local preview without the real dependency."""


def client(service, **kwargs):
    raise RuntimeError("boto3 is not installed; object storage unavailable in preview")
