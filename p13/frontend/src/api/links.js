import request from './request';

export const createLink = (data) => {
  return request.post('/links', data);
};

export const getLinks = (params) => {
  return request.get('/links', { params });
};

export const getLink = (id) => {
  return request.get(`/links/${id}`);
};

export const updateLink = (id, data) => {
  return request.put(`/links/${id}`, data);
};

export const deleteLink = (id) => {
  return request.delete(`/links/${id}`);
};

export const getStats = (linkId) => {
  return request.get(`/stats/${linkId}`);
};
