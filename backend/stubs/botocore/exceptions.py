"""Minimal botocore exceptions stub."""


class BotoCoreError(Exception):
    pass


class ClientError(Exception):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.response = {}
