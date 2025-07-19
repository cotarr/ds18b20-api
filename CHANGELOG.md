# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.0.8](https://github.com/cotarr/ds18b20-api/releases/tag/v1.0.8) 2025-07-19

- Update all npm packages to current
- Run npm audit fix to fix eslint
- Modify dotenv to suppress tips { quiet: true }

- Update express version 4 to 5 (major version upgrade)
- Regenerate package-lock.json

## [v1.0.7](https://github.com/cotarr/ds18b20-api/releases/tag/v1.0.7) 2025-06-14

- Upgrade dependencies to current to clear npm audit warning.

## [v1.0.6](https://github.com/cotarr/ds18b20-api/releases/tag/v1.0.6) 2024-12-10

- Upgrade express to 4.21.2 to address npm audit warning
- Upgrade other dependencies to current

## [v1.0.5](https://github.com/cotarr/ds18b20-api/releases/tag/v1.0.5) 2024-11-20

- Upgrade eslint to 9.15.0 to clean GitHub dependabot audit warning (no code changes in this commit)

## [v1.0.4](https://github.com/cotarr/ds18b20-api/releases/tag/v1.0.4) 2024-10-10

- Upgrade eslint from version 8 to version 9
- Update npm dependency express@4.21.1 to clear npm audit security warning
- Delete and regenerate package-lock.json, confirm no npm audit warnings.

## [v1.0.3](https://github.com/cotarr/ds18b20-api/releases/tag/v1.0.3) 2024-09-24

- Update express to v4.21.0 to address npm audit security warning.

## [v1.0.2](https://github.com/cotarr/ds18b20-api/releases/tag/v1.0.2) 2024-03-28

- Update express to v4.19.2 to address npm audit security warning.
- Update all npm dependencies to current

## [v1.0.1](https://github.com/cotarr/ds18b20-api/releases/tag/v1.0.1) 2023-02-02

Recode error detection and error handling.

- Changed - Changed data source from '/temperature' to '/w1_slave'
- Fixed - Cached error no longer expire and become timeout errors.
- Added - Sensor errors will be re-tried up to 5 times at 10 second intervals before an error condition is set in the cache. Non-error interval remains at 60 seconds.
- Added - Explicitly confirm CRC check from w1_bus_master1 driver. Expect: 'YES'.
- Changed - Re-assigned new error code numbers 

## [v1.0.0](https://github.com/cotarr/ds18b20-api/releases/tag/v1.0.0) 2023-01-27

- Initial commit
