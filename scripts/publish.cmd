@echo off

rem
rem Publishing script.
rem 
rem Should create a new Web Extension zip in `package` dir.
rem Designed to fail when any test fail.
rem

echo.
echo gulp: clean
call gulp clean

echo.
echo gulp: build
call gulp build
rem If the last program run returned an exit code equal to or greater than 1.
if errorlevel 1 (
   echo Build failed with exit code: %errorlevel%
   exit /b %errorlevel%
)

echo.
echo tests
call .\scripts\test.cmd
rem If the last program run returned an exit code equal to or greater than 1.
if errorlevel 1 (
   echo Testing failed with exit code: %errorlevel%
   exit /b %errorlevel%
)

echo.
echo gulp: package
call gulp package
