./bin/cli.js | grep --line-buffered -i "^play" | sed -l 's/[Pp]lay//' | while read line ; do
  echo "$line"
  yt-play "$line" &
done
