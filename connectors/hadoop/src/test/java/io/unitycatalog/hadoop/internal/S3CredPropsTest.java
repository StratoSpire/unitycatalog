package io.unitycatalog.hadoop.internal;

import static org.assertj.core.api.Assertions.assertThat;

import io.unitycatalog.hadoop.UCCredentialHadoopConfs;
import io.unitycatalog.hadoop.internal.auth.AwsCredential;
import io.unitycatalog.hadoop.internal.auth.GenericCredential;
import java.util.Map;
import org.apache.hadoop.conf.Configuration;
import org.junit.jupiter.api.Test;

class S3CredPropsTest extends CredPropsBaseTest {

  private static final String CUSTOM_IMPL = "com.example.CustomS3FileSystem";
  private static final String S3A_FS = "org.apache.hadoop.fs.s3a.S3AFileSystem";
  private static final String S3A_AFS = "org.apache.hadoop.fs.s3a.S3A";
  private static final String VENDED_PROVIDER =
      "io.unitycatalog.hadoop.internal.auth.AwsVendedTokenProvider";

  @Override
  String scheme() {
    return "s3";
  }

  @Override
  String location() {
    return "s3://bucket/data";
  }

  @Override
  GenericCredential vendedCred(Long expirationMillis, String prefix) {
    return new AwsCredential("ak", "sk", "st", expirationMillis, prefix);
  }

  @Override
  Map<String, String> defaultKeys() {
    return props(
        "fs.s3a.path.style.access", "true",
        "fs.s3.impl.disable.cache", "true",
        "fs.s3a.impl.disable.cache", "true");
  }

  @Override
  Map<String, String> staticCredKeys(Long expiration) {
    // S3's static path carries no expiration key.
    return props(
        "fs.s3a.access.key", "ak",
        "fs.s3a.secret.key", "sk",
        "fs.s3a.session.token", "st");
  }

  @Override
  Map<String, String> initialCredKeys(Long expiration) {
    Map<String, String> keys =
        props(
            UCHadoopConfConstants.S3A_INIT_ACCESS_KEY, "ak",
            UCHadoopConfConstants.S3A_INIT_SECRET_KEY, "sk",
            UCHadoopConfConstants.S3A_INIT_SESSION_TOKEN, "st");
    if (expiration != null) {
      keys.put(UCHadoopConfConstants.S3A_INIT_CRED_EXPIRED_TIME, String.valueOf(expiration));
    }
    return keys;
  }

  @Override
  Map<String, String> renewableProviderKeys() {
    return props(UCHadoopConfConstants.S3A_CREDENTIALS_PROVIDER, VENDED_PROVIDER);
  }

  @Override
  Map<String, String> fileSystemImplKeys() {
    return props(
        "fs.s3.impl", S3A_FS,
        "fs.s3a.impl", S3A_FS);
  }

  @Override
  Map<String, String> abstractFileSystemImplKeys() {
    return props(
        "fs.AbstractFileSystem.s3.impl", S3A_AFS,
        "fs.AbstractFileSystem.s3a.impl", S3A_AFS);
  }

  @Override
  Map<String, String> customImplSeed() {
    return props("fs.s3.impl", CUSTOM_IMPL, "fs.s3a.impl", CUSTOM_IMPL);
  }

  // ---- MinIO / S3-compatible endpoint support -----------------------------------------------

  @Test
  void serviceEndpointSetsFsS3aEndpointOnFixedCreds() throws Exception {
    CredPropsUtil.genericCredFetcherFactory =
        (apiClient, credId) ->
            mockGenericCredentialFetcher(
                new AwsCredential(
                    "ak", "sk", "", null, location(), "https://minio.example.com:9000"));

    Map<String, String> props = tableCredProps(false);

    assertThat(props).containsEntry("fs.s3a.endpoint", "https://minio.example.com:9000");
    // Empty session token from a static MinIO credential is accepted and flows through.
    assertThat(props).containsEntry("fs.s3a.session.token", "");
  }

  @Test
  void serviceEndpointSetsFsS3aEndpointOnRenewableCreds() throws Exception {
    CredPropsUtil.genericCredFetcherFactory =
        (apiClient, credId) ->
            mockGenericCredentialFetcher(
                new AwsCredential(
                    "ak", "sk", "st", null, location(), "https://minio.example.com:9000"));

    Map<String, String> props = tableCredProps(true);

    assertThat(props).containsEntry("fs.s3a.endpoint", "https://minio.example.com:9000");
  }

  @Test
  void awsS3WithoutEndpointEmitsNoFsS3aEndpoint() throws Exception {
    CredPropsUtil.genericCredFetcherFactory =
        (apiClient, credId) -> mockGenericCredentialFetcher(vendedCred(null, location()));

    Map<String, String> props = tableCredProps(false);

    assertThat(props).doesNotContainKey("fs.s3a.endpoint");
  }

  /** Entry point used by the MinIO endpoint tests; {@code renew} selects the provider path. */
  private Map<String, String> tableCredProps(boolean renew) throws Exception {
    return CredPropsUtil.createTableCredProps(
        renew,
        false,
        new Configuration(false),
        scheme(),
        null,
        CATALOG_URI,
        tokenProvider(),
        TABLE_ID,
        UCCredentialHadoopConfs.TableOperation.READ_WRITE,
        Map.of());
  }
}
