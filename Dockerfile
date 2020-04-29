FROM node:8-alpine

COPY ./rootfs/app/package.json ./rootfs/app/yarn.lock /app
RUN cd /app && yarn install && rm -rf /root/.cache /root/.npm /usr/local/share/.cache/yarn/

COPY ./rootfs/ /
WORKDIR /app

RUN yarn build

VOLUME ["/data"]

EXPOSE 80

ENV CACHE_STORE_TYPE="leveldb" \
    LEVELDB_PATH="/data/db" \
    REDIS_URI="" \
    REDIS_PREFIX=""

CMD ["yarn", "start"]
