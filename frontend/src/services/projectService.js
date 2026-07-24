import api from "./api";

export const projectService = {
  /**
   * Lấy tất cả dự án
   */
  getAllProjects: async () => {
    const { data } = await api.get('/projects');
    return data;
  },

  /**
   * Lấy dự án theo Client ID
   */
  getProjectsByClient: async (clientId) => {
    const { data } = await api.get(`/projects/client/${clientId}`);
    return data;
  },

  /**
   * Lấy dự án của tôi (Client)
   */
  getMyProjects: async () => {
    const { data } = await api.get('/projects/me');
    return data;
  },

  /**
   * Tạo dự án mới
   */
  createProject: async (projectData) => {
    const { data } = await api.post('/projects', projectData);
    return data;
  },

  /**
   * Cập nhật dự án
   */
  updateProject: async (id, projectData) => {
    const { data } = await api.put(`/projects/${id}`, projectData);
    return data;
  },

  /**
   * Xóa dự án
   */
  deleteProject: async (id) => {
    const { data } = await api.delete(`/projects/${id}`);
    return data;
  }
};
