# Shell script for restarting docker container

CONTAINER_ID="$(docker ps | grep "deno" | cut -d " " -f 1)"
docker kill $CONTAINER_ID
docker rm $CONTAINER_ID

IMAGE_ID="$(docker images | grep "deno" | xargs | cut -d " " -f 3 | xargs)"
docker rmi $IMAGE_ID

docker build . -t deno-bot
docker run -d --restart unless-stopped deno-bot