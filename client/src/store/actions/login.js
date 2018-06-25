import * as actionTypes from './actionTypes';
import auth from '../../utils/auth';
export const loginStart = () => {
  return {
    type: actionTypes.LOGIN_START
  }
}

export const loginSuccess = authData => {
  return {
    type: actionTypes.LOGIN_SUCCESS,
    authData: authData
  }
}

export const loginFail = err => {
  return {
    type: actionTypes.LOGIN_FAIL,
    error: err
  }
}

export const login = (email, password) => {
  return dispatch => {
    dispatch(loginStart());
    auth.login(email, password)
    .then(result => {
      console.log(result);
      dispatch(loginSuccess(result))
    })
    .catch(err => {
      console.log(err);
      dispatch(loginFail(err))
    })
  }
}
