import React, { Component } from 'react';
import WorkspaceLayout from '../../Layout/Workspace/Workspace';
import Modal from '../../Components/UI/Modal/Modal.js'
import { connect } from 'react-redux';
import { updateRoom, populateRoom } from '../../store/actions/';
import {
  ReplayerControls,
  DesmosReplayer,
  GgbReplayer,
  ChatReplayer,
} from './index';
import { CurrentMembers } from '../../Components';
import { Tabs } from '../Workspace';
import throttle from 'lodash/throttle';
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
    loading: true,
    currentTab: 0,
  }


  componentDidMount() {
    // @TODO We should never populate the tabs events before getting here
    // we dont need them for the regular room activity only for playback
    this.props.populateRoom(this.props.match.params.room_id)
  }


  componentDidUpdate(prevProps, prevState){
    if (prevProps.loading && !this.props.loading) {
      this.log = this.props.room.tabs
        .reduce((acc, tab) => {
          return acc.concat(tab.events)
        }, [])
      this.log = this.log
        .concat(this.props.room.chat)
        .sort((a, b) => a.timestamp - b.timestamp);
      this.endTime = moment
        .unix(this.log[this.log.length - 1].timestamp / 1000)
        .format('MM/DD/YYYY h:mm:ss A');
        this.updatedLog = []
        // displayDuration = this.log.
        this.relativeDuration = this.log.reduce((acc, cur, idx, src) => {
          // Copy currentEvent
        let event = {...cur};
        // Add the relative Time
        event.relTime = acc;
        // ADD A TAB FOR EVENTS THAT DONT ALREADY HAVE THEM TO MAKE SKIPPING AROUND EASIER
        if (!event.tab) {
          if (!src[idx - 1]) { //IF this is the first event give it the starting tab
            event.tab = this.props.room.tabs[0]._id
          }
          else {
            event.tab = this.updatedLog[this.updatedLog.length - 1].tab //Else give it the same tabId as the event before
          }
        }
        this.updatedLog.push(event)
        // calculate the next time
        if (src[idx + 1]) {
          let diff = src[idx + 1].timestamp - cur.timestamp
          if ( diff < MAX_WAIT) {
            return acc += diff;
          }
          else {
            this.updatedLog.push({
              synthetic: true,
              message: `No activity...skipping ahead to ${moment.unix(src[idx + 1].timestamp/1000).format('MM/DD/YYYY h:mm:ss A')}`,
              relTime: acc += BREAK_DURATION,
              tab: this.updatedLog[this.updatedLog.length - 1].tab
            })
           return acc += BREAK_DURATION;
          }
        } else return acc;
      }, 0)
      const updatedMembers = [...this.state.currentMembers];
      if (this.log[0].autogenerated) {
        // DONT NEED TO CHECK IF THEYRE ENTERING OR EXITING, BECAUSE ITS THE FIRST EVENT THEY MUST
        // BE ENTERING
        updatedMembers.push({user: this.log[0].user});
      }
      this.setState({
        startTime: moment
          .unix(this.log[0].timestamp / 1000)
          .format('MM/DD/YYYY h:mm:ss A'),
        currentMembers: updatedMembers
      })
      this.setState({loading: false})
    }

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
      let nextEvent = this.updatedLog[this.state.logIndex + 1];
      let currentTab = this.state.currentTab
      if (!nextEvent) {
        return this.setState({playing: false})
      }
      if (timeElapsed >= nextEvent.relTime) { // WHAT IF ITS GREAT THAN THE NEXT...NEXT EVENT (THIS HAPPENS WHEN WE INCREASE THE PLAY SPEED) ???? NOT SURE HOW TO HANDLE
        if (nextEvent.tab) {
          this.props.room.tabs.forEach((tab, i) => {
            if (tab._id === nextEvent.tab) {
              currentTab = i;
            }
          })
        }
        logIndex++
        if (nextEvent.autogenerated) {
          if (nextEvent.text.includes('joined')) {
           currentMembers.push({user: nextEvent.user})
          }
          else if (nextEvent.text.includes('left')) {currentMembers = currentMembers.filter(u => {
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
        startTime, absTimeElapsed, changingIndex: false,
        currentTab,
      }))
    }, PLAYBACK_FIDELITY)
  }

  // Takes a % of total progress and goes to the nearest timestamp
  goToTime = throttle((percent) => {
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
  }, 70)

  pausePlay = () => {
    this.setState(prevState => ({
      playing: !prevState.playing
    }))
  }

  reset = () => {
    this.setState({changingIndex: false})
  }

  setCurrentMembers = (currentMembers) => {

    this.setState({currentMembers,})
  }

  setSpeed = speed => {
    this.setState({playbackSpeed: speed})
  }

  changeTab = index => {
    return new Promise((resolve, reject) => {
      this.setState({currentTab: index}, () => {
        resolve()
      })
    })
  }


  render() {
    let replayer = <ReplayerControls
      playing={this.state.playing}
      pausePlay={this.pausePlay}
      duration={this.relativeDuration}
      startTime={this.state.startTime}
      absTimeElapsed={this.state.absTimeElapsed}
      goToTime={this.goToTime}
      changingIndex={this.state.changingIndex}
      speed={this.state.playbackSpeed}
      setSpeed={this.setSpeed}
      relTime={this.state.timeElapsed}
      index={this.state.logIndex}
      log={this.updatedLog}
      endTime={this.endTime}
      reset={this.reset}
      currentMembers={this.state.currentMembers}
      setCurrentMembers={this.setCurrentMembers}
    />

    let chat = <ChatReplayer
      roomId={this.props.room._id}
      log={this.updatedLog}
      index={this.state.logIndex}
      changingIndex={this.state.changingIndex}
      reset={this.reset}
      setCurrentMembers={this.setCurrentMembers}
    />
    let graph;
    if (this.props.room.tabs[this.state.currentTab].tabType === 'geogebra') {
      graph = <GgbReplayer
        log={this.updatedLog}
        index={this.state.logIndex}
        changingIndex={this.state.changingIndex}
        playing={this.state.playing}
        reset={this.reset}
        changeTab={this.changeTab}
        tabs={this.props.room.tabs}
        currentTab={this.state.currentTab}
      />
    }
    if (!this.state.loading) {
      const { room, user } = this.props
      const event = this.log[this.state.logIndex] || {};
      return (
        <WorkspaceLayout
          graph={graph}
          room={room}
          user={user}
          tabs={<Tabs tabs={room.tabs} changeTabs={this.changeTab}/>}
          currentMembers={<CurrentMembers members={this.state.currentMembers} expanded={true} activeMember={event.user}/>}
          bottomLeft={replayer}
          current
          activeMember={event.user}
          replayerControls={replayer}
        />
      )
    }
    else return <Modal show={this.state.loading} message='Loading...'/>
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    room: state.rooms.byId[ownProps.match.params.room_id],
    user: state.user,
    loading: state.loading.loading,
  }
}

export default connect(mapStateToProps, { updateRoom, populateRoom })(Replayer);