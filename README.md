# sanity-plugin-url-metadata-input

URL input for [Sanity](https://sanity.io/) that retrieves metadata (title, description) along with [opengraph](http://ogp.me/) information.

Note: The resolving is done by an addon to the Sanity API and usage will at some point be an opt-in addon that is billed.

## Installation

```
sanity install url-metadata-input
```

## Usage

Import the type into your schema:

```js
import {schema as urlWithMetadata} from 'part:url-metadata-input/input'

// [...]
export default createSchema({
  types: [
    // [...]
    urlWithMetadata
  ]
})
```

Then use it in your schema types:

```js
import {Input as UrlWithMetadataInput} from 'part:url-metadata-input/input'

// [...]
{
  fields: [
    // [...]
    {
      name: 'relatedUrl',
      title: 'Related URL',
      type: 'urlWithMetadata',
      inputComponent: UrlWithMetadataInput
    }
  ]
}
```

## Data model

Note: Empty keys are not included

```js
{
  _type: 'urlWithMetadata',

  // Raw user-input URL
  url: 'http://sanity.io',

  // Resolved URL after redirects
  resolvedUrl: 'https://sanity.io/',

  // Date when the metada resolving was performed
  crawledAt: '2017-09-01T09:48:35.501Z',

  // Basic metadata (from <head> of the page)
  meta: {
    title: 'Sanity – The fully customizable, headless CMS',
    description: 'Manage structured data collaboratively [...]'
  },

  // OpenGraph data (camelcased keys, eg `og:video:width` == `videoWidth`)
  // See http://ogp.me/ for more information
  openGraph: {
    title: '...',
    description: '...',
    siteName: '...',
    type: '...',
    url: '...',
    image: '...',
    imageAlt: '...',
    imageSecureUrl: '...',
    imageType: '...',
    imageHeight: '...',
    imageWidth: '...',
    audio: '...',
    audioSecureUrl: '...',
    audioType: '...',
    determiner: '...',
    locale: '...',
    video: '...',
    videoSecureUrl: '...',
    videoType: '...',
    videoHeight: '...',
    videoWidth: '...',
  }
}
```

## License

MIT-licensed. See LICENSE.
