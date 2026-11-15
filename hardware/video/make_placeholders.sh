#!/usr/bin/env bash
# Creates PLACEHOLDER slates for the Software screen recordings (10 s, 1920x1080, 30 fps).
# Software replaces each file with the real recording using the SAME file name, then re-render.
set -euo pipefail
cd "$(dirname "$0")/assets"
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
MONO=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf
slate() {  # file  title  detail
  [ -f "$1" ] && ! ffprobe -v error -show_entries format_tags=comment -of csv=p=0 "$1" | grep -q PLACEHOLDER && { echo "keep real $1"; return; }
  ffmpeg -v error -y -f lavfi -i "color=c=0x0e1626:s=1920x1080:r=30:d=10" -vf "\
drawgrid=w=80:h=80:t=1:c=0x22324f@0.9,\
drawtext=fontfile=$MONO:text='PLACEHOLDER · SOFTWARE SCREEN RECORDING':fontcolor=0xf5b301:fontsize=34:x=(w-tw)/2:y=330,\
drawtext=fontfile=$FONT:text='$2':fontcolor=0xe8eefc:fontsize=64:x=(w-tw)/2:y=420,\
drawtext=fontfile=$FONT:text='$3':fontcolor=0x8fa2c7:fontsize=36:x=(w-tw)/2:y=530,\
drawtext=fontfile=$MONO:text='replace hardware/video/assets/$1':fontcolor=0x22d3ee:fontsize=30:x=(w-tw)/2:y=640" \
    -c:v libx264 -pix_fmt yuv420p -crf 28 -metadata comment=PLACEHOLDER "$1"
  echo "slate $1"
}
slate rec-01-login.mp4               "Login with camera"            "face recognized, then camera off (consenting adult)"
slate rec-02-bradycardia-day13.mp4   "Body scan · bradycardia day 13" "chest turns RED: HR 46 vs your normal 62"
slate rec-03-mars-sbar.mp4           "Mars mode"                    "guided steps + S-B-A-R queued, reply about 44 min"
slate rec-04-solar-storm-donki.mp4   "Radiation card · solar_storm" "NASA DONKI solar particle event"
slate rec-05-trends-14d.mp4          "14-day trends"                "personal baseline band per indicator"
