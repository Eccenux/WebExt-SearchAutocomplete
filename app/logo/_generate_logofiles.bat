@echo off

SET tempset_OUTPATH=..\images\

echo Generating...
CALL _svg2png.bat Logo.svg %tempset_OUTPATH%icon-128.png 128
CALL _svg2png.bat Logo.svg %tempset_OUTPATH%icon-16.png 16
CALL _svg2png.bat Logo.svg %tempset_OUTPATH%icon-19.png 19
CALL _svg2png.bat Logo.svg %tempset_OUTPATH%icon-38.png 38

echo Done.
pause
