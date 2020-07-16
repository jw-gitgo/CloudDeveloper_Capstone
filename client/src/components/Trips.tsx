import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'

import { createTrip, deleteTrip, getTrips, patchTrip } from '../api/trips-api'
import Auth from '../auth/Auth'
import { Trip } from '../types/Trip'

interface TripsProps {
  auth: Auth
  history: History
}

interface TripsState {
  startPoint: string
  endPoint: string
  trips: Trip[]
  newTripName: string
  loadingTrips: boolean
}

export class Trips extends React.PureComponent<TripsProps, TripsState> {
  state: TripsState = {
    trips: [],
    newTripName: '',
    startPoint: '',
    endPoint: '',
    loadingTrips: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTripName: event.target.value })
  }

  onEditButtonClick = (tripId: string) => {
    this.props.history.push(`/trips/${tripId}/edit`)
  }

  onTripCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      const newTrip = await createTrip(this.props.auth.getIdToken(), {
        name: this.state.newTripName,
        startPoint: this.state.startPoint,
        endPoint: this.state.endPoint
      })
      this.setState({
        trips: [...this.state.trips, newTrip],
        newTripName: ''
      })
    } catch {
      alert('Trip creation failed')
    }
  }

  onTripDelete = async (tripId: string) => {
    try {
      await deleteTrip(this.props.auth.getIdToken(), tripId)
      this.setState({
        trips: this.state.trips.filter(trip => trip.tripId != tripId)
      })
    } catch {
      alert('Trip deletion failed')
    }
  }

  onTripCheck = async (pos: number) => {
    try {
      const trip = this.state.trips[pos]
      await patchTrip(this.props.auth.getIdToken(), trip.tripId, {
        name: trip.name,
        startPoint: trip.startPoint,
        endPoint: trip.endPoint
      })
      this.setState({
        trips: update(this.state.trips, {
          //[pos]: { done: { $set: !trip.done } }
        })
      })
    } catch {
      alert('Trip deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const trips = await getTrips(this.props.auth.getIdToken())
      this.setState({
        trips,
        loadingTrips: false
      })
    } catch (e) {
      alert(`Failed to fetch trips: ${e.message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">TRIPs</Header>

        {this.renderCreateTripInput()}

        {this.renderTrips()}
      </div>
    )
  }

  renderCreateTripInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New trip',
              onClick: this.onTripCreate
            }}
            fluid
            actionPosition="left"
            placeholder="Albuquerque, New Mexico to Atlanta, Georgia"
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderTrips() {
    if (this.state.loadingTrips) {
      return this.renderLoading()
    }

    return this.renderTripsList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TRIPs
        </Loader>
      </Grid.Row>
    )
  }

  renderTripsList() {
    return (
      <Grid padded>
        {this.state.trips.map((trip, pos) => {
          return (
            <Grid.Row key={trip.tripId}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onTripCheck(pos)}
                  //checked={trip.done}
                />
              </Grid.Column>
              <Grid.Column width={10} verticalAlign="middle">
                {trip.name}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {trip.startPoint}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {trip.endPoint}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(trip.tripId)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTripDelete(trip.tripId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {trip.tripIconUrl && (
                <Image src={trip.tripIconUrl} size="small" wrapped />
              )}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
