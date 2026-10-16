package io.unitycatalog.hadoop.internal.auth;

import io.unitycatalog.client.internal.Preconditions;
import java.util.Objects;

public final class AwsCredential extends GenericCredential {
  private final String accessKeyId;
  private final String secretAccessKey;
  private final String sessionToken;
  private final String serviceEndpoint;

  public AwsCredential(
      String accessKeyId,
      String secretAccessKey,
      String sessionToken,
      Long expirationTimeMillis,
      String prefix) {
    this(accessKeyId, secretAccessKey, sessionToken, expirationTimeMillis, prefix, null);
  }

  public AwsCredential(
      String accessKeyId,
      String secretAccessKey,
      String sessionToken,
      Long expirationTimeMillis,
      String prefix,
      String serviceEndpoint) {
    super(expirationTimeMillis, prefix);
    Preconditions.checkArgument(
        accessKeyId != null && !accessKeyId.isEmpty(), "AWS access key is missing");
    Preconditions.checkArgument(
        secretAccessKey != null && !secretAccessKey.isEmpty(), "AWS secret key is missing");
    // The session token may be empty for static S3-compatible (e.g. MinIO) credentials, where the
    // server vends fixed access keys without a token.
    Preconditions.checkArgument(sessionToken != null, "AWS session token is missing");
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.sessionToken = sessionToken;
    this.serviceEndpoint = serviceEndpoint;
  }

  public String accessKeyId() {
    return accessKeyId;
  }

  public String secretAccessKey() {
    return secretAccessKey;
  }

  public String sessionToken() {
    return sessionToken;
  }

  /**
   * The S3-compatible service endpoint (e.g. {@code https://minio.example.com:9000}) this
   * credential is scoped to, or {@code null} for AWS S3. Clients should set {@code fs.s3a.endpoint}
   * to this value.
   */
  public String serviceEndpoint() {
    return serviceEndpoint;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (!(o instanceof AwsCredential) || !super.equals(o)) {
      return false;
    }
    AwsCredential that = (AwsCredential) o;
    return Objects.equals(accessKeyId, that.accessKeyId)
        && Objects.equals(secretAccessKey, that.secretAccessKey)
        && Objects.equals(sessionToken, that.sessionToken)
        && Objects.equals(serviceEndpoint, that.serviceEndpoint);
  }

  @Override
  public int hashCode() {
    return Objects.hash(
        super.hashCode(), accessKeyId, secretAccessKey, sessionToken, serviceEndpoint);
  }
}
