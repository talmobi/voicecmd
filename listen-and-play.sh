./bin/cli.js | while read line; do
  echo "$line"
  yt-play "$line" &
done
