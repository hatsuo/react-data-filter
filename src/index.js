import PropTypes from 'prop-types'
import React from 'react'
import resolveElement, { renderProps } from 'react-resolve-element'
import _ from 'lodash'

class DataFilter extends React.Component {
  static propTypes = {
    data: PropTypes.array,
    filters: PropTypes.arrayOf(PropTypes.shape({
      key: PropTypes.string.isRequired,
      resolveValue: PropTypes.func.isRequired,
    })),

    ...renderProps,
  }

  constructor(props) {
    super(props)
    this.updateSelection = this.updateSelection.bind(this)
    this.clearSelection = this.clearSelection.bind(this)
    this.resolveFilters = this.resolveFilters.bind(this)
    this.injectSelections = this.injectSelections.bind(this)
    this.filterData = this.filterData.bind(this)

    this.state = {
      filters: this.resolveFilters(props),
      selections: {},
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      filters: this.resolveFilters(nextProps),
      selections: {},
    })
  }

  updateSelection(filterKey, values) {
    this.setState(_.set(this.state, ['selections', filterKey], values))
  }

  clearSelection() {
    this.setState({ selections: {} })
  }

  resolveFilters({ filters, data }) {
    return _
      .chain(filters)
      .map(({ resolveValue, ...filter }) => ({
        ...filter,
        options: _
          .chain(data)
          .map(resolveValue)
          .uniq()
          .value(),
        setSelection: (newSelection) => this.updateSelection(filter.key, newSelection),
      }))
      .filter(({ options }) => options.length > 0)
      .value()
  }

  injectSelections() {
    return _.map(this.state.filters, (filter) => ({
      ...filter,
      selection: this.state.selections[filter.key] || [],
    }))
  }

  filterData() {
    return _.filter(this.props.data, (elem) => _.reduce(
      this.props.filters,
      (prevData, { key, resolveValue }) => {
        const values = this.state.selections[key]
        return prevData && (!values || !values.length || _.includes(values, resolveValue(elem)))
      },
      true
    ))
  }

  render() {
    const none = null

    const filters = this.injectSelections()
    const clearSelection = this.clearSelection
    const data = this.filterData()

    const { component, render, children, ...props } = this.props
    const childProps = { ...props, filters, clearSelection, data }

    return resolveElement({ component, render, children }, childProps, none)
  }
}

export default DataFilter
