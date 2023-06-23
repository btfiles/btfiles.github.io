#!/bin/bash
# shifts by 180, prepends "eo_"
if [ ! $1 ]
then
	echo "Usage: $0 <dir>"
fi

target_dir=$1
reg="($target_dir/)($target_dir)([0-9]+)-([0-9]+).png"

for f in ${target_dir}/*.png
do
	echo $f
	if [[ $f =~ $reg ]]
	then
		full_match="${BASH_REMATCH[0]}"
		fldr="${BASH_REMATCH[1]}"
		fname="${BASH_REMATCH[2]}"
		graze="${BASH_REMATCH[3]}"
		azimuth="10#${BASH_REMATCH[4]}"
		#echo $full_match
		#echo $pfx
		#echo $graze
		#echo $azimuth
		new_azimuth=$((azimuth + 180))
		#echo "$azimuth -> $new_azimuth"
		new_azimuth=$(( new_azimuth % 360 ))
		if [ "$new_azimuth" = "0" ]
		then
			new_azimuth=360
		fi
		printf -v new_azimuth "%03d" $new_azimuth
		new_name=eo_${fldr}eo_${fname}${graze}-${new_azimuth}.png
		echo "$f to $new_name"
		mv $f $new_name

	fi
done

