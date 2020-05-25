FROM node:10-alpine

COPY ./rootfs/app/package.json ./rootfs/app/yarn.lock /app
RUN cd /app && yarn install && rm -rf /root/.cache /root/.npm /usr/local/share/.cache/yarn/

COPY ./rootfs/ /
WORKDIR /app

RUN yarn build

VOLUME ["/data"]

EXPOSE 80

    # cache 的存储： leveldb | redis
ENV CACHE_STORE_TYPE="leveldb" \
    LEVELDB_PATH="/data/db" \
    REDIS_URI="" \
    REDIS_PREFIX="" \
    MONGO_URI="mongodb://mongodb:27017/backend" \
    MONGO_URI_TEST="mongodb://mongodb:27017/backend-test" \
    MONGO_COLLECTION_PREFIX="" \
    EXPRESS_BODY_LIMIT_SIZE="104857600" \
    # session 的存储： mongo | redis | leveldb
    EXPRESS_SESSION_STORE="mongo" \
    EXPRESS_COOKIE_NAME="connect.sid" \
    EXPRESS_COOKIE_SECRET="" \
    EXPRESS_COOKIE_DOMAIN="" \
    ADMIN_COOKIE_NAME="adminbro" \
    # 管理员用户列表，多个用户用逗号分隔
    ADMIN_USER_LIST=""

CMD ["yarn", "start"]
