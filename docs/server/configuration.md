# Unity Catalog Server Configuration

This is the  Unity Catalog server implementation that can be run in the cloud or started locally.

## Running the Server

To run against the latest main branch, start by cloning the open source Unity Catalog GitHub repository:

```sh
git clone git@github.com:unitycatalog/unitycatalog.git
```

To run Unity Catalog, you need **Java 17** installed on your machine. You can always run the `java --version` command
to verify that you have the right version of Java installed such as the following example output.

```sh
% java --version
openjdk 17.0.12 2024-07-16
OpenJDK Runtime Environment Homebrew (build 17.0.12+0)
OpenJDK 64-Bit Server VM Homebrew (build 17.0.12+0, mixed mode, sharing)
```

Change into the `unitycatalog` directory and run `bin/start-uc-server` to instantiate the server. Here is what you
should see:

```console
################################################################### 
#  _    _       _ _            _____      _        _              #
# | |  | |     (_) |          / ____|    | |      | |             #
# | |  | |_ __  _| |_ _   _  | |     __ _| |_ __ _| | ___   __ _  #
# | |  | | '_ \| | __| | | | | |    / _` | __/ _` | |/ _ \ / _` | #
# | |__| | | | | | |_| |_| | | |___| (_| | || (_| | | (_) | (_| | #
#  \____/|_| |_|_|\__|\__, |  \_____\__,_|\__\__,_|_|\___/ \__, | #
#                      __/ |                                __/ | #
#                     |___/           v<version>           |___/  #
###################################################################
```

!!! note "Server version string"
    `<version>` is the version you are running. Released builds display the release version (for
    example `v0.5.0`), while builds from the `main` branch append `-SNAPSHOT` (for example
    `v0.5.0-SNAPSHOT`).

The server can be started by issuing the below command from the project root directory:

```sh
bin/start-uc-server
```

!!! note "Running Unity Catalog Server on a specific port"
    To run the server on a specific port, use the `-p` or `--port` option followed by the port number:

    ```sh title="Use -p or --port to specify your port"
    bin/start-uc-server -p <port_number>
    bin/start-uc-server -port <port_number>
    ```

    If no port is specified, the server defaults to port **8080**.

## Configuration

The server config file is at the location `etc/conf/server.properties` (relative to the project root).

- `server.env`: The environment in which the server is running. This can be set to `dev` or `test`. When set to `test`
    the server will instantiate an empty in-memory h2 database for storing metadata. If set to `dev`, the server will
    use the file `etc/db/h2db.mv.db` as the metadata store. Any changes made to the metadata will be persisted in this
    file.
- `server.external-local-roots`: A comma-separated list of local directories (plain paths or `file:` URLs) under
    which external Iceberg tables may be created through the Iceberg REST catalog without an external location. The
    server creates these tables' directories and writes their metadata itself
    (see [Local file system storage](#local-file-system-storage)), so it accepts a local location only when the
    location is under an external location or strictly under one of these roots (the root itself is not accepted).
    Unset by default: a local external Iceberg table then needs an external location. No securable governs a root, so
    any principal who can create a table can use it. Each entry must be a local path; an entry such as an `s3://` URL
    fails server startup. As with `storage-root.*`, a relative path containing `/` (for example `./uc-external`) is
    resolved against the server's working directory, and a directory that does not exist yet is accepted.

!!! note "Local `file:` locations"
    A local `file:` location must name one plain path. The server rejects with `400` a location that has an encoded
    `/` or NUL (`%2F`, `%00`), an encoded dot segment (`%2e`, `%2e%2e`, in either case), or a `..` above the root
    (`file:///../etc`), since the file system would read it as a different path, and a location with a query or
    fragment, which a local path does not have.
    A host is read as the first directory (`file://tmp/x` is `/tmp/x`) and is checked the same way. Other escapes
    are kept as sent. For an external Iceberg table, a local location must also use only the escapes a path needs
    (`my%20table`, `a%25b`, `caf%C3%A9`); a location with an escape it does not need (`table%41` for `tableA`,
    lowercase hex, raw non-ASCII) is rejected with `400`, and an external location whose URL has such an escape
    cannot hold one.

### S3 and S3-Compatible Storage Configuration

Unity Catalog supports both AWS S3 and S3-compatible storage services (MinIO, Wasabi, DigitalOcean Spaces, Cloudflare R2, etc.).

For enabling server to vend temporary credentials to access S3 buckets (for accessing External tables/volumes),
the following parameters need to be set:

- `s3.bucketPath.i`: The S3 path of the bucket where the data is stored. Should be in the format `s3://<bucket-name>`.
- `s3.region.i`: The AWS region where the bucket is located (e.g., `us-east-1`). Required even for S3-compatible services.
- `s3.awsRoleArn.i`: (Optional) The ARN of the AWS IAM role to assume for accessing the bucket.
- `s3.accessKey.i`: The AWS access key or S3-compatible service access key.
- `s3.secretKey.i`: The AWS secret key or S3-compatible service secret key.
- `s3.sessionToken.i`: (Optional) The AWS session token for temporary credentials.
- **`s3.serviceEndpoint.i`**: (Optional) **NEW** - The endpoint URL for S3-compatible services. Leave empty for AWS S3.

You can configure multiple buckets by incrementing the index *i* in the above parameters. The starting index should
be 0.

For vending temporary credentials, the server matches the bucket path in the table/volume storage_location with the 
bucket path in the configuration and returns the corresponding credentials.

#### AWS S3 Configuration Example

```properties
# Standard AWS S3 configuration
s3.bucketPath.0=s3://my-aws-bucket
s3.region.0=us-west-2
s3.awsRoleArn.0=arn:aws:iam::123456789012:role/UnityRole
s3.accessKey.0=
s3.secretKey.0=
# serviceEndpoint not set = uses AWS S3
```

#### S3-Compatible Storage Configuration

**MinIO Example:**
```properties
s3.bucketPath.0=s3://my-minio-bucket
s3.region.0=us-east-1
s3.accessKey.0=minioadmin
s3.secretKey.0=minioadmin
s3.serviceEndpoint.0=https://minio.company.com:9000
```

**Wasabi Example:**
```properties
s3.bucketPath.1=s3://my-wasabi-bucket
s3.region.1=us-east-1
s3.accessKey.1=YOUR_WASABI_ACCESS_KEY
s3.secretKey.1=YOUR_WASABI_SECRET_KEY
s3.serviceEndpoint.1=https://s3.us-east-1.wasabisys.com
```

**DigitalOcean Spaces Example:**
```properties
s3.bucketPath.2=s3://my-do-space
s3.region.2=nyc3
s3.accessKey.2=YOUR_DO_ACCESS_KEY
s3.secretKey.2=YOUR_DO_SECRET_KEY
s3.serviceEndpoint.2=https://nyc3.digitaloceanspaces.com
```

**Cloudflare R2 Example:**
```properties
s3.bucketPath.3=s3://my-r2-bucket
s3.region.3=auto
s3.accessKey.3=YOUR_R2_ACCESS_KEY
s3.secretKey.3=YOUR_R2_SECRET_KEY
s3.serviceEndpoint.3=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
```

#### Multiple Providers in One Configuration

Unity Catalog supports configuring multiple S3 and S3-compatible storage providers simultaneously:

```properties
# MinIO
s3.bucketPath.0=s3://minio-data
s3.region.0=us-east-1
s3.serviceEndpoint.0=https://minio.example.com:9000
s3.accessKey.0=minioadmin
s3.secretKey.0=minioadmin

# AWS S3
s3.bucketPath.1=s3://aws-backup
s3.region.1=us-west-2
s3.awsRoleArn.1=arn:aws:iam::123456789012:role/UnityRole
# No serviceEndpoint = AWS S3

# Wasabi
s3.bucketPath.2=s3://wasabi-archive
s3.region.2=us-east-1
s3.serviceEndpoint.2=https://s3.us-east-1.wasabisys.com
s3.accessKey.2=YOUR_KEY
s3.secretKey.2=YOUR_SECRET
```

#### Troubleshooting S3-Compatible Storage

**Common Issues:**

1. **Connection Refused / Timeout**
   - Verify the `serviceEndpoint` URL is correct and accessible from the Unity Catalog server
   - Check firewall rules and network connectivity
   - Ensure the endpoint uses `http://` for insecure or `https://` for secure connections

2. **403 Forbidden / Access Denied**
   - Verify `accessKey` and `secretKey` are correct
   - For MinIO: Ensure the user has appropriate policies attached
   - Check that the bucket exists and is accessible

3. **Invalid Endpoint URL**
   - Endpoint must be a valid URL: `http[s]://hostname[:port]`
   - Do not include bucket name in the endpoint
   - Examples: `https://minio.example.com:9000` ✓, `https://minio.example.com:9000/bucket` ✗

4. **Path Style Access Issues (MinIO)**
   - Unity Catalog automatically sets `fs.s3a.path.style.access=true` for S3-compatible endpoints
   - This is required for MinIO and most S3-compatible services

5. **Region Mismatch**
   - Even for S3-compatible services, you must specify a region
   - For MinIO, any valid AWS region name works (e.g., `us-east-1`)
   - For Cloudflare R2, use `auto`

Any params that are not required can be left empty.

## Local file system storage

Unity Catalog can store data on the server's local file system, which is convenient for development and single-machine
setups. The server reads and writes local storage only where an administrator configures it:

- a server storage root with a local path, such as `storage-root.tables` or `storage-root.models`;
- an external location with a `file:` URL, and the catalogs, schemas, tables, and volumes under it;
- the roots in `server.external-local-roots`, for external Iceberg tables.

For local locations, the server reads, writes, and deletes some files itself, with its own operating-system identity:
for example, the metadata of tables created through the Iceberg REST catalog, and the directories of managed tables,
volumes, and models. Clients that share the file system read and write data files with their own identity. So the
server acts on behalf of every principal that can write those directories:

- Make local storage directories writable only by principals you trust with the server's file access.
- The server does not follow a symbolic link at or below a table's location, but it does not check the directories
    above the location. A principal that can replace one of those with a link can redirect the server's reads,
    writes, and deletes elsewhere.
- The check runs when an operation starts, so a link created while an operation runs is not detected.

For a deployment shared by users who should not have each other's file access, use cloud storage, where the server
vends credentials scoped to each location.

## Logging

The server logs are located at `etc/logs/server.log`. The log level and log rolling policy can be set in log4j2 config
file: `etc/conf/server.log4j2.properties`.

## Authentication and Authorization

Please refer to [Authentication and Authorization](./auth.md) section for more information.
