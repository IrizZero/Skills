import os

from redis import Redis

redis = Redis.from_url(os.environ["REDIS_URL"])
