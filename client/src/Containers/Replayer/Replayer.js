import React, { Component } from 'react';
import WorkspaceLayout from '../../Layout/Workspace/Workspace';
import { connect } from 'react-redux';
import { updateRoom } from '../../store/actions/';
import DesmosReplayer from './DesmosReplayer';
import GgbReplayer from './GgbReplayer';
import ChatReplayer from './ChatReplayer';
import ReplayControls from '../../Components/Replayer/ReplayerControls';
import moment from 'moment';
const MAX_WAIT = 10000; // 10 seconds
const BREAK_DURATION = 2000;
const PLAYBACK_FIDELITY = 100;
class Replayer extends Component {

  state = {
    playing: false,
    playbackSpeed: 1,
    logIndex: 0,
    timeElapsed: 0, // MS
    absTimeElapsed: 0,
    changingIndex: false,
    currentMembers: [],
    startTime: '',
  }

  log = this.props.room.events
    .concat(this.props.room.chat)
    .sort((a, b) => a.timestamp - b.timestamp);
  endTime = moment
    .unix(this.log[this.log.length - 1].timestamp / 1000)
    .format('MM/DD/YYYY h:mm:ss A');
  updatedLog = []
  // displayDuration = this.log.
  relativeDuration = this.log.reduce((acc, cur, idx, src) => {
    // Copy currentEvent
    let event = {...cur};
    // Add the relative Time
    event.relTime = acc;
    this.updatedLog.push(event)
    // calculate the next time
    if (src[idx + 1]) {
      let diff = src[idx + 1].timestamp - cur.timestamp
      if ( diff < MAX_WAIT) {
        return acc += diff;
      } else {
        this.updatedLog.push({
          synthetic: true,
          message: `No activity...skipping ahead to ${moment.unix(src[idx + 1].timestamp/1000).format('MM/DD/YYYY h:mm:ss A')}`,
          relTime: acc += BREAK_DURATION,
        })
        return acc += BREAK_DURATION;
      }
    } else return acc;
  }, 0)

  componentDidMount() {
    const updatedMembers = [...this.state.currentMembers];
    if (this.log[0].autogenerated) {
      // DONT NEED TO CHECK IF THEYRE ENTERING OR EXITING, BECAUSE ITS THE FIRST EVENT THEY MUST
      // BE ENTERING
      console.log(this.log)
      updatedMembers.push({user: this.log[0].user});
    }
    this.setState({
      startTime: moment
        .unix(this.log[0].timestamp / 1000)
        .format('MM/DD/YYYY h:mm:ss A'),
      currentMembers: updatedMembers
    })
  }


  componentDidUpdate(prevProps, prevState){
    if (!prevState.playing && this.state.playing && this.state.logIndex < this.updatedLog.length) {
      this.playing();
    }
    else if (!this.state.playing && this.interval){clearInterval(this.interval)}
  }

  playing = () => {
    this.interval = setInterval(() => {
      let timeElapsed = this.state.timeElapsed;
      let logIndex = this.state.logIndex;
      let currentMembers = [...this.state.currentMembers]
      let startTime = this.state.startTime
      let absTimeElapsed = this.state.absTimeElapsed;
      timeElapsed += PLAYBACK_FIDELITY * this.state.playbackSpeed;
      absTimeElapsed += PLAYBACK_FIDELITY * this.state.playbackSpeed;
      const nextEvent = this.updatedLog[this.state.logIndex + 1];
      if (!nextEvent) {
        return this.setState({playing: false})
      }
      if (timeElapsed >= nextEvent.relTime) {
        logIndex++
        if (nextEvent.autogenerated) {
          if (nextEvent.text.includes('joined')) {
           currentMembers.push({user: nextEvent.user})
          }
          else {currentMembers = currentMembers.filter(u => {
            console.log(u)
            return u.user._id !== nextEvent.user._id
          })}
        }
        if (this.updatedLog[this.state.logIndex].synthetic) {
          startTime = moment(nextEvent.timestamp).format('MM/DD/YYYY h:mm:ss A');
          absTimeElapsed = 0;
        }
      }
      this.setState(prevState => ({
        logIndex, timeElapsed, currentMembers,
        startTime, absTimeElapsed,
      }))
    }, PLAYBACK_FIDELITY)
  }


  goToTime = (percent) => {
    console.log("GOIN GTO TIME")
    let logIndex;
    let timeElapsed = percent  * this.relativeDuration
    if (percent === 1) {
      logIndex = this.updatedLog.length - 1;
      timeElapsed = this.relativeDuration
    }
    else {
      this.updatedLog.some((entry, i) => {
        if (entry.relTime > timeElapsed) {
          logIndex = i === 0 ? 0 : i - 1;
          return true;
        } return false;
      })
    }
    this.setState({timeElapsed, logIndex, playing: false, changingIndex: true,})
    // setTimeout(() => this.setState({playing:}))
  }

  pausePlay = () => {
    this.setState(prevState => ({
      playing: !prevState.playing
    }))
  }

  reset = () => {
    this.setState({changingIndex: false})
  }

  setCurrentMembers = (currentMembers) => {
    console.log('seeting current members: ', currentMembers)
    this.setState({currentMembers,})
  }

  setSpeed = speed => {
    this.setState({playbackSpeed: speed})
  }

  render() {
    console.log(this.state.currentMembers)
    const { room } = this.props
    const event = this.log[this.state.logIndex] || {};
    return (
      <WorkspaceLayout
        activeMember = {event.user}
        members = {this.state.currentMembers}
        graph = {room.roomType === 'geogebra' ?
          () => <GgbReplayer
            log={this.updatedLog}
            index={this.state.logIndex}
            skipping={this.state.changingIndex}
            reset={this.reset} />
        :
        () => <DesmosReplayer
          log={this.updatedLog}
          index={this.state.logIndex}
          skipping={this.state.changingIndex}
          reset={this.reset} />}

        chat = {() =>
          <ChatReplayer
            log={this.updatedLog}
            index={this.state.logIndex}
            skipping={this.state.changingIndex}
            reset={this.reset}
            setCurrentMembers={this.setCurrentMembers}
          />}
        replayer={() =>
          (<ReplayControls
            playing={this.state.playing}
            pausePlay={this.pausePlay}
            duration={this.relativeDuration}
            startTime={this.state.startTime}
            absTimeElapsed={this.state.absTimeElapsed}
            goToTime={this.goToTime}
            speed={this.state.playbackSpeed}
            setSpeed={this.setSpeed}
            relTime={this.state.timeElapsed}
            index={this.state.logIndex}
            log={this.updatedLog}
            endTime={this.endTime}
           />)
        }
      />
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    room: state.rooms.byId[ownProps.match.params.room_id],
    user: state.user,
    loading: state.loading.loading,
  }
}

export default connect(mapStateToProps, { updateRoom, })(Replayer);
