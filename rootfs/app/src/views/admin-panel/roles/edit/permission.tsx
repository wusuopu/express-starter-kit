import React from 'react'
import { Box, Section, FormGroup, Label, FormMessage, CheckBox, EditPropertyProps  } from 'admin-bro'
import _ from 'lodash'
import flat from 'flat'
import reduxEnhancer from '../../_common/redux-enhancer'
import { StoreProps } from '../../types.d'

const unserializer = (value: any) => {
    if (_.isPlainObject(value)) {
      return value
    } else {
      try {
        value = JSON.parse(value)
      } catch (error) {
        value = {}
      }
    }
    return value
}
const serialize = (value: string) => {
  return JSON.stringify(value)
}
type CheckGroupProps = {
  resourceName: string;
  value: {[permissionName: string]: boolean};
  onChange: (resourceName: string, value: any) => void;
}
const CheckGroup: React.FC<CheckGroupProps> = (props) => {
  let permissions = [ 'can_list', 'can_show', 'can_create', 'can_delete' ]
  const handleCheckBoxChange = (resourceName: string, permissionName: string) => (ev) => {
    let newValue = {[permissionName]: !ev.target.checked}
    let value = _.assign({}, props.value, newValue)
    props.onChange(resourceName, value)
  }
  const handleCheckAll = (ev) => {
    let newValue = _.reduce(permissions, (ret, name) => {
      ret[name] = !ev.target.checked
      return ret
    }, {})
    props.onChange(props.resourceName, newValue)
  }
  return (
    <Box>
      <Box display="flex">
        <Label mr={20}>{props.resourceName}</Label>
        <CheckBox
          checked={_.filter(permissions, p => props.value[p]).length === permissions.length}
          onChange={handleCheckAll}
        />
        <Label>选择所有</Label>
      </Box>
      <Box display="flex" flexWrap="wrap">
        {
          _.map(permissions, (permissionName) => {
            return (
              <Box key={permissionName} display="flex" mr={20}>
                <CheckBox
                  checked={_.get(props.value, permissionName)}
                  onChange={handleCheckBoxChange(props.resourceName, permissionName)}
                  name={permissionName}
                />
                <Label>{permissionName}</Label>
              </Box>
            )
          })
        }
      </Box>
    </Box>
  )
}
const Permission: React.FC<StoreProps & EditPropertyProps> = (props) => {
  const { property, record, onChange } = props
  const error = record.errors && record.errors[property.name]
  let resources = _.map(props.store.resources, r => r.name)
  let value = unserializer(flat.unflatten(record.params)[property.name])

  const handleCheckBoxChange = (resourceName: string, newValue: any) => {
    value = _.assign({}, value, {[resourceName]: newValue })
    onChange(property.name, serialize(value))
  }
  return (
    <FormGroup error={!!error}>
      <Label htmlFor={property.name}>{property.label}</Label>
      <Section>
        <Box>
          {
            _.map(resources, (resourceName) => {
              return (
                <CheckGroup
                  key={resourceName}
                  resourceName={resourceName}
                  onChange={handleCheckBoxChange}
                  value={_.get(value, resourceName, {})}
                />
              )
            })
          }
        </Box>
      </Section>
      <FormMessage>{error && error.message}</FormMessage>
    </FormGroup>
  )
}

export default reduxEnhancer(Permission)
