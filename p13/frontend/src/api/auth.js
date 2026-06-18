import request from './request';

export const sendCode = (email) => {
  return request.post('/auth/send-code', { email });
};

export const register = (data) => {
  return request.post('/auth/register', data);
};

export const login = (data) => {
  return request.post('/auth/login', data);
};

export const getCurrentUser = () => {
  return request.get('/auth/me');
};
