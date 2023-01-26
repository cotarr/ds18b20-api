# ds18b20-api

### Status 

Work in progress, currently debugging initial code.

### Description

This is a NodeJs/Express web API that is intended to read 
1 to 4 model DS18b20 temperature sensors connected to the 1-Wire
serial interface on a Raspberry Pi. Data is returned
as a JSON object in the HTTP response. The goal of the 
project was to access various sensors on a residential home 
network for the purpose of displaying data on a personal web page.
The sensors are read once per minute and the data is cached
in RAM for web access. The application is limited to real 
time temperature data and it does not include temperature logging.

- Example HTTP response to an HTTP GET request to route `/v1/data/0'`

```json
{
  "id": 0,
  "timestamp": 1674726373,
  "data": 26.312,
  "error": 0,
  "errorMessage": ""
}
```

The code was written and debugged using a Raspberry Pi 2 Model B and Raspberry Pi 3 Model B 
running 32 bit Raspbian Version 10.13 (Debian 10 Buster) running Node version 18.13.0.

### Security Considerations

The API http server does not include authorization middleware.
The HTTP data routes may be read without restriction.

This was intended to run on an isolated network behind 
a reverse proxy. In this use, a self signed CA certificate was created 
and used to sign a TLS server certificate for the API and to sign a 
TLS client certificate for the reverse proxy. 
When enabled in the configuration, the API will reject TLS connection 
requests in which the TLS client certificate is not signed by 
the CA certificate. 

Optionally, TLS client certificate verification may
be enabled in the configuration as described further below.

Optionally, a 'nftables' or 'iptables' firewall may used to 
restrict network access to the Raspberry Pi from unwanted connections. 
Custom firewall configuration is beyond the scope of this readme.

Optionally, users familiar with ExpressJs applications may
choose to add additional security by using one of the 
authorization middleware packages available in the NPM package repository.
To do this, an access control middleware function may be inserted
in the HTTP request handler in `app.js` similar to the following
suggested example. The name of the function will of course be 
different from this depending on the middleware package used.
Use of third party middleware is beyond the scope of this readme.

```js
app.get('/v1/data/0', myCustomAuthorizationMiddlewareGoesHere, ds18b20Route(0));
```

To reduce security risk, is recommended to run the http web server 
as a non-privileged user that does not have 'sudo' permission.

No automated tests are included in this application.

### Device Drivers

The Raspberry Pi OS includes device drivers used to operate the 1-Wire serial 
interface and read data connected to the 1-Wire serial bus. Multiple sensors 
may be connected in parallel on the 1-Wire bus. Multiple sensors are 
identified using a factory encoded serial number in each temperature sensor.

In a Raspberry Pi, the 1-Wire serial interface is started and data is 
read from sensors by Raspberry Pi firmware that is installed during the 
boot process. This is known as a 'Device Tree Overlay'.
Once the firmware is running, data from temperature sensors 
will be available to user applications by reading files in the device tree.
To activate the firmware device driver, it is necessary to add the 
line `dtoverlay=w1-gpio` to the `[all]` section of the file `/boot/config.txt`.
The 1-Wire firmware will be loaded on the next boot.

```
[all]
dtoverlay=w1-gpio
```

### Electrical Connection

Wiring instructions and wiring diagram are not included in this repository.
Numerous diagrams and instructions may be found by 
performing a Google search for `Raspberry pi ds18b20 wiring diagram`

### Finding The Sensor(s)

Assuming the Device Tree Overlay firmware is loaded and the 
DS18b20 sensor is properly connected to the GPIO pins with 
a proper pull up resistor, several sub-directories will be added 
automatically to the filesystem after reboot.

It is possible to use the `ls` command to search for new sensors.
Each sensor will have a unique directory added to the `/sys/bus/w1/devices/` directory.
In this example the sensor ID is `28-0115a43610ff` which is 
formed using a unique factory assigned serial number.

```
$ ls /sys/bus/w1/devices/
28-0115a43610ff  w1_bus_master1
$
```

The `cat` command can be used to read data from a file named `temperature` in device's folder.
The file will contain integer number that represents the temperature
in degrees C multiplied by 1000. In this example 28562 represents 28.572 Degrees C.
The unique folder name observed in the previous step should be used.

```
$ cat /sys/bus/w1/devices/28-0115a43610ff/temperature
28562
$ 
```

Assuming a non-privileged user has been created to run the web API,
it may be necessary to add that user to the groups 'i2c' and 'gpio'
to obtain permission to access the 1-Wire device tree directories.

If you are having trouble with this step, it may be useful to 
temporarily switch to a user that has sudo permission and add 
sudo to the cat command.

### Installing NodeJs

This application is written in server side JavaScript. 
It requires [NodeJs](https://nodejs.org/) (node) and the 
Node Package Manager (npm) be installed on the Raspberry Pi. 
This API was written in Node Version 18, but the code is 
simple and it should run on lower versions of node (not tested).
Nodesource provides a setup script that can install a 
node binary image compiled for the Raspberry Pi using apt-get.
The nodesource instructions are available at 
[github.com/nodesource/distributions](https://github.com/nodesource/distributions)

Verify that node and npm are installed by typing `node -v` and `npm -v`.

```
$ node -v
v18.13.0
$ npm -v
8.19.3
$ 
```

### Clone Repository

The ds18b20-api repository is located on GitHub. 
The easiest way to install the program is to clone the git 
repository using the terminal `git` command.
If necessary, git may be installed on the Raspberry Pi 
using `sudo apt-get install git`.

Navigate to a directory where you wish to put the API web server.
Again, it is recommended to run the API web server from 
a non-privileged account that does not have sudo permission.
The git repository can be cloned using the `git clone` command shown here. 
After cloning, change to the repository directory.

```
git clone https://github.com/cotarr/ds18b20-api.git
cd ds18b20-api
```

### Configuration

Configuration variables are defined and assigned default values
in the file `config/index.js`. These variables may be 
superseded using shell environment variables. Additionally, 
an optional file `.env` maybe created to define custom 
environment variables without changes to the git repository files.
The repository file `example-dotenv` contains example settings 
which (optionally) can be copied to create a new `.env` file.

```
cp -v example-dotenv .env
chmod 600 .env
```

The only mandatory configuration values are the hardware 
related device tree filenames that are assigned using 
`ID_SENSOR_0`, `ID_SENSOR_1`, `ID_SENSOR_2`, and `ID_SENSOR_3`.
At least one sensor must be defined or an error will be generated.

The default web server port number of 8000 may optionally 
be assigned to a different port number. 

The `SERVER_TLS` setting contains a string set to 'true' or 'false'.
If set to 'true' TLS will be enabled for incoming https requests.
In the case where TLS is enabled, full file path names must be 
assigned for the TLS certificates and private key. In the case 
where TLS is disabled, the certificate files are not required.
The private key file should not have global read permission.

If the `SERVER_CLIENT_AUTH` environment variable is set to 'true', 
the TLS client certificate will be used to authenticate the 
identity of the incoming connection request. In this case, 
the TLS server certificate and the TLS client certificate 
should both be signed by a common CA certificate that is 
defined in the 'SERVER_TLS_CA' environment variable.
Optionally, TLS certificates for use with numeric IP addresses 
may be created using a bash script https://github.com/cotarr/cert-numeric-ip

If you are using custom bash scripts to start and stop, it 
would be useful to know the PID number of the current instance 
of ds18b20-api. If the environment variable `SERVER_PID_FILENAME`
is defined, the PID number will be written to this file when the 
API is started. If this variable is not defined, no file will be created.

- Configuration Environment Variables

| Env Variable        | Example                | Description                                         |
| ------------------- | :--------------------- | :-------------------------------------------------- |
| ID_SENSOR_0         | 28-0115a43610ff        | Filename of sensor directory in device file tree    |
| SERVER_PORT         | 8000                   | The http web server listening port number           |
| SERVER_TLS          | false                  | Set true to enable TLS encryption                   |
| SERVER_CLIENT_AUTH  | false                  | Set 'true' to enforce client certificate validation |
| SERVER_TLS_CA       | /some-path/CAcert.pem  | Filename of TLS CA certificate                      |
| SERVER_TLS_CERT     | /some-path/cert.pem    | Filename of web server TLS server certificate       |
| SERVER_TLS_KEY      | /some-path/key.pem     | Filename of web server TLS private key certificate  |
| SERVER_PID_FILENAME | /some-path/ds18b20.pid | If defined, write file on startup with PID number   |

NodeJs includes an environment variable `NODE_ENV`. In the case
where NODE_ENV is undefined or set to 'development' the
npm package manager will load development dependencies,
in this case, eslint. When the NODE_ENV is 
set to development the http access log be redirected to stdout
without filtering.

### Install Packages

The npm package manager is used to install JavaScript module dependencies.
Perform one of the following two options.

- Option 1 - Run local to try it out. In development, the access log is sent to the terminal. Eslint is installed.

```
export NODE_ENV=development
npm install
```

- Option 2 - Typical for server installation. In production, the HTTP access log is filtered and the output is written to files in the 'logs' directory.

```
export NODE_ENV=production
npm ci
```

### Starting the web server API

The API web server may be started from the base repository 
file directory by typing:

```
npm start
```

Alternately the web server may be started using the node command:

```
node bin/www
```

When running in the production environment with NODE_ENV=production,
the HTTP access log may be redirected to the terminal
by adding the following environment variable to the command:

```
NODE_DEBUG_LOG=1 node bin/www
```

In the case of NODE_ENV=production the HTTP access log is limited to logging
only errors where the HTTP response status code is greater or equal than 400. 
Automatic pruning of log files is not included, so the access log should be 
checked occasionally to manage disk space utilization.

# Testing

The easiest way to test the API is to start the API web server 
with TLS encryption disabled, then use the `curl` command as follows:

```bash
curl http://localhost:8000/v1/data/0
```

The curl command should return a JSON data object.

```json
{"id":0,"timestamp":1674744779,"data":25.562,"error":0,"errorMessage":""}
```

### Linting

The development installation includes eslint which may be run by typing `npm run lint`
