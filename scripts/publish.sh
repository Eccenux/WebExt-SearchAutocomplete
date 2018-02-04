#!/bin/sh

##
# Publishing script.
#
# Should create a new Web Extension zip in `package` dir.
# Designed to fail when any test fail.
##

##
# Check result of a command.
# Note! Will exit upon error.
# @param $1 commandName
function checkCommandResult {
	result=$?
	commandName=$1
	if [ "$result" -ne "0" ]; then
		echo "$commandName failed with exit code: $result"
		exit 1
	fi
}

echo
echo "gulp: clean"
gulp clean

echo
echo "gulp: build"
gulp build
checkCommandResult "Build"

echo
echo "tests"
./scripts/test.sh
checkCommandResult "Testing"

echo
echo "gulp: package"
gulp package
