import React from 'react'
import { Box, BasePropertyProps, PropertyJSON, RecordJSON } from 'admin-bro'

const getValue = (property: PropertyJSON, record: RecordJSON): string => {
  let propertyName = property.name
  let value = []
  if (property.type === 'reference') {
    if (property.isArray) {
      for (let key in record.populated) {
        if (key.startsWith(`${propertyName}.`)) {
          value.push(record.populated[key].title)
        }
      }
    } else {
      value = [ record.populated[propertyName].title ]
    }
  } else {
    value = [ record.params[propertyName] ]
  }
  return value.join(', ')
}

const Roles = (props: BasePropertyProps) => {
  return (
    <Box>{getValue(props.property, props.record)}</Box>
  )
}

export default Roles
