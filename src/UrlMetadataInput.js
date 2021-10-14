// @todo Maybe clean up complexity?
/* eslint-disable complexity */
// @todo Also maybe clean up nested callbacks for better readability
/* eslint-disable max-nested-callbacks */
import React, {useState, useCallback, useRef, useMemo} from 'react'
import PropTypes from 'prop-types'
import {FormBuilderInput} from '@sanity/form-builder/lib/FormBuilderInput'
import PatchEvent, {set, unset} from '@sanity/form-builder/PatchEvent'
import {FormFieldSet} from '@sanity/base/components'
import client from 'part:@sanity/base/client'

import {FormField} from '@sanity/base/components'
import {TextInput, Button, Flex, Box, Stack, useToast} from '@sanity/ui'
import {useId} from '@reach/auto-id'
import {ChangeIndicatorForFieldPath} from '@sanity/base/change-indicators'

const metaFieldNames = ['meta', 'openGraph']
const count = (obj) => Object.keys(obj || {}).length
const sanityClient = client.withConfig({apiVersion: 'v1'})

const UrlMetadataInput = React.forwardRef((props, forwardedRef) => {
  const {
    value,
    compareValue,
    type,
    level,
    onFocus,
    onBlur,
    onChange,
    focusPath,
    readOnly,
    markers,
    presence,
  } = props
  const resolvedUrl = value && value.resolvedUrl
  const [hasEdited, setHasEdited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const requestRef = useRef()
  const inputId = useId()
  const toast = useToast()
  const collapsed = type?.options?.collapsed

  const handleUrlChange = useCallback(
    (newValue) => {
      setHasEdited(value?.url !== newValue.trim())

      if (!newValue) {
        onChange(PatchEvent.from(unset()))
        return
      }

      onChange(PatchEvent.from(unset(), set({_type: type.name, url: newValue.trim()})))
    },
    [onChange, setHasEdited, value]
  )
  const handleBeforeUrlChange = useCallback(
    (event) => {
      handleUrlChange(event.target.value)
    },
    [handleUrlChange]
  )

  const handleFocus = useCallback(() => {
    setHasEdited(false)
    onFocus(['url'])
  }, [setHasEdited, onFocus])

  // @todo Provide fetch error as validation error?
  const handleFetchError = useCallback(
    (err) => {
      // eslint-disable-next-line
      console.log('Error fetching metadata: ', err)
      toast.push({
        status: 'error',
        title: 'Failed to fetch URL metadata',
        description: err.message,
      })
      setIsLoading(false)
    },
    [toast, setIsLoading]
  )

  const handleReceiveMetadata = useCallback(
    (body, url) => {
      setIsLoading(false)
      setHasEdited(false)

      const {statusCode, resolvedUrl: newResolvedUrl, error} = body

      if (!statusCode || statusCode !== 200) {
        toast.push({
          status: 'error',
          title: 'Failed to fetch URL metadata',
          description: error ? error.message : undefined,
        })

        return
      }

      const initial = {
        _type: type.name,
        crawledAt: new Date().toISOString(),
        url,
        resolvedUrl: newResolvedUrl,
      }

      // Reduce the returned fields to only schema-defined fields,
      // ensure that numbers are actual numbers (not strings)
      const doc = metaFieldNames.reduce((data, fieldName) => {
        const metaField = type.fields.find((item) => item.name === fieldName)
        const metaValue = body[fieldName]

        if (!metaValue) {
          return data
        }

        data[fieldName] = metaField.type.fields.reduce((obj, field) => {
          let fieldValue = metaValue[field.name]
          if (!fieldValue) {
            return obj
          }

          if (field.type.jsonType === 'number') {
            fieldValue = Number(fieldValue)
          }

          obj[field.name] = fieldValue
          return obj
        }, {})

        return data
      }, initial)

      onChange(PatchEvent.from(set(doc)))
      toast.push({
        status: 'success',
        title: 'Fetched URL metadata',
      })
    },
    [toast, onChange, setIsLoading, setHasEdited]
  )

  const fetchMetadata = useCallback(
    (url) => {
      setIsLoading(true)

      if (requestRef.current) {
        requestRef.current.unsubscribe()
      }

      const options = {
        url: '/addons/crown/resolve',
        query: {url},
        json: true,
      }

      requestRef.current = sanityClient.observable
        .request(options)
        .subscribe((res) => handleReceiveMetadata(res, url), handleFetchError)
    },
    [setIsLoading, requestRef, handleReceiveMetadata, handleFetchError]
  )

  const handleBlur = useCallback(() => {
    if (!hasEdited || !value.url) {
      return
    }

    fetchMetadata(value.url)
  }, [fetchMetadata, value, hasEdited])

  const handleUrlKeyUp = useCallback(
    (evt) => {
      if (evt.key === 'Enter') {
        fetchMetadata(evt.target.value)
      }
    },
    [fetchMetadata]
  )

  const handleRefresh = useCallback(() => {
    if (!value || !value.url) {
      return
    }

    fetchMetadata(value.url)
  }, [fetchMetadata, value])

  const handleFieldChange = useCallback(
    (field, patchEvent) => {
      onChange(patchEvent.prefixAll(field.name))
    },
    [onChange]
  )

  const metaFields = useMemo(() => {
    return type.fields.filter((field) => metaFieldNames.includes(field.name))
  }, [type, metaFieldNames])
  const legends = useMemo(() => {
    return (
      resolvedUrl &&
      metaFieldNames.reduce((target, fieldName) => {
        const numItems = count(value[fieldName])
        const base = metaFields.find((field) => field.name === fieldName).type.title
        const items = numItems > 1 ? 'items' : 'item'
        target[fieldName] = `${base} (${numItems} ${items})`
        return target
      }, {})
    )
  }, [resolvedUrl, metaFields, metaFieldNames])

  // only have presence markers for the "url" field appear on the root formfield
  const urlFieldPresence = presence.filter(
    (item) => item.path.length === 1 && item.path[0] === 'url'
  )

  return (
    <Stack space={3}>
      {/* We disable __unstable_changeIndicator here because it overrides the inner ChangeIndicatorForFieldPath and causes the change indicators to not show up */}
      <FormField
        title={type.title}
        description={type.description}
        level={level}
        __unstable_markers={markers}
        __unstable_presence={urlFieldPresence}
        __unstable_changeIndicator={false}
        inputId={inputId}
      >
        <ChangeIndicatorForFieldPath
          path={['url']}
          hasFocus={focusPath?.[0] === 'url'}
          isChanged={value?.url !== compareValue?.url}
        >
          <Flex>
            <Box flex={1}>
              <TextInput
                id={inputId}
                ref={forwardedRef}
                type="url"
                value={value === undefined ? '' : value.url}
                onKeyUp={handleUrlKeyUp}
                onChange={handleBeforeUrlChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                readOnly={readOnly}
              />
            </Box>
            <Box marginLeft={1}>
              <Button
                mode="ghost"
                type="button"
                onClick={handleRefresh}
                disabled={readOnly || isLoading}
                text={isLoading ? 'Loading...' : 'Refresh'}
              />
            </Box>
          </Flex>
        </ChangeIndicatorForFieldPath>
      </FormField>

      {resolvedUrl &&
        metaFields.map((field) => (
          <FormFieldSet
            key={field.name}
            legend={legends[field.name]}
            title={legends[field.name]}
            level={level + 1}
            collapsible
            collapsed={collapsed}
          >
            <FormBuilderInput
              value={value && value[field.name]}
              compareValue={compareValue}
              type={field.type}
              onChange={(patchEvent) => handleFieldChange(field, patchEvent)}
              path={[field.name]}
              onFocus={onFocus}
              onBlur={onBlur}
              readOnly={readOnly || field.type.readOnly}
              focusPath={focusPath}
              markers={markers}
              presence={presence}
            />
          </FormFieldSet>
        ))}
    </Stack>
  )
})

UrlMetadataInput.defaultProps = {
  value: undefined,
  compareValue: undefined,
  markers: [],
  presence: [],
}

UrlMetadataInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  level: PropTypes.number.isRequired,
  type: PropTypes.object,
  readOnly: PropTypes.bool,
  value: PropTypes.shape({
    url: PropTypes.string.isRequired,
    resolvedUrl: PropTypes.string,
    crawledAt: PropTypes.string,
    meta: PropTypes.shape({
      title: PropTypes.string,
      description: PropTypes.string,
    }),
    openGraph: PropTypes.shape({
      title: PropTypes.string,
      description: PropTypes.string,
    }),
  }),
  compareValue: PropTypes.shape({
    url: PropTypes.string.isRequired,
    resolvedUrl: PropTypes.string,
    crawledAt: PropTypes.string,
    meta: PropTypes.shape({
      title: PropTypes.string,
      description: PropTypes.string,
    }),
    openGraph: PropTypes.shape({
      title: PropTypes.string,
      description: PropTypes.string,
    }),
  }),
  onFocus: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  focusPath: PropTypes.arrayOf(PropTypes.string),
  presence: PropTypes.arrayOf(PropTypes.object),
  markers: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
    })
  ),
}

export default UrlMetadataInput
