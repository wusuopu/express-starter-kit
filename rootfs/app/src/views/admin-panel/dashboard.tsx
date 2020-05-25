import React from 'react'
import { Box } from 'admin-bro'
import _ from 'lodash'
import reduxEnhancer from './_common/redux-enhancer'
import { StoreProps } from './types.d'

const Dashboard = (props: StoreProps) => {
  return (
    <Box>
      <p>
        当前用户： {_.get(props.store, 'session.email')}
        <a href={props.store.paths.logoutPath}>退出</a>
      </p>
      <p>My custom dashboard</p>
    </Box>
  )
}

export default reduxEnhancer(Dashboard)
