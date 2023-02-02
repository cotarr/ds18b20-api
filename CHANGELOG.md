# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.0.1](https://github.com/cotarr/ds18b20-api/releases/tag/v1.0.1) 2023-02-02

Recode error detection and error handling.

- Changed - Changed data source from '/temperature' to '/w1_slave'
- Fixed - Cached error no longer expire and become timeout errors.
- Added - Sensor errors will be re-tried up to 5 times at 10 second intervals before an error condition is set in the cache. Non-error interval remains at 60 seconds.
- Added - Explicitly confirm CRC check from w1_bus_master1 driver. Expect: 'YES'.
- Changed - Re-assigned new error code numbers 

## [v1.0.0](https://github.com/cotarr/ds18b20-api/releases/tag/v1.0.0) 2023-01-27

- Initial commit
