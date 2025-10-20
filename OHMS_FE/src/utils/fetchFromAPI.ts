import axios from "axios";
// để nguyên đây, không được xóa
import { LOGIN_USER } from "../constant/enum";

export const BASE_URL = "http://localhost:8080";

export const axiosInstance = axios.create({
   baseURL: `${BASE_URL}`,
   withCredentials: true // cokkie
});

// Add a request interceptor to include the Bearer token in all requests
axiosInstance.interceptors.request.use(
   (config) => {
      const token = localStorage.getItem(LOGIN_USER);
      if (token) {
         config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
   },
   (error) => Promise.reject(error)
);
// Fetch generic data from the API
export const fetchFromAPI = async (url:string) => {
   try {
      const { data } = await axiosInstance.get(url);
      return data;
   } catch (error) {
      console.error("Error fetching from API:", error);
      throw error;
   }
};


export const fetchLoginUser = async (email: string, password: string, navigate?: (path: string) => void) => {
   
  const res = await axiosInstance.post(
      `/auth/login`,
    { email, password }, // body JSON
    {
      headers: { "Content-Type": "application/json" }, // cần dòng này
    }
  );
  
  localStorage.setItem(LOGIN_USER, res.data.results.token);
  
  try {
    const tokenString = res.data.results.token; // Lấy token string từ object
    const payload = tokenString.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));
    
    console.log('Decoded payload:', decodedPayload); // Debug
    
    // Check scope và navigate
    if (navigate) {
      if (decodedPayload.scope === 'doctor') {
        navigate('/doctor');
      } else if (decodedPayload.scope === 'patient') {
        navigate('/patient');
      } else {
        navigate('/'); // Default route
      }
    }
    

    
  } catch (error) {
    console.error('Error decoding token:', error);
  }

  return res.data;
};
export const fetchRegisterUser = async ( payload:object) => {
   try {
      const { data } = await axiosInstance.post(`/users/register`, payload,
      {
             headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
   } catch (error) {
      console.error("Error fetching from API:", error);
      throw error;
   }
}
export const fetchGetProfile = async () => {
   try {
      const { data } = await axiosInstance.get(`/users/getinfo`);
      return data;
   } catch (error) {
      console.error("Error fetching from API:", error);
      throw error;
   }
}

export const fetchLogoutUser = async () => {
   try {
      // chưa làm refreshToken nên logout tạm thời xóa token ở client
      localStorage.removeItem(LOGIN_USER);
      const { data } = await axiosInstance.post(`/auth/logout`);
      return data;
   } catch (error) {
      console.error("Error fetching from API:", error);
      throw error;
   }
}
export const fetchForgotPass = async(email : string)=>{
    try {

      const { data } = await axiosInstance.post(`/users/sendResetCode`,{email});
      console.log(data);
      
      return data;
   } catch (error) {
      console.error("Error fetching from API:", error);
      throw error;
   }
}
export const fetchResetPass = async(payload : {token:string, newPassword:string})=>{
    try {
        const { data } = await axiosInstance.post(`/users/resetPassword`, payload);
        return data;
    } catch (error) {
        console.error("Error fetching from API:", error);
        throw error;
    }
}