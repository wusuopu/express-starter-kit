import { connect } from 'react-redux'

const mapState = (store) => ({
  store
})

export default (Com) => {
  return connect(mapState, null)(Com)
}
