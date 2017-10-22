# marlinshell

`marlinshell` is a command line tool to interact with a 3D printed using the marlin firmware. It connects to the printer through USB and allow sending gcode.
There is a command history you can navigate with up and down arrow. The output console is scrollable with the mouse.

All command sent and the messages received back from the printer are logged in a file.

Run it with the `--help` to get all command line options.

By default `marlinshell` connects to /dev/ttyUSB0 at 2500000 bauds, and records to the `session.log` file.

## Build
You can build either with `npm` or `yarn`:
```shell
yarn install
```

## Run
To run marlinshell you just have to run :
```shell
src/marlinshell.js
```

If you want to change the default logging file :
```shell
src/marlinshell.js -o calibration.log
```

## Development

### Coverage
Test coverage is done with `istanbul`.
```
yarn add --dev nyc
```
