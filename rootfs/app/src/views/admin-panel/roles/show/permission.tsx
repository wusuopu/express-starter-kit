import React from 'react'
import { Section, FormGroup, Label, BasePropertyProps  } from 'admin-bro'
import flat from 'flat'

interface Props {
  ItemComponent: typeof React.Component;
}

const Show: React.FC<Props & BasePropertyProps> = (props) => {
  let { property, record } = props
  let params = flat.unflatten(record.params)

  return (
    <FormGroup>
      <Label>{property.label}</Label>
      <Section>
        <span>{JSON.stringify(params[property.name])}</span>
      </Section>
    </FormGroup>
  )
}

export default Show
