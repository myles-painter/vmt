export {
  login,
  signup,
  getUser,
  gotUser,
  updateUser,
  googleLogin,
  updateUserRooms,
  updateUserCourses,
  clearNotification,
  updateUserAccessNtfs,
  updateUserActivities,
  updateUserCourseTemplates,
  removeUserCourse,
  removeUserRooms,
  removeUserActivities, // ARE WE STORING ACTIVITIES ON THE USER OBJECT?
  removeNotification,
  addUserRooms,
  addNotification,
  addUserCourses,
  updateUserResource,
  logout,
  toggleJustLoggedIn,
} from './user';
export {
  fail,
  start,
  clear,
  success,
  clearError,
  accessSuccess,
} from './loading';
export {
  getRooms,
  getRoom,
  gotRooms,
  getRoomsIds,
  createRoom,
  gotCurrentRoom,
  getCurrentRoom,
  clearCurrentRoom,
  createdRoomConfirmed,
  populateRoom,
  updateRoom,
  updatedRoom,
  joinRoom,
  leaveRoom,
  removeRoom,
  updateRoomMembers,
  enterRoomWithCode,
  addRoomMember,
  removeRoomMember,
  roomsRemoved,
  destroyRoom,
  createRoomFromActivity,
  updateRoomTab,
  setRoomStartingPoint,
  addChatMessage,
} from './rooms';
export {
  addCourse,
  addCourseRooms,
  getCourses,
  getCoursesIds,
  getCourse,
  gotCourses,
  removeCourse,
  removeCourseRoom,
  updateCourse,
  updatedCourse,
  createCourse,
  createdCourses,
  updateCourseRooms,
  updateCourseActivities,
  clearCurrentCourse,
  updateCourseMembers,
  addCourseMember,
  removeCourseMember,
} from './courses';
export {
  getCourseTemplates,
  gotCourseTemplates,
  createCourseTemplate,
  createdCourseTemplate,
} from './courseTemplates';
export {
  getActivities,
  gotActivities,
  getActivitiesIds,
  getCurrentActivity,
  clearCurrentActivity,
  gotCurrentActivity,
  createActivity,
  createdActivityConfirmed,
  removeActivity,
  activitiesRemoved,
  updateActivity,
  updatedActivity,
  copyActivity,
  setActivityStartingPoint,
  updateActivityTab,
  updatedActivityTab,
} from './activities';
export {
  joinWithCode,
  requestAccess,
  grantAccess,
} from './access'
