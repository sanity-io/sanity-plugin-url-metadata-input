# Breaking changes

## 0.x -> 1.x

- The schema type no longer needs to be imported to the schema explicitly, as it is automatically registered through the `part:@sanity/base/schema-type` part. In other words, remove any import of `part:url-metadata-input/schema`.

- The input component is automatically used for the `urlWithMetadata` type, unless a different one is explicitly defined on a per-field basis. In other words, remove any import of `part:url-metadata-input/input` and any defininition of `inputComponent: UrlMetadataInput` on your fields.
